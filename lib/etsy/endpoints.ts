export const ETSY_API_BASE = "https://api.etsy.com/v3/application";

export const etsyPaths = {
  me: () => `/users/me`,
  shop: (shopId: number | string) => `/shops/${shopId}`,
  shopByName: (name: string) =>
    `/shops?shop_name=${encodeURIComponent(name)}`,
  receipts: (shopId: number | string) => `/shops/${shopId}/receipts`,
  receiptTransactions: (
    shopId: number | string,
    receiptId: number | string,
  ) => `/shops/${shopId}/receipts/${receiptId}/transactions`,
  activeListings: (shopId: number | string) =>
    `/shops/${shopId}/listings/active`,
  // getListingsByShop — includes (Images vb.) yalnız bu uçta desteklenir;
  // state=active ile aktif listeler döner.
  shopListings: (shopId: number | string) => `/shops/${shopId}/listings`,
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
  // uploadListingImage (ürün fotoğrafı yükleme, multipart) — listings_w gerekir.
  listingImages: (shopId: number | string, listingId: number | string) =>
    `/shops/${shopId}/listings/${listingId}/images`,
  // Mağaza bölümleri (başlık + aktif listing sayısı).
  shopSections: (shopId: number | string) => `/shops/${shopId}/sections`,
  // Kargo profilleri (işlem süresi, menşei).
  shippingProfiles: (shopId: number | string) =>
    `/shops/${shopId}/shipping-profiles`,
};
