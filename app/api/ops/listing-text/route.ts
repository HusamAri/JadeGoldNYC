import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import { assertPublicText } from "@/lib/etsy/strip-internal";
import {
  planListingText,
  specProblems,
  unverifiedFields,
  type ListingTextSpec,
  type LiveText,
} from "@/lib/etsy/listing-text";
import { logAudit } from "@/lib/audit";
import specFile from "@/docs/artifact-studio/fix-plan-2026-11-17/listing-text.json";

export const maxDuration = 120;

/**
 * LISTING-TEXT: tek bir listing'in başlık ve açıklamasını (spec'te varsa
 * tag'lerini) repodaki spec'ten yazar. Gözetimli, tek kullanımlık token.
 *
 * NEDEN VAR (2026-11-17, Leander): 4612132585 mesajlardan açılmış özel bir
 * sipariş listing'i; başlığı ürün adından ibaret, açıklaması yazım hatalı tek
 * satır ("7 inchches"). Diğer metin rotaları bir matrise ya da rewrite
 * dosyasına bağlı; tek listing'lik denetimli bir yazım yolu yoktu.
 *
 * Sözleşme:
 *  - `?org=` ZORUNLU, `?spec=<anahtar>` ZORUNLU. Metin BİREBİR spec'ten gelir,
 *    rota metin üretmez (docs/artifact-studio/fix-plan-2026-11-17/listing-text.json).
 *  - Varsayılan KURU ÇALIŞMA: canlı listing'i okur, alanlarını döker (özel
 *    listing mi, kategori, kargo profili...), spec'te `like` varsa o listing'i
 *    de yan yana döker, planı ve spec kusurlarını döner.
 *  - Yazım yalnız plan "would-write" iken: canlı metin spec'in beklediği eski
 *    hâlde olmalı. Sahip arada düzenlediyse ("live-changed") yazılmaz.
 *  - Spec kusurluysa (140 karakter, 15 kelime, kelime tekrarı, uzun tire,
 *    başka listing ile aynı başlık, iç not) yazılmaz.
 *  - Yazımdan sonra AYNI turda geri okuma; doğrulanan metin panele de yazılır.
 *    Denetim satırı önceki ve sonraki metni taşır (geri alma kaynağı).
 */

const DUMP_KEYS = [
  "state",
  "is_private",
  "listing_type",
  "quantity",
  "has_variations",
  "taxonomy_id",
  "shop_section_id",
  "shipping_profile_id",
  "return_policy_id",
  "processing_min",
  "processing_max",
  "readiness_state_id",
  "who_made",
  "when_made",
  "is_supply",
  "is_customizable",
  "is_personalizable",
  "should_auto_renew",
  "materials",
  "tags",
  "price",
  "num_favorers",
  "views",
  "created_timestamp",
  "ending_timestamp",
  "last_modified_timestamp",
] as const;

type RawListing = Record<string, unknown>;

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
    .eq("purpose", "listing-text")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

function dump(raw: RawListing): RawListing {
  const out: RawListing = {};
  for (const k of DUMP_KEYS) if (k in raw) out[k] = raw[k];
  out.title = decodeHtmlEntities(String(raw.title ?? ""));
  out.descriptionLength = String(raw.description ?? "").length;
  return out;
}

function liveText(raw: RawListing): LiveText {
  return {
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    tags: Array.isArray(raw.tags) ? (raw.tags as unknown[]).map(String) : [],
  };
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const orgName = (url.searchParams.get("org") ?? "").trim();
  const specKey = (url.searchParams.get("spec") ?? "").trim();
  const specs = specFile.specs as Record<string, ListingTextSpec>;
  const spec = Object.hasOwn(specs, specKey) ? specs[specKey] : undefined;
  if (!orgName || !spec) {
    return NextResponse.json(
      { error: "org ve geçerli spec zorunlu", specs: Object.keys(specs) },
      { status: 400 },
    );
  }
  const listingId = spec.listing;

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("name", orgName)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  const orgId = (org as { id: string }).id;

  const { data: prod } = await admin
    .from("products")
    .select("id")
    .eq("org_id", orgId)
    .eq("etsy_listing_id", listingId)
    .maybeSingle();
  if (!prod) {
    return NextResponse.json({ error: "panelde-yok", listing: listingId }, { status: 404 });
  }
  const productId = (prod as { id: string }).id;

  const { data: others } = await admin
    .from("products")
    .select("title")
    .eq("org_id", orgId)
    .eq("status", "active")
    .is("etsy_deleted_at", null)
    .neq("id", productId);
  const otherTitles = ((others ?? []) as { title: string | null }[])
    .map((o) => o.title ?? "")
    .filter(Boolean);

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(orgId);
  } catch (e) {
    return NextResponse.json(
      { error: "etsy not connected", detail: String(e) },
      { status: 503 },
    );
  }

  try {
    const raw = await client.get<RawListing>(etsyPaths.listing(listingId));
    const before = liveText(raw);
    const problems = specProblems(spec, otherTitles);
    const plan = planListingText(before, spec);

    if (!apply) {
      let like: RawListing | undefined;
      if (spec.like) {
        try {
          like = dump(await client.get<RawListing>(etsyPaths.listing(spec.like)));
        } catch (e) {
          like = { error: String(e) };
        }
      }
      return NextResponse.json({
        ok: problems.length === 0 && plan.status !== "live-changed",
        apply: false,
        spec: specKey,
        listing: listingId,
        plan,
        problems,
        live: dump(raw),
        liveDescription: decodeHtmlEntities(before.description),
        ...(like ? { like: { listing: spec.like, ...like } } : {}),
        target: {
          title: spec.title,
          descriptionLength: spec.description.length,
          tags: spec.tags ?? null,
        },
      });
    }

    if (problems.length > 0) {
      return NextResponse.json({ ok: false, error: "spec kusurlu", problems }, { status: 400 });
    }
    if (plan.status === "live-changed") {
      return NextResponse.json(
        { ok: false, status: "live-changed", fields: plan.fields, listing: listingId },
        { status: 409 },
      );
    }
    if (plan.status === "already") {
      return NextResponse.json({ ok: true, apply: true, status: "already", listing: listingId });
    }

    assertPublicText(spec.description, "Spec açıklaması");
    const form: Record<string, string> = {};
    if (plan.fields.includes("title")) form.title = spec.title.trim();
    if (plan.fields.includes("description")) form.description = spec.description;
    if (plan.fields.includes("tags") && spec.tags) form.tags = spec.tags.join(",");

    const shopId = await client.requireShopId();
    await client.requestForm<unknown>("PATCH", etsyPaths.shopListing(shopId, listingId), form);

    // Geri okuma: "200 OK" teslim sayılmaz.
    const afterRaw = await client.get<RawListing>(etsyPaths.listing(listingId));
    const after = liveText(afterRaw);
    const kalan = [...unverifiedFields(after, spec)];
    // Metin yazımı listing'in durumuna ve özel/açık oluşuna dokunmamalı.
    if ((afterRaw.state ?? null) !== (raw.state ?? null)) kalan.push("state");
    if ((afterRaw.is_private ?? null) !== (raw.is_private ?? null)) kalan.push("is_private");
    const ok = kalan.length === 0;

    if (ok) {
      await admin
        .from("products")
        .update({
          title: spec.title.trim(),
          description: spec.description,
          ...(spec.tags && plan.fields.includes("tags") ? { tags: spec.tags } : {}),
        })
        .eq("org_id", orgId)
        .eq("id", productId);
    }

    await logAudit(admin, {
      orgId,
      action: "etsy.rewrite",
      entityType: "product",
      entityId: productId,
      summary:
        `Metin (ops listing-text, spec ${specKey}): listing ${listingId}, ${plan.fields.join(" + ")} yazıldı; ` +
        `geri okuma ${ok ? "doğrulandı" : `BAŞARISIZ (${kalan.join(", ")})`}.`,
      diff: {
        listing: listingId,
        fields: plan.fields,
        before: {
          title: decodeHtmlEntities(before.title),
          description: decodeHtmlEntities(before.description),
          tags: before.tags,
        },
        after: {
          title: decodeHtmlEntities(after.title),
          description: decodeHtmlEntities(after.description),
          tags: after.tags,
        },
      },
      source: "ops/listing-text",
    });

    return NextResponse.json({
      ok,
      apply: true,
      spec: specKey,
      listing: listingId,
      status: ok ? "written" : "verify-failed",
      fields: plan.fields,
      kalan,
      state: afterRaw.state ?? null,
      isPrivate: afterRaw.is_private ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, listing: listingId, error: String(e) },
      { status: 500 },
    );
  }
}
