import { strict as assert } from "node:assert";
import test from "node:test";

import {
  validateVariationAxes,
  resolveTaxonomyIdForProtocol,
  type DraftVariant,
} from "@/lib/etsy/create-listing";
import {
  LISTING_PROTOCOLS,
  resolveListingProtocol,
  unknownProtocolError,
} from "@/lib/etsy/listing-protocol";

/**
 * LISTING PROTOKOLÜ REGRESYONU.
 *
 * Vaka 2026-09-13: `by Artifact Studio Jewelry` kolyesi Etsy'ye
 * gönderilemiyordu — "Wedding band listinglerinde her varyant Width ve Ring
 * Size içermelidir." Kök neden `createDraftListingFromProduct` içinde
 * doğrulayıcıya ELLE geçilen `["Wedding Bands"]` yoluydu: kapı ürün ne olursa
 * olsun her zaman açılıyordu. Ölçüm, arkada Jade Gold NYC'nin 22 kolye,
 * 21 bileklik ve 8 küpe panel taslağının da beklediğini gösterdi.
 *
 * Bu testin İKİ görevi var ve ikincisi daha önemli:
 *   1. Kolye artık geçiyor mu (düzeltme çalışıyor mu),
 *   2. Alyans DAVRANIŞI BİREBİR AYNI mı (26 EON panel taslağı riske girdi mi).
 *
 * Varyant verisi UYDURULMADI — canlı panelden okundu. Second-brain dersi:
 * kombinatorik/regresyon testinin girdisi canlı veriden gelmeli, yoksa test
 * kodu değil kendi varsayımını sınar (Ophir SKU vakasında uydurulmuş "3.25"
 * bedenleri süpürmeden geçmiş, üretimdeki gerçek "3 1/4" etiketi patlamıştı).
 */

/** Canlı: product_variants, product 891ee44e (BAS-I13, 9 varyant). */
const NECKLACE_VARIANTS: DraftVariant[] = [
  { sku: "BAS-I13-RG-16", properties: { "Metal Color": "Rose Gold", "Chain Length": "16 in" }, price_cents: 52900, quantity: 20 },
  { sku: "BAS-I13-RG-18", properties: { "Metal Color": "Rose Gold", "Chain Length": "18 in" }, price_cents: 54900, quantity: 20 },
  { sku: "BAS-I13-RG-20", properties: { "Metal Color": "Rose Gold", "Chain Length": "20 in" }, price_cents: 56900, quantity: 20 },
  { sku: "BAS-I13-WG-16", properties: { "Metal Color": "White Gold", "Chain Length": "16 in" }, price_cents: 52900, quantity: 20 },
  { sku: "BAS-I13-WG-18", properties: { "Metal Color": "White Gold", "Chain Length": "18 in" }, price_cents: 54900, quantity: 20 },
  { sku: "BAS-I13-WG-20", properties: { "Metal Color": "White Gold", "Chain Length": "20 in" }, price_cents: 56900, quantity: 20 },
  { sku: "BAS-I13-YG-16", properties: { "Metal Color": "Yellow Gold", "Chain Length": "16 in" }, price_cents: 52900, quantity: 20 },
  { sku: "BAS-I13-YG-18", properties: { "Metal Color": "Yellow Gold", "Chain Length": "18 in" }, price_cents: 54900, quantity: 20 },
  { sku: "BAS-I13-YG-20", properties: { "Metal Color": "Yellow Gold", "Chain Length": "20 in" }, price_cents: 56900, quantity: 20 },
];

/** Canlı: product_variants, product 653f595f (EON-MERID-TT). */
const RING_VARIANTS: DraftVariant[] = [
  { sku: "EON-MERID-TT-10-04-030", properties: { Karat: "10K", Width: "4 mm", "Ring Size": "US 3" }, price_cents: 87000, quantity: 20 },
  { sku: "EON-MERID-TT-10-04-035", properties: { Karat: "10K", Width: "4 mm", "Ring Size": "US 3.5" }, price_cents: 88000, quantity: 20 },
  { sku: "EON-MERID-TT-10-04-040", properties: { Karat: "10K", Width: "4 mm", "Ring Size": "US 4" }, price_cents: 89000, quantity: 20 },
  { sku: "EON-MERID-TT-10-05-030", properties: { Karat: "10K", Width: "5 mm", "Ring Size": "US 3" }, price_cents: 96000, quantity: 20 },
];

test("kolye varyantları eksen doğrulamasından geçer (bildirilen hata)", () => {
  const spec = resolveListingProtocol({ product_type: "necklace" });
  assert.ok(spec);
  assert.equal(spec.id, "pendant_necklace");
  assert.equal(validateVariationAxes(spec, NECKLACE_VARIANTS), null);
});

test("alyans davranışı birebir korunur — geçerli ızgara geçer", () => {
  const spec = resolveListingProtocol({ product_type: "ring" });
  assert.ok(spec);
  assert.equal(spec.id, "wedding_band");
  assert.equal(validateVariationAxes(spec, RING_VARIANTS), null);
});

test("initial signet ring alyans eksenlerine düşmez ve tek harf ister", () => {
  const spec = resolveListingProtocol({
    product_type: "ring",
    listing_metadata: { listingProtocol: "signet_ring" },
  });
  assert.ok(spec);
  assert.equal(spec.id, "signet_ring");
  assert.deepEqual(spec.requiredVariationAxes, []);
  assert.equal(spec.taxonomyRoot, "Jewelry");
  assert.equal(spec.personalization?.length, 1);
  assert.equal(spec.personalization?.[0].question_type, "text_input");
  assert.equal(spec.personalization?.[0].required, true);
  assert.equal(spec.personalization?.[0].max_allowed_characters, 1);
  const sizes: DraftVariant[] = [
    { sku: "BAS-INITIAL-06", properties: { "Ring Size": "US 6" }, price_cents: 80000, quantity: 1 },
    { sku: "BAS-INITIAL-07", properties: { "Ring Size": "US 7" }, price_cents: 80000, quantity: 1 },
  ];
  assert.equal(validateVariationAxes(spec, sizes), null);
});

test("sculptural ring iki renk-beden ekseniyle alyans veya signet sayılmaz", async () => {
  const spec = resolveListingProtocol({
    product_type: "ring",
    listing_metadata: { listingProtocol: "sculptural_ring" },
  });
  assert.ok(spec);
  assert.equal(spec.id, "sculptural_ring");
  assert.deepEqual(spec.requiredVariationAxes, []);
  assert.equal(spec.personalization, null);
  assert.equal(spec.taxonomyRoot, "Jewelry");
  const variants: DraftVariant[] = [
    { sku: "BAS-ARC-YG-04", properties: { "Ring Size": "US 4", "Metal Color": "Yellow Gold" }, price_cents: 59900, quantity: 1 },
    { sku: "BAS-ARC-YG-045", properties: { "Ring Size": "US 4.5", "Metal Color": "Yellow Gold" }, price_cents: 60900, quantity: 1 },
    { sku: "BAS-ARC-WG-04", properties: { "Ring Size": "US 4", "Metal Color": "White Gold" }, price_cents: 59900, quantity: 1 },
  ];
  assert.equal(validateVariationAxes(spec, variants), null);
  assert.deepEqual(
    await resolveTaxonomyIdForProtocol(fakeClient(), spec),
    { ok: true, taxonomyId: 10 },
  );
});

test("alyansta eksik eksen HÂLÂ reddedilir, mesaj aynı kalır", () => {
  const spec = LISTING_PROTOCOLS.wedding_band;
  const missingRingSize: DraftVariant[] = RING_VARIANTS.map((v) => ({
    ...v,
    properties: { Karat: "10K", Width: "4 mm" },
  }));
  assert.equal(
    validateVariationAxes(spec, missingRingSize),
    "Wedding band listinglerinde her varyant Width ve Ring Size içermelidir.",
  );
});

test("alyansta tek değerli eksen gerçek varyasyon sayılmaz", () => {
  const spec = LISTING_PROTOCOLS.wedding_band;
  const oneSizeOnly: DraftVariant[] = [RING_VARIANTS[0]];
  assert.equal(
    validateVariationAxes(spec, oneSizeOnly),
    "Wedding band listinglerinde Width gerçek bir varyasyon ekseni olmalıdır.",
  );
});

test("product_type NULL eski kayıtlar alyans davranışında kalır", () => {
  // Canlıda 26 EON panel taslağı bu durumda; push akışları bozulmamalı.
  assert.equal(resolveListingProtocol({ product_type: null })?.id, "wedding_band");
  assert.equal(resolveListingProtocol({})?.id, "wedding_band");
});

test("listing_metadata.listingProtocol product_type'ı ezer", () => {
  const spec = resolveListingProtocol({
    product_type: "ring",
    listing_metadata: { listingProtocol: "pendant_necklace" },
  });
  assert.equal(spec?.id, "pendant_necklace");
});

test("bileklik kendi protokolüne çözülür (2026-09-14'te eklendi)", () => {
  const spec = resolveListingProtocol({ product_type: "bracelet" });
  assert.equal(spec?.id, "chain_bracelet");
  assert.equal(spec?.requiredVariationAxes.length, 0);
  assert.equal(spec?.personalization, null);
  // Kolye ile AYNI koli sabitini paylaşır — iki uydurma set yerine tek sabit.
  assert.deepEqual(spec?.parcel, LISTING_PROTOCOLS.pendant_necklace.parcel);
});

test("bileklik taksonomisi Jewelry kökünden çözülür", async () => {
  const r = await resolveTaxonomyIdForProtocol(
    fakeClient(),
    LISTING_PROTOCOLS.chain_bracelet,
  );
  // Sahte ağaçta "Chain & Link Bracelets" yok, "Bracelets" var → ikinci adaya düşer.
  assert.deepEqual(r, { ok: true, taxonomyId: 40 });
});

test("kelepçe kendi protokolüne çözülür, zincir bileklik dalına düşmez (2026-09-26)", () => {
  for (const type of ["cuff", "cuff_bracelet"]) {
    const spec = resolveListingProtocol({ product_type: type });
    assert.equal(spec?.id, "cuff_bracelet", type);
    assert.equal(spec?.taxonomyNames[0], "Cuff Bracelets");
    assert.equal(spec?.taxonomyRoot, "Jewelry");
    assert.equal(spec?.personalization?.[0]?.max_allowed_characters, 10);
  }
  // Zincir bileklik davranışı DEĞİŞMEDİ.
  assert.equal(resolveListingProtocol({ product_type: "bracelet" })?.id, "chain_bracelet");
});

test("kelepçe gravürü sahibin opt-out'uyla kapatılabilir", () => {
  const spec = resolveListingProtocol({
    product_type: "cuff",
    listing_metadata: { offersPersonalization: false },
  });
  assert.equal(spec?.id, "cuff_bracelet");
  assert.equal(spec?.personalization, null);
});

test("hâlâ tanınmayan ürün tipi sessizce yüzük sayılmaz, null döner", () => {
  for (const type of ["earrings", "anklet", "brooch", "other"]) {
    assert.equal(resolveListingProtocol({ product_type: type }), null, type);
    assert.match(unknownProtocolError({ product_type: type }), /protokolü tanımlı değil/);
  }
});

test("kolye protokolünde gravür kişiselleştirmesi yok", () => {
  assert.equal(LISTING_PROTOCOLS.pendant_necklace.personalization, null);
  assert.ok(LISTING_PROTOCOLS.wedding_band.personalization);
});

// ── Ürün başına kişiselleştirme çıkışı ──────────────────────────────────────
// Vaka 2026-09-15: BAS-B14 (by Artifact Studio Jewelry alyansı) gravür
// SUNMUYOR, ama alyans protokolü gravür sorusunu her yüzüğe yazıyordu. Ölçüm:
// 77 yüzük ürünü var, 59'u EON'un ve gravür SUNUYOR. Yani varsayılanı çevirmek
// o 59 üründen hizmeti sessizce kaldırırdı. Çıkış ürün başına açılır.
//
// Bu testlerin de İKİ görevi var ve yine ikincisi daha önemli:
//   1. Çıkış bayrağı gerçekten kişiselleştirmeyi kapatıyor mu,
//   2. Bayrak YOKKEN alyans davranışı BİREBİR aynı mı.

test("offersPersonalization false olan alyansta gravür yazılmaz", () => {
  const spec = resolveListingProtocol({
    product_type: "ring",
    listing_metadata: { offersPersonalization: false },
  });
  assert.equal(spec?.id, "wedding_band");
  assert.equal(spec?.personalization, null);
  // Çıkış SADECE kişiselleştirmeyi kapatır; sözleşmenin geri kalanı durur.
  assert.deepEqual(
    spec?.requiredVariationAxes,
    LISTING_PROTOCOLS.wedding_band.requiredVariationAxes,
  );
  assert.deepEqual(spec?.parcel, LISTING_PROTOCOLS.wedding_band.parcel);
  assert.deepEqual(spec?.taxonomyNames, LISTING_PROTOCOLS.wedding_band.taxonomyNames);
});

test("bayrak yokken alyans gravürü AYNEN korunur (59 EON yüzüğü)", () => {
  for (const meta of [
    undefined,
    null,
    {},
    { offersPersonalization: true },
    // Eksik ya da yanlış tipli metadata sessizce hizmet kapatamaz.
    { offersPersonalization: "false" },
    { offersPersonalization: 0 },
    { offersPersonalization: null },
  ]) {
    const spec = resolveListingProtocol({
      product_type: "ring",
      listing_metadata: meta as never,
    });
    assert.deepEqual(
      spec?.personalization,
      LISTING_PROTOCOLS.wedding_band.personalization,
      JSON.stringify(meta),
    );
  }
});

test("çıkış bayrağı protokol sabitini MUTASYONA UĞRATMAZ", () => {
  resolveListingProtocol({
    product_type: "ring",
    listing_metadata: { offersPersonalization: false },
  });
  assert.ok(LISTING_PROTOCOLS.wedding_band.personalization);
});

test("bayrak zaten kişiselleştirmesiz protokolde bir şey değiştirmez", () => {
  for (const type of ["necklace", "bracelet"]) {
    const spec = resolveListingProtocol({
      product_type: type,
      listing_metadata: { offersPersonalization: false },
    });
    assert.equal(spec?.personalization, null, type);
  }
});

// ── Taksonomi çözümü ────────────────────────────────────────────────────────
// Etsy ağacında "Pendant Necklaces" İKİ dalda var (Jewelry ve Weddings).
// Ada göre ilk eşleşmeyi almak listing'i sessizce gelinlik dikeyine dosyalardı.

const FAKE_TREE = [
  {
    id: 1,
    name: "Jewelry",
    children: [
      { id: 10, name: "Rings", children: [{ id: 11, name: "Wedding Bands" }] },
      { id: 20, name: "Necklaces", children: [{ id: 1229, name: "Pendant Necklaces" }] },
      { id: 40, name: "Bracelets", children: [] },
    ],
  },
  {
    id: 2,
    name: "Weddings",
    children: [
      { id: 30, name: "Jewelry", children: [{ id: 3092, name: "Pendant Necklaces" }] },
    ],
  },
];

function fakeClient() {
  return { get: async () => ({ results: FAKE_TREE }) } as never;
}

test("kolye taksonomisi Jewelry kökünden çözülür, Weddings ikizi seçilmez", async () => {
  const r = await resolveTaxonomyIdForProtocol(
    fakeClient(),
    LISTING_PROTOCOLS.pendant_necklace,
  );
  assert.deepEqual(r, { ok: true, taxonomyId: 1229 });
});

test("signet taksonomisi Jewelry > Rings'e düşer, Wedding Bands'e değil", async () => {
  const r = await resolveTaxonomyIdForProtocol(
    fakeClient(),
    LISTING_PROTOCOLS.signet_ring,
  );
  assert.deepEqual(r, { ok: true, taxonomyId: 10 });
});

test("kök iddiası olmadan çift eşleşme BAĞIRARAK durur, sessizce ilkini almaz", async () => {
  const rootless = { ...LISTING_PROTOCOLS.pendant_necklace, taxonomyRoot: undefined };
  const r = await resolveTaxonomyIdForProtocol(fakeClient(), rootless);
  assert.equal(r.ok, false);
  assert.match(r.ok === false ? r.error : "", /belirsiz/);
});

test("alyans taksonomisi eski yolla çözülür", async () => {
  const r = await resolveTaxonomyIdForProtocol(
    fakeClient(),
    LISTING_PROTOCOLS.wedding_band,
  );
  assert.deepEqual(r, { ok: true, taxonomyId: 11 });
});
