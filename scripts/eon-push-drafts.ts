/**
 * EON YAYIN KAPISI → ETSY TASLAK GÖNDERİMİ.
 *
 * Yayın-kapısı raporundan (eon-gate-report.json) YALNIZ status="PASS" olan
 * listingleri Etsy'ye TASLAK (draft — yayınlanmaz) olarak açar:
 *   1. createDraftListing (başlık, temiz açıklama, 13 tag, materyal, çapa fiyat,
 *      kişiselleştirme AÇIK: 30 karakter iç gravür talimatı).
 *   2. Envanter PUT: Width × Ring Size bandı varyasyonları — HER İKİ eksen de
 *      fiyat taşır (price_on_property [513, 514]); fiyat+SKU panel varyantlarından.
 *   3. (opsiyonel --images-dir) kapak hero'sunu (NN.jpg) ilk foto olarak yükler.
 *   4. Paneli bağlar: products.etsy_listing_id + url yazılır (vekil taze kalır).
 *
 * Kapı raporu ZORUNLU girdi — kapıdan geçmeyen listing gönderilemez (eşleşme/
 * fiyat/ağırlık/geçerlilik/boost denetimi scratchpad'deki eon_publish_gate.py
 * loop'unda; veri değişince yeniden koşulur, rapor tazelenir).
 *
 *   npx tsx scripts/eon-push-drafts.ts --gate ./eon-gate-report.json --dry-run
 *   npx tsx scripts/eon-push-drafts.ts --gate ./eon-gate-report.json \
 *     [--only 01,04,13] [--qty 20] [--images-dir ./eon-covers] \
 *     [--taxonomy <id>] [--shipping-profile <id>] [--return-policy <id>]
 *     [--readiness <id>]   (işlem profili — verilmezse çözülür/oluşturulur)
 *
 * GERÇEK Etsy kimliği gerekir (canlı ortam; .env.local: ETSY_API_KEY/SECRET +
 * SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL). İdempotent: etsy_listing_id dolu
 * olan listing ATLANIR — yeniden koşum çift taslak açmaz.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { EtsyClient } from "../lib/etsy/client";
import { etsyPaths } from "../lib/etsy/endpoints";
import { applyEonPersonalization } from "../lib/etsy/personalization";

// ── .env.local (Next dışı bağlam) ─────────────────────────────────────────
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const argv = process.argv.slice(2);
const argVal = (flag: string, def: string | null = null) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const DRY = argv.includes("--dry-run");
const ORG = argVal("--org", "9d0336c0-8772-456d-a80c-a5f2cfe7bbd0")!; // EON
const GATE = argVal("--gate", "./eon-gate-report.json")!;
const ONLY = (argVal("--only", "") ?? "").split(",").filter(Boolean);
const QTY = parseInt(argVal("--qty", "20")!, 10);
const IMAGES_DIR = argVal("--images-dir");

const SUPA_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) {
  console.error("SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local).");
  process.exit(1);
}

interface GateRow {
  no: string;
  status: "PASS" | "HOLD" | "FAIL";
  title: string;
  fail_reasons: string[];
  hold_reasons: string[];
}
interface VariantRow {
  sku: string;
  price_cents: number | null;
  quantity: number | null;
  properties: { Width?: string; "Ring Size"?: string } | null;
}

/** Açıklamanın sonundaki dahili not bloğunu söker: "\n\n---\n[EON NN · ...]" */
function stripInternalTrailer(desc: string): string {
  return desc.replace(/\n*---\n\[EON [\s\S]*\]$/m, "").trimEnd();
}

/** Taksonomi ağacında ada göre düğüm arar (BFS; en sığ eşleşme). */
interface TaxNode { id: number; name: string; children?: TaxNode[] }
function findTaxonomy(nodes: TaxNode[], name: string): TaxNode | null {
  const queue = [...nodes];
  while (queue.length) {
    const n = queue.shift()!;
    if (n.name.toLowerCase() === name.toLowerCase()) return n;
    if (n.children) queue.push(...n.children);
  }
  return null;
}

async function main() {
  const gate = JSON.parse(readFileSync(GATE, "utf8")) as { listings: GateRow[] };
  let pass = gate.listings.filter((g) => g.status === "PASS");
  if (ONLY.length) pass = pass.filter((g) => ONLY.includes(g.no));
  const skipped = gate.listings.filter((g) => g.status !== "PASS");
  console.log(
    `Kapı: ${pass.length} PASS gönderilecek · ${skipped.length} PASS-dışı atlanıyor ` +
    `(${skipped.map((s) => `${s.no}:${s.status}`).join(", ") || "—"})`,
  );
  if (pass.length === 0) return;

  const supabase = createClient(SUPA_URL!, SUPA_KEY!, { auth: { persistSession: false } });
  const client = await EtsyClient.forOrg(ORG);
  const shopId = await client.requireShopId();

  // Taksonomi: --taxonomy verilmediyse "Wedding Bands" düğümünü ağaçtan çöz.
  let taxonomyId = argVal("--taxonomy") ? parseInt(argVal("--taxonomy")!, 10) : null;
  if (!taxonomyId) {
    const tax = await client.get<{ results: TaxNode[] }>(etsyPaths.sellerTaxonomyNodes());
    const node = findTaxonomy(tax.results ?? [], "Wedding Bands");
    if (!node) {
      console.error("Taksonomi 'Wedding Bands' bulunamadı — --taxonomy <id> verin.");
      process.exit(1);
    }
    taxonomyId = node.id;
    console.log(`Taksonomi: Wedding Bands → ${taxonomyId}`);
  }

  // Kargo profili + iade politikası: parametre yoksa mağazadaki İLKİ.
  let shippingProfileId = argVal("--shipping-profile")
    ? parseInt(argVal("--shipping-profile")!, 10) : null;
  if (!shippingProfileId) {
    const sp = await client.get<{ results: { shipping_profile_id: number; title: string }[] }>(
      etsyPaths.shippingProfiles(shopId),
    );
    if (!sp.results?.length) {
      console.error("Mağazada kargo profili yok — Etsy'de bir profil oluşturun.");
      process.exit(1);
    }
    shippingProfileId = sp.results[0].shipping_profile_id;
    console.log(`Kargo profili: ${sp.results[0].title} (${shippingProfileId})`);
  }
  let returnPolicyId = argVal("--return-policy")
    ? parseInt(argVal("--return-policy")!, 10) : null;
  if (!returnPolicyId) {
    try {
      const rp = await client.get<{ results: { return_policy_id: number }[] }>(
        etsyPaths.returnPolicies(shopId),
      );
      returnPolicyId = rp.results?.[0]?.return_policy_id ?? null;
      if (returnPolicyId) console.log(`İade politikası: ${returnPolicyId}`);
    } catch {
      console.warn("İade politikası okunamadı — parametresiz denenecek.");
    }
  }

  // İşlem profili (readiness state) — Etsy 2025 migrasyonundan beri fiziksel
  // listing'de ZORUNLU. --readiness <id> verilebilir; yoksa mevcut made_to_order
  // (ya da ilk) tanım; hiç yoksa made-to-order 5–7 gün oluşturulur.
  let readinessStateId = argVal("--readiness")
    ? parseInt(argVal("--readiness")!, 10) : null;
  if (!readinessStateId) {
    try {
      const rs = await client.get<{
        results?: { readiness_state_id: number; readiness_state: string }[];
      }>(etsyPaths.readinessStateDefinitions(shopId));
      const defs = rs.results ?? [];
      readinessStateId =
        defs.find((d) => d.readiness_state === "made_to_order")
          ?.readiness_state_id ?? defs[0]?.readiness_state_id ?? null;
      if (!readinessStateId) {
        const created = await client.requestForm<{ readiness_state_id: number }>(
          "POST", etsyPaths.readinessStateDefinitions(shopId),
          { readiness_state: "made_to_order", min_processing_time: 5, max_processing_time: 7 },
        );
        readinessStateId = created.readiness_state_id ?? null;
        console.log(`İşlem profili oluşturuldu: ${readinessStateId} (made-to-order 5-7 gün)`);
      } else {
        console.log(`İşlem profili: ${readinessStateId}`);
      }
    } catch {
      console.warn("İşlem profili okunamadı/oluşturulamadı — create 400 verebilir.");
    }
  }

  let created = 0;
  for (const g of pass) {
    // Panel kaydı + varyantlar
    const { data: prod } = await supabase
      .from("products")
      .select("id, title, description, tags, materials, price_cents, currency, etsy_listing_id")
      .eq("org_id", ORG)
      .eq("status", "draft")
      .like("description", `%[EON ${g.no} %`)
      .maybeSingle();
    if (!prod) { console.warn(`✗ ${g.no}: panel taslağı bulunamadı`); continue; }
    if (prod.etsy_listing_id) {
      console.log(`↷ ${g.no}: zaten Etsy'de (#${prod.etsy_listing_id}) — atlandı`);
      continue;
    }
    const { data: vars } = await supabase
      .from("product_variants")
      .select("sku, price_cents, quantity, properties")
      .eq("org_id", ORG)
      .eq("product_id", prod.id)
      .eq("active", true)
      .order("sku");
    const variants = (vars ?? []) as VariantRow[];
    if (!variants.length) { console.warn(`✗ ${g.no}: varyant yok — kapı bunu yakalamalıydı`); continue; }

    const cleanDesc = stripInternalTrailer(prod.description as string);
    const anchor = Math.min(...variants.map((v) => v.price_cents ?? Infinity)) / 100;

    if (DRY) {
      console.log(`[dry] ${g.no}: createDraftListing "${(prod.title as string).slice(0, 50)}…" ` +
        `$${anchor} · ${variants.length} varyant · ${(prod.tags as string[]).length} tag`);
      created++;
      continue;
    }

    // 1) Taslak listing (yayınlanmaz — state: draft)
    const createForm: Record<string, string | number | undefined | null> = {
      quantity: QTY,
      title: prod.title as string,
      description: cleanDesc,
      price: anchor,
      who_made: "i_did",
      when_made: "made_to_order",
      taxonomy_id: taxonomyId,
      shipping_profile_id: shippingProfileId,
      return_policy_id: returnPolicyId ?? undefined,
      readiness_state_id: readinessStateId ?? undefined,
      // Paket ağırlık + yüzük kutusu boyutu (hesaplı profil şart koşar;
      // free shipping'te fiyata gömülü → alıcıya yansımaz).
      item_weight: 3,
      item_weight_unit: "oz",
      item_length: 4,
      item_width: 4,
      item_height: 2,
      item_dimensions_unit: "in",
      tags: (prod.tags as string[]).join(","),
      materials: ((prod.materials as string[]) ?? []).join(","),
      // legacy is_personalizable/personalization_* Etsy 2025'te create'te
      // DEPRECATED — create sonrası ayrı personalization ucundan yazılır (aşağıda).
      should_auto_renew: "false",
      type: "physical",
    };
    const listing = await client.requestForm<{ listing_id: number; state: string }>(
      "POST", etsyPaths.shopListings(shopId), createForm,
    );
    console.log(`✓ ${g.no}: taslak açıldı #${listing.listing_id} (state=${listing.state})`);

    // 1b) Kişiselleştirme — iç gravür (30) + engraving style dropdown.
    try {
      await applyEonPersonalization(client, shopId, listing.listing_id);
      console.log(`  kişiselleştirme (gravür + style) eklendi`);
    } catch (e) {
      console.warn(`  kişiselleştirme eklenemedi: ${e instanceof Error ? e.message : String(e)}`);
    }

    // 2) Varyasyon envanteri: Width (513) × Ring Size (514), ikisi de fiyat taşır.
    const products = variants.map((v) => ({
      sku: v.sku,
      property_values: [
        { property_id: 513, property_name: "Width", values: [v.properties?.Width ?? "—"] },
        { property_id: 514, property_name: "Ring Size", values: [v.properties?.["Ring Size"] ?? "—"] },
      ],
      offerings: [{
        price: (v.price_cents ?? 0) / 100,
        quantity: v.quantity ?? QTY,
        is_enabled: true,
        // Etsy 2025: her offering'in işlem profili olmalı.
        readiness_state_id: readinessStateId ?? undefined,
      }],
    }));
    await client.request("PUT", etsyPaths.listingInventory(listing.listing_id) + "?legacy=false", {
      products,
      readiness_state_on_property: [],
      price_on_property: [513, 514],
      quantity_on_property: [],
      sku_on_property: [513, 514],
    });
    console.log(`  envanter: ${products.length} varyasyon yazıldı (Width × Ring Size)`);

    // 3) Kapak hero (opsiyonel)
    if (IMAGES_DIR) {
      const img = join(IMAGES_DIR, `${g.no}.jpg`);
      if (existsSync(img)) {
        const fd = new FormData();
        fd.append("image", new Blob([readFileSync(img)], { type: "image/jpeg" }), `${g.no}.jpg`);
        fd.append("rank", "1");
        await client.requestMultipart("POST",
          etsyPaths.listingImages(shopId, listing.listing_id), fd);
        console.log(`  kapak yüklendi: ${g.no}.jpg`);
      }
    }

    // 4) Paneli bağla (vekil taze kalsın; status draft KALIR — Etsy'de de draft)
    await supabase
      .from("products")
      .update({
        etsy_listing_id: listing.listing_id,
        url: `https://www.etsy.com/listing/${listing.listing_id}`,
      })
      .eq("id", prod.id)
      .eq("org_id", ORG);
    created++;
  }

  console.log(`\n── ÖZET ── ${created}/${pass.length} taslak ${DRY ? "(dry-run)" : "Etsy'de"}.`);
  console.log("Taslaklar Etsy Shop Manager > Listings > Drafts altında; yayınlama kararı sende.");
}

main().catch((e) => {
  console.error("HATA:", e instanceof Error ? e.message : e);
  process.exit(1);
});
