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
};
