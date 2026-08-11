/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Search,
  MapPin,
  BrainCircuit,
  Image as ImageIcon,
  Mic,
  Zap,
  Calculator,
  Gem,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Upload,
  DollarSign,
  TrendingUp,
  Bell,
} from "lucide-react";
import { CostDiamondBadge } from "@/components/ui/cost-diamond-badge";
import { FEATURE_COST_CATALOG } from "@/lib/ai-cost-catalog";

interface AIResultState {
  text?: string;
  error?: string;
  searchChunks?: Array<{ web?: { uri?: string; title?: string } }>;
  groundingChunks?: unknown[];
}

export default function AIIntelligencePage() {
  const [activeTab, setActiveTab] = useState<
    | "search"
    | "maps"
    | "thinking"
    | "vision"
    | "pricing"
    | "voice"
    | "fast"
    | "cost_matrix"
  >("search");

  // State for Search Grounding
  const [searchQuery, setSearchQuery] = useState(
    "14K gold minimalist rings Etsy top keywords and competitor trends 2026"
  );
  const [searchResult, setSearchResult] = useState<AIResultState | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // State for Maps Grounding
  const [mapsQuery, setMapsQuery] = useState(
    "Jewelry casting workshops and gemstone suppliers in NYC Diamond District 47th Street"
  );
  const [mapsResult, setMapsResult] = useState<AIResultState | null>(null);
  const [mapsLoading, setMapsLoading] = useState(false);

  // State for High Thinking
  const [thinkingPrompt, setThinkingPrompt] = useState(
    "Jade Gold NYC olarak 14K altın takılarda Ons altın %10 yükselirse kar marjımızı korumak için fiyatlama stratejimiz ne olmalı? Etsy reklam harcamaları ve rakip indirimi simülasyonu yap."
  );
  const [thinkingResult, setThinkingResult] = useState<AIResultState | null>(null);
  const [thinkingLoading, setThinkingLoading] = useState(false);

  // State for Vision
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionMime, setVisionMime] = useState<string>("image/jpeg");
  const [visionPrompt, setVisionPrompt] = useState(
    "Bu mücevher görselinde 14K damga belirginliği, ışık dengesi ve Etsy kapak fotoğrafı standartlarını analiz et."
  );
  const [visionResult, setVisionResult] = useState<AIResultState | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);

  // State for Fast Lite
  const [fastPrompt, setFastPrompt] = useState(
    "14k solid gold diamond cross necklace for women"
  );
  const [fastResult, setFastResult] = useState<AIResultState | null>(null);
  const [fastLoading, setFastLoading] = useState(false);

  // State for Target Pricing Calculator
  const [goldPriceOns, setGoldPriceOns] = useState<number>(2400); // $ / oz
  const [karat, setKarat] = useState<number>(14); // 14K
  const [gramWeight, setGramWeight] = useState<number>(3.5);
  const [workmanshipFee, setWorkmanshipFee] = useState<number>(25); // $
  const [targetMargin, setTargetMargin] = useState<number>(45); // %
  const [pricingAiResult, setPricingAiResult] = useState<AIResultState | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  // Voice session simulation
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Handlers
  const handleSearchGrounding = async () => {
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search_grounding", prompt: searchQuery }),
      });
      const data = await res.json();
      setSearchResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Arama hatası";
      setSearchResult({ error: msg });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMapsGrounding = async () => {
    setMapsLoading(true);
    setMapsResult(null);
    try {
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "maps_grounding", prompt: mapsQuery }),
      });
      const data = await res.json();
      setMapsResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Harita hatası";
      setMapsResult({ error: msg });
    } finally {
      setMapsLoading(false);
    }
  };

  const handleHighThinking = async () => {
    setThinkingLoading(true);
    setThinkingResult(null);
    try {
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "high_thinking",
          prompt: thinkingPrompt,
          contextData: `Altın Ons Fiyatı: $${goldPriceOns}, Ortalama İşçilik: $${workmanshipFee}, Hedef Marj: %${targetMargin}`,
        }),
      });
      const data = await res.json();
      setThinkingResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Analiz hatası";
      setThinkingResult({ error: msg });
    } finally {
      setThinkingLoading(false);
    }
  };

  const handleVisionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVisionMime(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      // remove data url prefix if exists
      const base64Data = base64Str.includes(",") ? base64Str.split(",")[1] : base64Str;
      setVisionImage(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeVision = async () => {
    if (!visionImage) return;
    setVisionLoading(true);
    setVisionResult(null);
    try {
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "image_understanding",
          imageBase64: visionImage,
          mimeType: visionMime,
          prompt: visionPrompt,
        }),
      });
      const data = await res.json();
      setVisionResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Görsel analiz hatası";
      setVisionResult({ error: msg });
    } finally {
      setVisionLoading(false);
    }
  };

  const handleFastLite = async () => {
    setFastLoading(true);
    setFastResult(null);
    try {
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fast_lite",
          prompt: `Aşağıdaki ürün anahtar kelimeleri için 13 adet yüksek dönüşümlü Etsy SEO etiketi ve optimize edilmiş ürün başlığı üret:\n${fastPrompt}`,
        }),
      });
      const data = await res.json();
      setFastResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Etiket üretim hatası";
      setFastResult({ error: msg });
    } finally {
      setFastLoading(false);
    }
  };

  // Target Pricing Calculation Math
  // Gold pure price per gram = goldPriceOns / 31.1035
  // Karat pure ratio = karat / 24
  const pureGoldPriceGram = goldPriceOns / 31.1035;
  const rawMaterialCost = pureGoldPriceGram * (karat / 24) * gramWeight;
  const totalProductionCost = rawMaterialCost + workmanshipFee;
  // Etsy fees ~ 6.5% transaction + 3% payment + $0.20 listing
  const estimatedEtsyFeeRatio = 0.095;
  // Retail price = TotalCost / (1 - targetMargin% - etsyFee%)
  const requiredRetailPrice =
    totalProductionCost / (1 - targetMargin / 100 - estimatedEtsyFeeRatio);
  const grossProfit = requiredRetailPrice * (targetMargin / 100);

  const handleAiPricingRecommendation = async () => {
    setPricingLoading(true);
    setPricingAiResult(null);
    try {
      const res = await fetch("/api/ai/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "high_thinking",
          prompt: `Aşağıdaki mücevher maliyet ve hedef fiyatlama verileri için rekabetçi Etsy fiyatlama ve psikolojik fiyat noktaları öner:\n
          - Ons Altın: $${goldPriceOns}
          - Ayar: ${karat}K Gold
          - Ağırlık: ${gramWeight}g
          - Hammadde Maliyeti: $${rawMaterialCost.toFixed(2)}
          - Döküm & İşçilik: $${workmanshipFee}
          - Toplam Üretim Maliyeti: $${totalProductionCost.toFixed(2)}
          - Hedef Kar Marjı: %${targetMargin}
          - Tahmini Perakende Satış Fiyatı: $${requiredRetailPrice.toFixed(2)}
          
          Lütfen indirim stratejisi, ücretsiz kargo eşiği ve Etsy algoritmik avantajı için öneri sun.`,
        }),
      });
      const data = await res.json();
      setPricingAiResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fiyatlandırma öneri hatası";
      setPricingAiResult({ error: msg });
    } finally {
      setPricingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6 border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-md">
              <Sparkles className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Gemini AI İstihbarat & Akıllı Strateji Hub
            </h1>
          </div>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Google Gemini 3.5 & 3.1 modelleri ile canlı Google Search, Maps, yüksek düşünme modu, görsel denetim ve sesli asistan.
          </p>
        </div>

        {/* Firebase Mobile Push Status Bridge Indicator */}
        <div className="flex items-center gap-3 bg-stone-100 dark:bg-stone-900 px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
          <Bell className="w-5 h-5 text-stone-500" />
          <div className="text-xs">
            <p className="font-medium text-stone-800 dark:text-stone-200">
              Firebase Push Bildirim Köprüsü
            </p>
            <p className="text-stone-500">Supabase Ana DB • Firebase Mobil FCM Aktif</p>
          </div>
        </div>
      </div>

      {/* Global Cost Transparency Warning Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-stone-800 dark:text-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
              <span>Şeffaf API & Model Kullanım Ücretlendirme Uyarısı</span>
              <CostDiamondBadge costLabel="💎 Ücretli Modellere Tabi" />
            </p>
            <p className="mt-0.5 text-stone-600 dark:text-stone-400">
              Aşağıdaki her bir AI işlevi geliştirici/üretim API kotalarını kullanır. Her düğmenin ve özelliğin yanında tahmini maliyet ve oluşturduğu Katma Değer (ROI) elmas ikonu (💎) ile açıkça belirtilmiştir.
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab("cost_matrix")}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition shrink-0 flex items-center gap-1"
        >
          <Gem className="w-3.5 h-3.5" /> Fiyatlandırma Matrisini Gör
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 dark:border-stone-800 scrollbar-none">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
            activeTab === "search"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Google Search Grounding</span>
          <CostDiamondBadge costLabel="~$0.003" className="ml-1 bg-white/20 text-white border-white/30" />
        </button>

        <button
          onClick={() => setActiveTab("maps")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
            activeTab === "maps"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Google Maps Grounding</span>
          <CostDiamondBadge costLabel="~$0.004" className="ml-1 bg-white/20 text-white border-white/30" />
        </button>

        <button
          onClick={() => setActiveTab("thinking")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
            activeTab === "thinking"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>Derin Yürütme (High Thinking)</span>
          <CostDiamondBadge costLabel="~$0.015" className="ml-1 bg-white/20 text-white border-white/30" />
        </button>

        <button
          onClick={() => setActiveTab("vision")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
            activeTab === "vision"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Görsel & Ayar İnceleme</span>
          <CostDiamondBadge costLabel="~$0.008" className="ml-1 bg-white/20 text-white border-white/30" />
        </button>

        <button
          onClick={() => setActiveTab("pricing")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
            activeTab === "pricing"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Mücevher Hedef Fiyatlama</span>
          <CostDiamondBadge costLabel="~$0.015" className="ml-1 bg-white/20 text-white border-white/30" />
        </button>

        <button
          onClick={() => setActiveTab("fast")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
            activeTab === "fast"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Hızlı Etiket & SEO (Lite)</span>
          <CostDiamondBadge costLabel="~$0.0005" className="ml-1 bg-white/20 text-white border-white/30" />
        </button>

        <button
          onClick={() => setActiveTab("voice")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
            activeTab === "voice"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Canlı Sesli Asistan</span>
          <CostDiamondBadge costLabel="~$0.03/dk" className="ml-1 bg-white/20 text-white border-white/30" />
        </button>

        <button
          onClick={() => setActiveTab("cost_matrix")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
            activeTab === "cost_matrix"
              ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm"
              : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
          }`}
        >
          <Gem className="w-4 h-4 text-amber-500" />
          <span>Maliyet & Katma Değer Tablosu</span>
        </button>
      </div>

      {/* TAB 1: SEARCH GROUNDING */}
      {activeTab === "search" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Search className="w-5 h-5 text-amber-500" />
                  Google Search Grounding (gemini-3.5-flash)
                </h2>
                <p className="text-xs text-stone-500">
                  Canlı web aramalarıyla güncel Etsy trendleri, pazar haberleri ve rakip analizleri yapın.
                </p>
              </div>
              <CostDiamondBadge costLabel="~$0.0030 / sorgu" approxCostUsd={0.003} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Arama & Trend İstemi
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ör: 2026 Etsy altın kolye arama trendleri ve en çok satan tasarımlar"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleSearchGrounding}
                  disabled={searchLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm flex items-center gap-2 transition disabled:opacity-50"
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Aranıyor...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Canlı Ara (💎 $0.003)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {searchResult && (
              <div className="mt-6 p-5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-800">
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Canlı Google Arama Yanıtı
                  </h3>
                  <span className="text-xs text-stone-500">Model: gemini-3.5-flash + googleSearch</span>
                </div>

                <div className="prose dark:prose-invert prose-sm max-w-none text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                  {searchResult.text}
                </div>

                {/* Grounding Web Search Sources */}
                {searchResult.searchChunks && searchResult.searchChunks.length > 0 && (
                  <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                    <p className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Doğrulanmış Arama Kaynakları:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {searchResult.searchChunks.map((chunk, idx: number) => (
                        <a
                          key={idx}
                          href={chunk.web?.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <span>{chunk.web?.title || "Web Kaynağı"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MAPS GROUNDING */}
      {activeTab === "maps" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-500" />
                  Google Maps Grounding (gemini-3.5-flash)
                </h2>
                <p className="text-xs text-stone-500">
                  NYC Diamond District atölyeleri, dökümcüleri, taş tedarikçileri ve harita lokasyon analizi.
                </p>
              </div>
              <CostDiamondBadge costLabel="~$0.0040 / sorgu" approxCostUsd={0.004} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Harita & Lokasyon İstemi
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mapsQuery}
                  onChange={(e) => setMapsQuery(e.target.value)}
                  placeholder="Ör: NYC 47th Street Diamond District casting houses and gold refiners"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleMapsGrounding}
                  disabled={mapsLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm flex items-center gap-2 transition disabled:opacity-50"
                >
                  {mapsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sorgulanıyor...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4" />
                      <span>Haritada Bul (💎 $0.004)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {mapsResult && (
              <div className="mt-6 p-5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-800">
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Google Maps Lokasyon Sonucu
                  </h3>
                  <span className="text-xs text-stone-500">Model: gemini-3.5-flash + googleMaps</span>
                </div>

                <div className="prose dark:prose-invert prose-sm max-w-none text-stone-700 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                  {mapsResult.text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HIGH THINKING MODE */}
      {activeTab === "thinking" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-amber-500" />
                  Yüksek Düşünme Modu (gemini-3.1-pro-preview HIGH)
                </h2>
                <p className="text-xs text-stone-500">
                  Karmaşık finansal senaryolar, Ons altın hareketleri, kar marjı koruma ve derin stratejik karar desteği.
                </p>
              </div>
              <CostDiamondBadge costLabel="~$0.0150 / analiz" approxCostUsd={0.015} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Stratejik Analiz & Derin Yürütme Sorusu
              </label>
              <textarea
                rows={4}
                value={thinkingPrompt}
                onChange={(e) => setThinkingPrompt(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleHighThinking}
                  disabled={thinkingLoading}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm flex items-center gap-2 transition disabled:opacity-50"
                >
                  {thinkingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Derin Yürütme Yapılıyor...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-4 h-4" />
                      <span>Derin Analiz Başlat (💎 $0.015)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {thinkingResult && (
              <div className="mt-6 p-5 rounded-xl bg-amber-500/5 dark:bg-stone-950 border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-amber-500/20">
                  <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Stratejik Yürütme ve Karar Raporu
                  </h3>
                  <span className="text-xs text-amber-700 dark:text-amber-300">
                    Model: gemini-3.1-pro-preview (HIGH thinkingLevel)
                  </span>
                </div>

                <div className="prose dark:prose-invert prose-sm max-w-none text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                  {thinkingResult.text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: IMAGE UNDERSTANDING */}
      {activeTab === "vision" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-500" />
                  Mücevher & Görsel Denetimi (gemini-3.1-pro-preview Multimodal)
                </h2>
                <p className="text-xs text-stone-500">
                  Ürün fotoğrafı yükleyin: Ayar damgası, ışık kalitesi, zincir detayı ve Etsy kapak görseli uyumu analizi.
                </p>
              </div>
              <CostDiamondBadge costLabel="~$0.0080 / görsel" approxCostUsd={0.008} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Mücevher Görseli Yükle
                </label>
                <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 text-center hover:border-amber-500 transition cursor-pointer relative bg-stone-50 dark:bg-stone-950">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleVisionUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {visionImage ? (
                    <div className="space-y-2">
                      <img
                        src={`data:${visionMime};base64,${visionImage}`}
                        alt="Uploaded jewelry"
                        className="max-h-48 mx-auto rounded-xl object-contain border shadow-sm"
                      />
                      <p className="text-xs text-emerald-600 font-medium">Görsel yüklendi (Değiştirmek için tıklayın)</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-stone-500">
                      <Upload className="w-8 h-8 mx-auto text-stone-400" />
                      <p className="text-sm font-medium">Fotoğraf sürükleyin veya seçin</p>
                      <p className="text-xs text-stone-400">PNG, JPG, WEBP</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Özel İnceleme İstemi (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={visionPrompt}
                    onChange={(e) => setVisionPrompt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm"
                  />
                </div>

                <button
                  onClick={handleAnalyzeVision}
                  disabled={!visionImage || visionLoading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {visionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Fotoğraf İncelemekte...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>Görseli Analiz Et (💎 $0.008)</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2 block">
                  AI Görsel Denetim Raporu
                </label>
                {visionResult ? (
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-3 h-80 overflow-y-auto">
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Modeller: gemini-3.1-pro-preview
                    </p>
                    <div className="prose dark:prose-invert prose-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                      {visionResult.text}
                    </div>
                  </div>
                ) : (
                  <div className="h-80 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center text-stone-400 p-6 text-center">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">Fotoğraf yükleyip &quot;Görseli Analiz Et&quot; butonuna basarak yapay zeka denetim raporunu başlatın.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TARGET PRICING OPTIMIZER */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-500" />
                  Gold Ons & Hedef Marj Fiyatlandırma Hesaplayıcısı
                </h2>
                <p className="text-xs text-stone-500">
                  Ons altın spot fiyatı, ayar saflığı, işçilik ve Etsy kesintileriyle hedef satış fiyatı belirleyin.
                </p>
              </div>
              <CostDiamondBadge costLabel="~$0.0150 / AI Öneri" approxCostUsd={0.015} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Ons Altın Spot Fiyatı ($ / oz)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="number"
                    value={goldPriceOns}
                    onChange={(e) => setGoldPriceOns(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-stone-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Ayar (Karat Gold)
                </label>
                <select
                  value={karat}
                  onChange={(e) => setKarat(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-stone-900"
                >
                  <option value={10}>10K (0.417 Saf Altın)</option>
                  <option value={14}>14K (0.585 Saf Altın)</option>
                  <option value={18}>18K (0.750 Saf Altın)</option>
                  <option value={24}>24K (0.999 Has Altın)</option>
                </select>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Ürün Ağırlığı (Gram)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={gramWeight}
                  onChange={(e) => setGramWeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-stone-900"
                />
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Döküm & İşçilik Maliyeti ($)
                </label>
                <input
                  type="number"
                  value={workmanshipFee}
                  onChange={(e) => setWorkmanshipFee(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-stone-900"
                />
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-stone-50 dark:bg-stone-950 border">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Hedef Kar Marjı (%)
                </label>
                <input
                  type="number"
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-stone-900"
                />
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                  Tahmini Tavsiye Satış Fiyatı
                </span>
                <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  ${requiredRetailPrice.toFixed(2)}
                </p>
                <span className="text-[10px] text-stone-500">
                  (Etsy %9.5 işlem/ödeme kesintisi dahil)
                </span>
              </div>
            </div>

            {/* Calculated Details Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs p-4 rounded-xl bg-stone-100 dark:bg-stone-950">
              <div>
                <span className="text-stone-500 block">Saf Gram Altın:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  ${pureGoldPriceGram.toFixed(2)} / g
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Hammadde Maliyeti:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  ${rawMaterialCost.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Toplam Üretim Maliyeti:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  ${totalProductionCost.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Net Brüt Kar:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ${grossProfit.toFixed(2)} (%{targetMargin})
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAiPricingRecommendation}
                disabled={pricingLoading}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm flex items-center gap-2 transition disabled:opacity-50"
              >
                {pricingLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Strateji Üretiliyor...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    <span>Gemini AI Psikolojik Fiyat Önerisi Al (💎 $0.015)</span>
                  </>
                )}
              </button>
            </div>

            {pricingAiResult && (
              <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Gemini Psikolojik & Rekabetçi Fiyatlama Stratejisi
                </h3>
                <div className="prose dark:prose-invert prose-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap">
                  {pricingAiResult.text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: FAST LITE ASSISTANT */}
      {activeTab === "fast" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Ultra Hızlı SEO & Etiket Üretici (gemini-3.1-flash-lite)
                </h2>
                <p className="text-xs text-stone-500">
                  Düşük gecikme süresiyle anında 13 Etsy SEO etiketi, SKU düzenleyici ve hızlı pazarlama başlığı.
                </p>
              </div>
              <CostDiamondBadge costLabel="~$0.0005 / işlem" approxCostUsd={0.0005} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Ürün / Listing Özeti
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fastPrompt}
                  onChange={(e) => setFastPrompt(e.target.value)}
                  placeholder="Ör: 14k solid gold diamond cross necklace for women"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleFastLite}
                  disabled={fastLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm flex items-center gap-2 transition disabled:opacity-50"
                >
                  {fastLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Üretiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Hızlı Üret (💎 $0.0005)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {fastResult && (
              <div className="mt-6 p-5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Ultra Hızlı Üretim Yanıtı
                  </h3>
                  <span className="text-xs text-stone-500">Model: gemini-3.1-flash-lite</span>
                </div>

                <div className="prose dark:prose-invert prose-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                  {fastResult.text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: LIVE VOICE CONVERSATION */}
      {activeTab === "voice" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6 text-center">
            <div className="max-w-xl mx-auto space-y-2">
              <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 inline-block mb-2">
                <Mic className="w-8 h-8" />
              </span>
              <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center justify-center gap-2">
                <span>Canlı Sesli Asistan Konsolu</span>
                <CostDiamondBadge costLabel="~$0.030 / dk" approxCostUsd={0.03} />
              </h2>
              <p className="text-xs text-stone-500">
                gemini-3.1-flash-live-preview modeli ile atölyede veya tezgah başında eller serbest sesli diyalog ve stok sorulama.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 max-w-lg mx-auto space-y-6">
              <div className="flex justify-center">
                <button
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                  className={`relative p-6 rounded-full transition duration-300 ${
                    isVoiceActive
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/40 animate-pulse"
                      : "bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30"
                  }`}
                >
                  <Mic className="w-10 h-10" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {isVoiceActive ? "Canlı Ses Akışı Aktif (Dinleniyor...)" : "Sesli Diyaloğu Başlatmak için Mikrofona Tıklayın"}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Örnek Komut: &quot;14K solitaire yüzük stoğumuzda kaç adet var?&quot; veya &quot;Ons altın durumunu özetle.&quot;
                </p>
              </div>

              {isVoiceActive && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                    <span>Gemini Live API Akışı</span>
                    <span className="text-red-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      CANLI (💎 ~$0.03/dk)
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300 italic">
                    &quot;Jade Gold Atölye Asistanı bağlandı: Dinliyorum, 14K ve 18K altın döküm durumunu güncellemek mi istersiniz?&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: COST MATRIX & ROI TRANSPARENCY TABLE */}
      {activeTab === "cost_matrix" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Gem className="w-5 h-5 text-amber-500" />
                Şeffaf API Maliyet & Katma Değer Katalogu
              </h2>
              <p className="text-xs text-stone-500">
                Jade Gold NYC panelindeki tüm AI modelleri, tahmini birim maliyetleri ve oluşturdukları finansal katma değer.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500">
                    <th className="py-3 px-4 font-semibold">Özellik / Modül</th>
                    <th className="py-3 px-4 font-semibold">Kullanılan Gemini Modeli</th>
                    <th className="py-3 px-4 font-semibold">Tahmini İşlem Maliyeti</th>
                    <th className="py-3 px-4 font-semibold">Oluşturduğu Katma Değer (ROI)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {Object.entries(FEATURE_COST_CATALOG).map(([key, item]) => (
                    <tr key={key} className="hover:bg-stone-50 dark:hover:bg-stone-950 transition">
                      <td className="py-3.5 px-4 font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <CostDiamondBadge costLabel={item.costLabel} />
                        <span>{item.feature}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-stone-600 dark:text-stone-400">
                        {item.model}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400">
                        ${item.approxCostUsd.toFixed(4)}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 dark:text-stone-300">
                        {item.valueCreated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
