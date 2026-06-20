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
  reviews: (shopId: number | string) => `/shops/${shopId}/reviews`,
};
