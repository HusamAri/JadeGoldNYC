import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import { getListingInventory, currentQuantityOf, pushListingQuantity } from "@/lib/etsy/inventory";
import {
  getListingPersonalization,
  normalizePersonalizationForWrite,
  personalizationKey,
  type PersonalizationQuestion as LivePQ,
} from "@/lib/etsy/personalization";
import { logAudit } from "@/lib/audit";
import {
  planAttributes,
  findProperty,
  parsePersonalization,
  splitMaterials,
  parseQuantity,
  normText,
  type TaxonomyProperty,
  type ListingPropertyValue,
} from "@/lib/etsy/listing-rewrite";
import rewrite from "@/docs/artifact-studio/etsy-rewrite/listings_rewrite.json";

export const maxDuration = 120;

/**
 * LISTING-REWRITE: byArtifactStudio rewrite dosyasını (docs/artifact-studio/
 * etsy-rewrite/listings_rewrite.json) Etsy API ile uygular, TEK listing.
 *
 * Sahip 2026-09-29 RUNBOOK'taki "Etsy API kullanma" kuralını kaldırdı (Chrome
 * yolu bu oturumda yoktu); diğer kurallar aynen geçerli:
 *  - Kopya BİREBİR dosyadan gelir; rota metin üretmez.
 *  - Varsayılan KURU: canlı durumu okur, farkı ve planı döner. `apply=1`
 *    sahibin o listing için verdiği "yes"ten sonra çağrılır.
 *  - Dokunulmaz: fiyat, indirim, fotoğraf, SKU, bölüm, varyasyon fiyatları,
 *    hold_for_workshop alanları. Adet yazımı fiyatları okunduğu gibi geri
 *    gönderir (pushListingQuantity, okunamayan fiyatta iptal).
 *  - Varyasyon bölme / ekleme notları ve atölye bekleyen notlar UYGULANMAZ,
 *    `deferred` döner.
 *  - Apply sonrası AYNI turda her alan geri okunur; log satırı yanıtta döner.
 */

type Entry = (typeof rewrite.listings)[number];

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
    .eq("purpose", "listing-rewrite")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

interface LiveListing {
  listing_id: number;
  state?: string;
  title?: string;
  description?: string;
  tags?: string[];
  materials?: string[];
  taxonomy_id?: number;
  should_auto_renew?: boolean;
  shipping_profile_id?: number | null;
}
interface TaxNode {
  id: number;
  name: string;
  children?: TaxNode[];
}

const lc = (s: string) => decodeHtmlEntities(s).trim().toLocaleLowerCase("en-US");
const sortedTags = (t: string[]) => t.map(lc).sort().join("|");
const hash8 = (s: string) => createHash("md5").update(s).digest("hex").slice(0, 8);

function resolvePath(nodes: TaxNode[], path: string): number | null {
  const parts = path.split(">").map((p) => p.trim().toLocaleLowerCase("en-US"));
  let level = nodes;
  let hit: TaxNode | undefined;
  for (const part of parts) {
    hit = level.find((n) => n.name.trim().toLocaleLowerCase("en-US") === part);
    if (!hit) return null;
    level = hit.children ?? [];
  }
  return hit?.id ?? null;
}

function deferredNotes(e: Entry): string[] {
  const out: string[] = [];
  const v = e.settings.variations;
  if (/\bsplit\b/i.test(v)) out.push(`listing split: ${v}`);
  else if (/\badd\b/i.test(v)) out.push(`variation change: ${v}`);
  if (/workshop|measure|fill the empty sku/i.test(v)) out.push(`workshop: ${v}`);
  if (e.hold_for_workshop) out.push(`hold: ${e.hold_for_workshop}`);
  return out;
}

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const orgName = url.searchParams.get("org");
  const order = Number.parseInt(url.searchParams.get("order") ?? "", 10);
  const entry = rewrite.listings.find((l) => l.order === order);
  if (!orgName || !entry) {
    return NextResponse.json({ error: "org ve geçerli order (1-41) zorunlu" }, { status: 400 });
  }
  const listingId = Number(entry.id);

  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").eq("name", orgName).maybeSingle();
  if (!org) return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  const orgId = (org as { id: string }).id;
  const { data: prod } = await admin
    .from("products")
    .select("id")
    .eq("org_id", orgId)
    .eq("etsy_listing_id", listingId)
    .maybeSingle();
  if (!prod) return NextResponse.json({ error: "panelde-yok", listing: listingId }, { status: 404 });
  const productId = (prod as { id: string }).id;

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(orgId);
  } catch (e) {
    return NextResponse.json({ error: "etsy not connected", detail: String(e) }, { status: 503 });
  }

  try {
    const shopId = await client.requireShopId();
    const n = entry.new;

    const read = async () => {
      const listing = await client.get<LiveListing>(etsyPaths.listing(listingId));
      const props = await client.get<{ results: ListingPropertyValue[] }>(
        etsyPaths.listingProperties(shopId, listingId),
      );
      const pers = await getListingPersonalization(client, listingId);
      const inv = await getListingInventory(client, listingId);
      const qty = (inv.products ?? []).filter((p) => !p.is_deleted).map(currentQuantityOf);
      return { listing, props: props.results ?? [], pers, qty };
    };
    const before = await read();

    // Kategori, kargo profili, nitelik tanımları.
    const tax = await client.get<{ results: TaxNode[] }>(etsyPaths.sellerTaxonomyNodes());
    const taxonomyId = resolvePath(tax.results ?? [], n.category);
    if (!taxonomyId) throw new Error(`kategori yolu çözülemedi: ${n.category}`);
    const taxProps = await client.get<{ results: TaxonomyProperty[] }>(
      etsyPaths.sellerTaxonomyNodeProperties(taxonomyId),
    );
    const profiles = await client.get<{ results: { shipping_profile_id: number; title: string }[] }>(
      etsyPaths.shippingProfiles(shopId),
    );
    const freeProfile = (profiles.results ?? []).find((p) => lc(p.title) === "freee shipping");
    if (!freeProfile) throw new Error("'freee shipping' kargo profili bulunamadı");

    const attrs = planAttributes(n.attributes as unknown as Record<string, string>, taxProps.results ?? [], before.props);
    // hold_for_workshop notunun açıkça "temizle" dediği nitelikler (kopyanın
    // attributes listesinde yok): ?clear=Stone source. Sahibin onayladığı farkta
    // görünür; yalnız şu an değeri olan nitelik boşaltılır.
    for (const name of (url.searchParams.get("clear") ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
      if (!(entry.hold_for_workshop ?? "").toLocaleLowerCase("en-US").includes(name.toLocaleLowerCase("en-US"))) {
        throw new Error(`clear=${name}: hold_for_workshop notunda geçmiyor, temizlenmez`);
      }
      const prop = findProperty(name, taxProps.results ?? []);
      if (!prop) throw new Error(`clear=${name}: bu kategoride böyle bir nitelik yok`);
      const cur = before.props.find((p) => p.property_id === prop.property_id);
      if (cur && ((cur.value_ids ?? []).length || (cur.values ?? []).length) && !attrs.clear.some((c) => c.property_id === prop.property_id)) {
        attrs.clear.push({ key: `${name} (hold note; was ${(cur.values ?? []).join(", ")})`, property_id: prop.property_id });
      }
    }
    // Hold notunun "olduğu gibi kalır" dediği, ama kopyanın attributes'ta yine
    // de değer verdiği nitelik: ?hold=Materials. Yazılmaz, boşaltılmaz.
    for (const name of (url.searchParams.get("hold") ?? "").split(",").map((x) => x.trim()).filter(Boolean)) {
      if (!(entry.hold_for_workshop ?? "").toLocaleLowerCase("en-US").includes(name.toLocaleLowerCase("en-US"))) {
        throw new Error(`hold=${name}: hold_for_workshop notunda geçmiyor`);
      }
      const prop = findProperty(name, taxProps.results ?? []);
      if (!prop) throw new Error(`hold=${name}: bu kategoride böyle bir nitelik yok`);
      attrs.set = attrs.set.filter((s) => s.property_id !== prop.property_id);
      attrs.clear = attrs.clear.filter((c) => c.property_id !== prop.property_id);
      attrs.unchanged = attrs.unchanged.filter((k) => findProperty(k, taxProps.results ?? [])?.property_id !== prop.property_id);
      const cur = before.props.find((p) => p.property_id === prop.property_id);
      attrs.skipped.push({ key: name, value: (cur?.values ?? []).join(", "), reason: "held by the hold note, left as is" });
    }
    const mats = splitMaterials(n.materials_tags);
    const pq = parsePersonalization(n.personalization_field);
    const wantQty = parseQuantity(entry.settings.quantity);
    const wantPers = pq ? normalizePersonalizationForWrite([pq as unknown as LivePQ]) : null;

    const L = before.listing;
    const drift = {
      title: decodeHtmlEntities(L.title ?? "") !== entry.current.title,
      tags: sortedTags(L.tags ?? []) !== sortedTags(entry.current.tags as string[]),
    };
    const diff = {
      title: { from: decodeHtmlEntities(L.title ?? ""), to: n.title, change: decodeHtmlEntities(L.title ?? "") !== n.title },
      tags: {
        remove: (L.tags ?? []).filter((t) => !n.tags.map(lc).includes(lc(t))),
        add: n.tags.filter((t) => !(L.tags ?? []).map(lc).includes(lc(t))),
      },
      description: {
        from: { len: (L.description ?? "").length, h: hash8(normText(decodeHtmlEntities(L.description ?? ""))) },
        to: { len: n.description.length, h: hash8(normText(n.description)), first2: n.description.split("\n").filter(Boolean).slice(0, 2) },
      },
      category: { from: L.taxonomy_id, to: taxonomyId, path: n.category },
      materials: { from: L.materials ?? [], to: mats.ok, rejected: mats.rejected },
      attributes: {
        set: attrs.set.map((s) => `${s.key}: ${s.values.join(", ")}${s.scale_id ? " (scale " + s.scale_id + ")" : ""}`),
        clear: attrs.clear.map((c) => c.key),
        unchanged: attrs.unchanged,
        skipped: attrs.skipped,
      },
      personalization: { from: before.pers.map((q) => q.question_text), to: wantPers?.map((q) => q.question_text) ?? "keep (none in copy)" },
      quantity: { from: before.qty, to: wantQty },
      renewal: { from: L.should_auto_renew ?? null, to: true },
      shipping: { from: L.shipping_profile_id ?? null, to: freeProfile.shipping_profile_id, title: freeProfile.title },
    };
    const deferred = deferredNotes(entry);

    if (!apply) {
      return NextResponse.json({
        ok: true, apply: false, order, id: entry.id, short_name: entry.short_name,
        state: L.state, drift, diff, deferred, photo_check: entry.photo_check,
      });
    }
    if (L.state !== "active" && L.state !== "draft") throw new Error(`listing '${L.state}', yazılmadı`);

    // 1) Metin + kategori + materials + yenileme + kargo: tek PATCH.
    const form: Record<string, string | number> = {
      title: n.title,
      description: n.description,
      tags: n.tags.join(","),
      should_auto_renew: "true",
      shipping_profile_id: freeProfile.shipping_profile_id,
    };
    if (taxonomyId !== L.taxonomy_id) form.taxonomy_id = taxonomyId;
    if (mats.ok.length) form.materials = mats.ok.join(",");
    await client.requestForm("PATCH", etsyPaths.shopListing(shopId, listingId), form);

    // 2) Nitelikler.
    const attrErrors: { key: string; error: string }[] = [];
    for (const s of attrs.set) {
      try {
        const body: Record<string, string | number> = { value_ids: s.value_ids.join(","), values: s.values.join(",") };
        if (s.scale_id != null) body.scale_id = s.scale_id;
        await client.requestForm("PUT", etsyPaths.listingProperty(shopId, listingId, s.property_id), body);
      } catch (e) {
        attrErrors.push({ key: s.key, error: String(e).slice(0, 300) });
      }
    }
    for (const c of attrs.clear) {
      try {
        await client.request("DELETE", etsyPaths.listingProperty(shopId, listingId, c.property_id));
      } catch (e) {
        attrErrors.push({ key: c.key, error: String(e).slice(0, 300) });
      }
    }

    // 3) Kişiselleştirme (yalnız kopyada varsa).
    if (wantPers) {
      await client.request(
        "POST",
        etsyPaths.listingPersonalization(shopId, listingId) + "?supports_multiple_personalization_questions=true",
        { personalization_questions: wantPers },
      );
    }

    // 4) Adet (fiyatlar okunduğu gibi geri yazılır).
    let qtyOutcome: unknown = "unchanged";
    if (wantQty != null && before.qty.some((q) => q !== wantQty)) {
      qtyOutcome = await pushListingQuantity(client, listingId, null, wantQty, true);
    }

    // 5) Geri okuma.
    const after = await read();
    const A = after.listing;
    const failed: string[] = [];
    if (decodeHtmlEntities(A.title ?? "") !== n.title) failed.push("title");
    if ((A.tags ?? []).length !== 13 || sortedTags(A.tags ?? []) !== sortedTags(n.tags)) failed.push("tags");
    if (normText(decodeHtmlEntities(A.description ?? "")) !== normText(n.description)) failed.push("description");
    if (A.taxonomy_id !== taxonomyId) failed.push("category");
    if (A.should_auto_renew !== true) failed.push("renewal");
    if (A.shipping_profile_id !== freeProfile.shipping_profile_id) failed.push("shipping");
    if (mats.ok.length && [...(A.materials ?? [])].map(lc).sort().join("|") !== mats.ok.map(lc).sort().join("|"))
      failed.push("materials");
    if (wantQty != null && after.qty.some((q) => q !== wantQty)) failed.push("quantity");
    if (wantPers && personalizationKey(after.pers) !== personalizationKey(wantPers)) failed.push("personalization");
    const afterById = new Map(after.props.map((p) => [p.property_id, p]));
    for (const s of attrs.set) {
      const got = afterById.get(s.property_id);
      const ok = got && (s.value_ids.length
        ? [...(got.value_ids ?? [])].sort().join() === [...s.value_ids].sort().join()
        : (got.values ?? []).join() === s.values.join());
      if (!ok) failed.push(`attr:${s.key}`);
    }
    for (const c of attrs.clear) {
      const got = afterById.get(c.property_id);
      if (got && ((got.value_ids ?? []).length || (got.values ?? []).length)) failed.push(`attr-clear:${c.key}`);
    }

    const logLine = {
      order, id: entry.id, short_name: entry.short_name,
      status: failed.length ? "failed" : "applied",
      verified: failed.length === 0,
      fields_failed: failed,
      deferred,
      skipped_attributes: attrs.skipped.map((s) => `${s.key}: ${s.reason}`),
      skipped_materials: mats.rejected,
      attempt: 1,
      ts: new Date().toISOString(),
    };
    await logAudit(admin, {
      orgId,
      action: "etsy.rewrite",
      entityType: "product",
      entityId: productId,
      summary:
        `Rewrite ${order}/41 ${entry.short_name} (listing ${listingId}): başlık, 13 tag, açıklama, kategori, ` +
        `${attrs.set.length} nitelik yazıldı, ${attrs.clear.length} boşaltıldı` +
        (wantPers ? ", kişiselleştirme" : "") +
        `; read-back ${failed.length ? "BAŞARISIZ: " + failed.join(", ") : "doğrulandı"}`,
    });
    return NextResponse.json({ ok: failed.length === 0, apply: true, log: logLine, attrErrors, qtyOutcome });
  } catch (e) {
    return NextResponse.json({ ok: false, order, id: entry.id, error: String(e).slice(0, 800) }, { status: 500 });
  }
}
