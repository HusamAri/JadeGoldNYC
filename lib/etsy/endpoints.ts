export const ETSY_API_BASE = "https://api.etsy.com/v3/application";

export const etsyPaths = {
  me: () => `/users/me`,
  shop: (shopId: number | string) => `/shops/${shopId}`,
  shopByName: (name: string) =>
    `/shops?shop_name=${encodeURIComponent(name)}`,
  receipts: (shopId: number | string) => `/shops/${shopId}/receipts`,
  // Tek sipariş (webhook resource_url'inden id çözülünce taze durum çekilir).
  receipt: (shopId: number | string, receiptId: number | string) =>
    `/shops/${shopId}/receipts/${receiptId}`,
  receiptTransactions: (
    shopId: number | string,
    receiptId: number | string,
  ) => `/shops/${shopId}/receipts/${receiptId}/transactions`,
  activeListings: (shopId: number | string) =>
    `/shops/${shopId}/listings/active`,
  // Uygulama düzeyi (mağazalar arası) aktif listing araması — rekabet fiyat
  // araştırması. keywords + sort_on=score ile organik/relevans sıralı sonuç.
  activeListingsSearch: () => `/listings/active`,
  // getListingsByShop — includes (Images vb.) yalnız bu uçta desteklenir;
  // state=active ile aktif listeler döner.
  shopListings: (shopId: number | string) => `/shops/${shopId}/listings`,
  // createDraftListing (POST, form-encoded) — panel taslağını Etsy'de DRAFT
  // listing olarak açar. shopListings ile aynı uç; niyet netliği için ayrı ad.
  // listings_w kapsamı gerekir.
  createListing: (shopId: number | string) => `/shops/${shopId}/listings`,
  reviews: (shopId: number | string) => `/shops/${shopId}/reviews`,
  ledgerEntries: (shopId: number | string) =>
    `/shops/${shopId}/payment-account/ledger-entries`,
  // Envanter (adet) okuma/yazma — shop_id gerektirmez, listing_id yeterli.
  listingInventory: (listingId: number | string) =>
    `/listings/${listingId}/inventory`,
  // Tek listing okuma (açıklama vb.) — shop_id gerektirmez.
  listing: (listingId: number | string) => `/listings/${listingId}`,
  // updateListing (açıklama yazma) — shop_id + listings_w gerekir.
  shopListing: (shopId: number | string, listingId: number | string) =>
    `/shops/${shopId}/listings/${listingId}`,
  listingTranslation: (
    shopId: number | string,
    listingId: number | string,
    language: string,
  ) => `/shops/${shopId}/listings/${listingId}/translations/${language}`,
  // uploadListingImage (ürün fotoğrafı yükleme, multipart) — listings_w gerekir.
  listingImages: (shopId: number | string, listingId: number | string) =>
    `/shops/${shopId}/listings/${listingId}/images`,
  // Kişiselleştirme (2025 migrasyonu): legacy is_personalizable/personalization_*
  // create alanları KALDIRILDI. Listing oluşturulduktan sonra bu uca JSON
  // `personalization_questions` dizisi POST edilir. Çoklu soru için query
  // `supports_multiple_personalization_questions=true` gerekir.
  listingPersonalization: (shopId: number | string, listingId: number | string) =>
    `/shops/${shopId}/listings/${listingId}/personalization`,
  // Mağaza bölümleri (başlık + aktif listing sayısı).
  shopSections: (shopId: number | string) => `/shops/${shopId}/sections`,
  // Kargo profilleri (işlem süresi, menşei).
  shippingProfiles: (shopId: number | string) =>
    `/shops/${shopId}/shipping-profiles`,
  // İade politikaları — createDraftListing fiziksel üründe return_policy_id ister.
  returnPolicies: (shopId: number | string) =>
    `/shops/${shopId}/policies/return`,
  // İşlem profilleri (readiness states) — Etsy 2025 migrasyonundan beri fiziksel
  // listing'de `readiness_state_id` ZORUNLU. GET liste / POST oluştur (aynı uç).
  // Alanlar: readiness_state (ready_to_ship|made_to_order), min/max_processing_time.
  readinessStateDefinitions: (shopId: number | string) =>
    `/shops/${shopId}/readiness-state-definitions`,
  // Satıcı taksonomisi (kategori ağacı) — taxonomy_id çözümü için.
  sellerTaxonomyNodes: () => `/seller-taxonomy/nodes`,
};
