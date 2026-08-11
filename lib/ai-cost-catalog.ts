export interface CostEstimate {
  model: string;
  feature: string;
  approxCostUsd: number;
  costLabel: string;
  valueCreated: string;
}

export const FEATURE_COST_CATALOG: Record<string, CostEstimate> = {
  fast_lite: {
    model: "gemini-3.1-flash-lite",
    feature: "Hızlı Etiket & Başlık Önerisi",
    approxCostUsd: 0.0005,
    costLabel: "~$0.0005 / işlem",
    valueCreated: "Anında SEO etiketi ve SKU temizleme",
  },
  general_flash: {
    model: "gemini-3.5-flash",
    feature: "Genel Metin ve İçerik Üretimi",
    approxCostUsd: 0.001,
    costLabel: "~$0.0010 / işlem",
    valueCreated: "Etsy listing açıklamaları ve pazarlama metinleri",
  },
  search_grounding: {
    model: "gemini-3.5-flash",
    feature: "Canlı Google Arama Verisi (Search Grounding)",
    approxCostUsd: 0.003,
    costLabel: "~$0.0030 / sorgu",
    valueCreated: "Güncel Etsy algoritma, trend ve rakip arama verileri",
  },
  maps_grounding: {
    model: "gemini-3.5-flash",
    feature: "Harita & Lokasyon Verisi (Maps Grounding)",
    approxCostUsd: 0.004,
    costLabel: "~$0.0040 / sorgu",
    valueCreated: "NYC Diamond District, rakip mağaza ve döküm atölyesi lokasyon analizi",
  },
  image_understanding: {
    model: "gemini-3.1-pro-preview",
    feature: "Görsel ve Takı İnceleme (Vision Analysis)",
    approxCostUsd: 0.008,
    costLabel: "~$0.0080 / görsel",
    valueCreated: "Ayar damga kontrolü, ışık kalitesi ve Etsy görsel denetimi",
  },
  high_thinking: {
    model: "gemini-3.1-pro-preview",
    feature: "Derin Strateji ve Fiyatlama (High Thinking Mode)",
    approxCostUsd: 0.015,
    costLabel: "~$0.0150 / analiz",
    valueCreated: "Altın volatilite marjı, büyüme senaryoları ve derin finans analizi",
  },
  live_voice: {
    model: "gemini-3.1-flash-live-preview",
    feature: "Sesli Canlı Asistan (Live Voice API)",
    approxCostUsd: 0.03,
    costLabel: "~$0.0300 / dakika",
    valueCreated: "Atölye ve stok yönetiminde eller serbest sesli komut ve canlı diyalog",
  },
};
