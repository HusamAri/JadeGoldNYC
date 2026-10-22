import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getListing } from "@/lib/etsy/listing";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import type { EtsyListResponse, EtsyShopSection } from "@/lib/etsy/types";
import { planSeo, rowProblems, sameTags, type SeoMatrixRow } from "@/lib/etsy/seo-apply";
import { logAudit } from "@/lib/audit";
import eonMatrix from "@/docs/eon/seo/2026-10-21-etsy-keyword/data/optimization-matrix.json";
import basMatrix from "@/docs/artifact-studio/seo/2026-10-21-etsy-keyword/data/apply-matrix.json";
import eonTitles1022 from "@/docs/eon/seo/2026-10-22-title-pass/apply-matrix.json";
import basTitles1022 from "@/docs/artifact-studio/seo/2026-10-22-title-pass/apply-matrix.json";

export const maxDuration = 120;

/**
 * SEO-APPLY: org'un keyword matrisini Etsy'ye yazar. Matrisler:
 *  - EON: docs/eon/seo/2026-10-21-etsy-keyword/data/optimization-matrix.json
 *  - by Artifact Studio Jewelry: docs/artifact-studio/seo/2026-10-21-etsy-keyword/
 *    data/apply-matrix.json (paketin matrisinden scripts/to_apply_json.py üretir)
 *  - `?pass=titles-2026-10-22`: kısa başlık geçişi (playbook 03, <15 kelime). "Önce" hâli
 *    2026-10-21 matrisinin yazdığı başlık; tag aynı kalır. Üreteç + kapı:
 *    scripts/seo/title_pass_2026_10_22.py.
 * Yazılan: YALNIZ başlık, 13 tag ve mağaza bölümü. Fiyat, adet, varyasyon, fotoğraf,
 * açıklama, kargo ve iade politikasına dokunmaz; listing açmaz/silmez.
 *
 * Sözleşme:
 *  - `?org=` ZORUNLU; yalnız MATRICES'te matrisi olan org. Id o org'un matrisinde olmalı.
 *  - `?ids=` virgüllü listing id'leri, en çok 10. Her id matriste olmalı.
 *  - Varsayılan KURU: canlıyı okur, planı döner. `?apply=1` yazar.
 *  - Canlı başlık/tag matrisin "önce" hâline uymuyorsa (sahip 2026-10-21'den sonra
 *    elle düzenlemiş) listing `live-changed` ile ATLANIR.
 *  - Apply sonrası AYNI turda geri okuma; panel aynası (products.title/tags/
 *    etsy_section_id) yalnız doğrulanan listing için güncellenir; audit satırı
 *    önce/sonra hâlini taşır (geri alma kaydı).
 *  - Süre bütçesi: 80 sn'den sonra yeni listing başlatılmaz, `deferred` döner.
 */

/** Anahtar: org adı (varsayılan geçiş) ya da `org#pass`. */
const MATRICES: Record<string, Map<string, SeoMatrixRow>> = Object.fromEntries(
  (
    [
      ["EON", eonMatrix],
      ["by Artifact Studio Jewelry", basMatrix],
      ["EON#titles-2026-10-22", eonTitles1022],
      ["by Artifact Studio Jewelry#titles-2026-10-22", basTitles1022],
    ] as const
  ).map(([key, rows]) => [key, new Map((rows as unknown as SeoMatrixRow[]).map((r) => [r.id, r]))]),
);
const MAX_IDS = 10;
const BUDGET_MS = 80_000;

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "seo-apply")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

export async function GET(request: Request) {
  const started = Date.now();
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const orgName = url.searchParams.get("org");
  const pass = url.searchParams.get("pass");
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const matrixKey = orgName ? (pass ? `${orgName}#${pass}` : orgName) : null;
  const BY_ID = matrixKey ? MATRICES[matrixKey] : undefined;
  if (!BY_ID) {
    return NextResponse.json({ error: `org (ve pass) zorunlu, matrisi olanlar: ${Object.keys(MATRICES).join(", ")}` }, { status: 400 });
  }
  if (ids.length === 0 || ids.length > MAX_IDS || new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: `ids: 1-${MAX_IDS} tekil listing id` }, { status: 400 });
  }
  const unknown = ids.filter((id) => !BY_ID.has(id));
  if (unknown.length) {
    return NextResponse.json({ error: "matriste olmayan id", unknown }, { status: 400 });
  }
  const bad = ids
    .map((id) => ({ id, problems: rowProblems(BY_ID.get(id)!) }))
    .filter((x) => x.problems.length);
  if (bad.length) {
    return NextResponse.json({ error: "matris satırı Etsy kuralına uymuyor", bad }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").eq("name", orgName!).maybeSingle();
  if (!org) return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  const orgId = (org as { id: string }).id;

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(orgId);
  } catch (e) {
    return NextResponse.json({ error: "etsy not connected", detail: String(e) }, { status: 503 });
  }

  try {
    const shopId = await client.requireShopId();
    const page = await client.get<EtsyListResponse<EtsyShopSection>>(etsyPaths.shopSections(shopId));
    const sections = new Map<string, number>();
    for (const s of page.results ?? []) {
      if (s.shop_section_id != null && s.title) sections.set(s.title, s.shop_section_id);
    }

    const results: Record<string, unknown>[] = [];
    for (const id of ids) {
      if (Date.now() - started > BUDGET_MS) {
        results.push({ id, status: "deferred" });
        continue;
      }
      const row = BY_ID.get(id)!;
      const listingId = Number(id);
      try {
        const live0 = await getListing(client, listingId);
        const live = {
          title: decodeHtmlEntities(live0.title ?? ""),
          tags: live0.tags ?? [],
          state: live0.state ?? null,
          sectionId: live0.shop_section_id ?? null,
        };
        const plan = planSeo(row, live, sections);
        if (plan.action !== "write") {
          results.push({ id, status: plan.action === "skip" ? plan.reason : "already", ...("detail" in plan ? { detail: plan.detail } : {}) });
          continue;
        }
        const entry: Record<string, unknown> = {
          id,
          title: plan.title ? { from: live.title, to: plan.title } : "unchanged",
          tags: plan.tags ? { from: live.tags, to: plan.tags } : "unchanged",
          section: plan.sectionMove ? `${plan.sectionMove.from} -> ${plan.sectionMove.to}` : plan.sectionNote ?? "unchanged",
        };
        if (!apply) {
          results.push({ ...entry, status: "dry" });
          continue;
        }

        const form: Record<string, string> = {};
        if (plan.title) form.title = plan.title;
        if (plan.tags) form.tags = plan.tags.join(",");
        if (plan.sectionMove) form.shop_section_id = String(plan.sectionMove.toId);
        await client.requestForm<unknown>("PATCH", etsyPaths.shopListing(shopId, listingId), form);

        // Geri okuma: "200 OK" teslim sayılmaz.
        const after = await getListing(client, listingId);
        const kalan: string[] = [];
        if (decodeHtmlEntities(after.title ?? "") !== row.new_title) kalan.push("baslik");
        if (!sameTags(after.tags ?? [], row.new_tags)) kalan.push("tags");
        if (plan.sectionMove && (after.shop_section_id ?? null) !== plan.sectionMove.toId) kalan.push("bolum");

        const { data: prod } = await admin
          .from("products")
          .select("id")
          .eq("org_id", orgId)
          .eq("etsy_listing_id", listingId)
          .maybeSingle();
        const productId = (prod as { id: string } | null)?.id ?? null;
        if (kalan.length === 0 && productId) {
          const mirror: Record<string, unknown> = { title: row.new_title, tags: row.new_tags };
          if (plan.sectionMove) mirror.etsy_section_id = plan.sectionMove.toId;
          await admin.from("products").update(mirror).eq("id", productId).eq("org_id", orgId);
        }
        await logAudit(admin, {
          orgId,
          action: "etsy.seo_push",
          entityType: "product",
          entityId: productId,
          summary:
            `SEO matrisi (${pass ?? "2026-10-21"}) listing ${listingId}: ` +
            [plan.title ? "başlık" : null, plan.tags ? "13 tag" : null, plan.sectionMove ? `bölüm ${plan.sectionMove.to}` : null]
              .filter(Boolean)
              .join(" + ") +
            `; read-back ${kalan.length === 0 ? "doğrulandı" : `BAŞARISIZ (${kalan.join(", ")})`}`,
          diff: {
            before: { title: live.title, tags: live.tags, shop_section_id: live.sectionId },
            after: { title: row.new_title, tags: row.new_tags, shop_section_id: plan.sectionMove?.toId ?? live.sectionId },
          },
          source: "ops/seo-apply",
        });
        results.push({ ...entry, status: kalan.length === 0 ? "applied" : "verify-failed", kalan });
      } catch (e) {
        results.push({ id, status: "error", error: String(e).slice(0, 400) });
      }
    }

    const counts: Record<string, number> = {};
    for (const r of results) counts[String(r.status)] = (counts[String(r.status)] ?? 0) + 1;
    return NextResponse.json({
      ok: !results.some((r) => r.status === "error" || r.status === "verify-failed"),
      apply,
      counts,
      results,
      ms: Date.now() - started,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
