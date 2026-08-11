import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import {
  getListingInventory,
  removeListingOfferings,
} from "@/lib/etsy/inventory";
import { logAudit } from "@/lib/audit";

export const maxDuration = 300;

/**
 * Dar genişlik bandı temizliği (gözetimli, tek seferlik / idempotent).
 *
 * 2026-08 katalog kararı (revize):
 *  - Milgrain ailesi: DOKUNULMAZ — 2mm satılabilir bant, en dar 2mm kalır.
 *    (İlk turda "2mm kalksın" planlanmıştı; karar geri alındı.)
 *  - Hammered (1 listing): 2/3mm kalkar → en dar 4mm.
 *    (İlk turda 2/3/4/5 planlanmıştı; 4mm ve 5mm kalıyor.)
 * (Yeni TTG ailesi Etsy'ye hiç gitmediği için panelde doğrudan temizlendi;
 *  basketweave/ribbed zaten 6mm'den başlıyor.)
 *
 * Hedefler SKU önekiyle DEĞİL etsy_listing_id ile sabitlenir: SKU sahipliği
 * kopya listing'lerde el değiştirebiliyor (second-brain "aynı ürün" dersi),
 * listing kimliği ise sabittir.
 *
 * Auth (üç yol, sku-untangle ile aynı desen):
 *  1. `Authorization: Bearer $CRON_SECRET`
 *  2. `?token=$PRUNE_ONE_SHOT_TOKEN` (env tanımlıysa)
 *  3. `?token=` → `ops_tokens` (0136): SHA-256 hash CAS tüketimi —
 *     tek kullanımlık, süreli, çift kullanım imkânsız. CRON_SECRET
 *     env'i boş/silinmiş olsa da servis rolü token üretip koşabilir.
 * Varsayılan KURU ÇALIŞMA — gerçek yazma için `?apply=1`.
 */

type Target = { listingId: number; widths: number[]; label: string };

const TARGETS: Target[] = [
  // ── Hammered: yalnız 2/3mm — 4mm ve üstü SATILMAYA DEVAM EDER ────────
  { listingId: 4543442596, widths: [2, 3], label: "10K Hammered Milgrain" },
  // ── Milgrain ailesi bilerek YOK: 2mm dahil tüm bant korunuyor. ───────
];

const ONE_SHOT = process.env.PRUNE_ONE_SHOT_TOKEN;

/** SKU'nun genişlik alanı (`...-<N>MM-<beden>`). Desen tutmuyorsa null → asla
 *  kaldırılmaz (tanımadığımız SKU şemasına dokunmayız). */
function widthOf(sku: string): number | null {
  const m = /-(\d+)MM-[0-9.]+$/.exec(sku.trim());
  return m ? Number(m[1]) : null;
}

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return false;
  if (ONE_SHOT != null && ONE_SHOT.length > 0 && token === ONE_SHOT) {
    return true;
  }

  // ops_tokens (0136) — CAS tüketimi: koşullu UPDATE yalnız bir çağrıda
  // satır döndürür, aynı token ikinci kez asla geçmez.
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "prune-widths")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const only = url.searchParams.get("listing");
  const targets = only
    ? TARGETS.filter((t) => String(t.listingId) === only)
    : TARGETS;
  if (targets.length === 0) {
    return NextResponse.json({ error: "no matching target" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name")
    .eq("name", "EON")
    .maybeSingle();
  if (orgErr || !org) {
    return NextResponse.json(
      { error: orgErr?.message ?? "EON org not found" },
      { status: 500 },
    );
  }

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(org.id);
  } catch (e) {
    return NextResponse.json(
      {
        error: "etsy not connected",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 503 },
    );
  }

  const results: Record<string, unknown>[] = [];

  for (const t of targets) {
    const drop = new Set(t.widths);
    const shouldRemove = (sku: string) => {
      const w = widthOf(sku);
      return w != null && drop.has(w);
    };

    const row: Record<string, unknown> = {
      listingId: t.listingId,
      label: t.label,
      widths: t.widths,
    };

    try {
      // 1) Etsy'de neyin hedeflendiğini önce SAY (kuru çalışmada tek iş bu).
      const before = await getListingInventory(client, t.listingId);
      const liveBefore = (before.products ?? []).filter((p) => !p.is_deleted);
      const doomed = liveBefore
        .map((p) => (p.sku ?? "").trim())
        .filter((s) => shouldRemove(s));
      row.etsyBefore = liveBefore.length;
      row.wouldRemove = doomed.length;
      row.sampleSkus = doomed.slice(0, 3);

      if (!apply) {
        results.push({ ...row, mode: "dry-run" });
        continue;
      }
      if (doomed.length === 0) {
        results.push({ ...row, status: "unchanged" });
        continue;
      }

      // 2) Etsy'den kaldır.
      const out = await removeListingOfferings(
        client,
        t.listingId,
        shouldRemove,
      );
      row.status = out.status;
      row.removed = out.removed;
      if (out.detail) row.detail = out.detail;
      if (out.status === "error") {
        results.push(row);
        continue;
      }

      // 3) READ-BACK: "200 OK" teslim sayılmaz (second-brain kuralı) — aynı
      //    turda geri oku ve hedefin gerçekten gittiğini kanıtla.
      const after = await getListingInventory(client, t.listingId);
      const liveAfter = (after.products ?? []).filter((p) => !p.is_deleted);
      const stillThere = liveAfter
        .map((p) => (p.sku ?? "").trim())
        .filter((s) => shouldRemove(s));
      row.etsyAfter = liveAfter.length;
      row.verified = stillThere.length === 0;
      if (stillThere.length > 0) {
        row.stillThere = stillThere.slice(0, 5);
        results.push(row);
        continue; // Etsy'de duruyorsa paneli DEĞİŞTİRME (ayna bozulmasın).
      }

      // 4) Panel aynasını eşitle: kaldırılan SKU'ları sil, çapa fiyatı tazele.
      const { data: prod } = await admin
        .from("products")
        .select("id")
        .eq("org_id", org.id)
        .eq("etsy_listing_id", t.listingId)
        .maybeSingle();
      const productId = (prod as { id: string } | null)?.id ?? null;
      row.productId = productId;

      if (productId) {
        const { data: vRows } = await admin
          .from("product_variants")
          .select("id, sku")
          .eq("org_id", org.id)
          .eq("product_id", productId);
        const kill = ((vRows ?? []) as { id: string; sku: string | null }[])
          .filter((v) => shouldRemove((v.sku ?? "").trim()))
          .map((v) => v.id);
        if (kill.length > 0) {
          const { error: delErr } = await admin
            .from("product_variants")
            .delete()
            .in("id", kill);
          row.panelDeleted = delErr ? 0 : kill.length;
          if (delErr) row.panelError = delErr.message;
        } else {
          row.panelDeleted = 0;
        }

        const { data: rest } = await admin
          .from("product_variants")
          .select("price_cents")
          .eq("org_id", org.id)
          .eq("product_id", productId)
          .not("price_cents", "is", null)
          .order("price_cents", { ascending: true })
          .limit(1);
        const anchor = (rest ?? [])[0]?.price_cents as number | undefined;
        if (anchor != null) {
          await admin
            .from("products")
            .update({ price_cents: anchor })
            .eq("id", productId)
            .eq("org_id", org.id);
          row.newAnchorCents = anchor;
        }

        await logAudit(admin, {
          orgId: org.id,
          action: "etsy.variant_sync",
          entityType: "products",
          entityId: productId,
          summary:
            `Dar genişlik temizliği (listing ${t.listingId}): ` +
            `${t.widths.join("/")}mm kaldırıldı — Etsy ${out.removed} offering, ` +
            `panel ${row.panelDeleted ?? 0} varyant.`,
          source: "etsy",
        });
      }
    } catch (e) {
      row.status = "error";
      row.detail = e instanceof Error ? e.message : String(e);
    }
    results.push(row);
  }

  const errors = results.filter((r) => r.status === "error").length;
  return NextResponse.json({
    ok: errors === 0,
    apply,
    org: org.name,
    targets: targets.length,
    errors,
    results,
  });
}
