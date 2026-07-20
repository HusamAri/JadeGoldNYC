"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calculator,
  Eye,
  Loader2,
  Save,
  Sparkles,
  Layers,
  RotateCcw,
  Undo2,
} from "lucide-react";

import {
  updateVariant,
  restoreVariantPricesFromEtsy,
  restoreVariantPricesFromAudit,
  saveVariantsBulkPrices,
  undoVariantPrices,
  type VariantPriceSnapshot,
} from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { ProductWeightInput } from "@/components/product-weight-input";
import {
  PriceChangePreviewDialog,
  type PricePreviewRow,
} from "@/components/listing/price-change-preview";
import {
  inferWeightsBySize,
  distributePriceByWeight,
  propagatePricesFromAnchor,
  propagatePricesFromMinGramPrice,
  unitPriceCentsPerGram,
  type DistVariant,
} from "@/lib/etsy/distribute";
import type { ListingVariantRow } from "@/lib/db/queries/listings";
import type { CompetitorGramProjection } from "@/lib/etsy/competitor-gram-price";
import {
  detectKarat,
  purchaseCostCentsForGrams,
  type KaratType,
} from "@/lib/gold-cost";
import { centsToDecimal, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RowState {
  price: string; // USD ("129.00")
  weight: string; // gram ("5.75")
  quantity: string;
}

interface Suggestion {
  price?: boolean;
  weight?: boolean;
}

function toCents(s: string): number | null {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = Math.round(parseFloat(v) * 100);
  return Number.isFinite(n) && n > 0 ? n : null;
}
function toGram(s: string): number | null {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function initialRows(variants: ListingVariantRow[]): Record<string, RowState> {
  const out: Record<string, RowState> = {};
  for (const v of variants) {
    out[v.sku] = {
      price:
        v.price_cents != null ? centsToDecimal(v.price_cents).toFixed(2) : "",
      weight: v.weight_grams != null ? String(v.weight_grams) : "",
      quantity: v.quantity != null ? String(v.quantity) : "",
    };
  }
  return out;
}

const SUGGESTED_CLASS =
  "text-primary ring-1 ring-primary/50 dark:ring-primary/40";

/** Rakip eşlemesinden yansıtılan fiyat — liste fiyatından ayrı renk. */
const RIVAL_PROJECT_CLASS =
  "font-mono text-[11px] tabular-nums text-amber-700 dark:text-amber-300";

const WEIGHT_SOURCE_LABELS: Record<string, string> = {
  manual: "elle",
  inferred: "çıkarım",
  etsy: "etsy",
  description: "açıklama",
  "description-scaled": "açıklama·ölçekli",
  shipstation: "tartı",
};

/**
 * Varyant editörü — birim fiyat ($/g) merkezli.
 * Bir varyanta satış fiyatı girilince diğerleri P_i = (P/g) · g_i ile dolar.
 * Etsy / audit geri alma ile ezilen matrisi eski haline döndürebilirsin.
 */
export function VariantEditor({
  productId,
  variants,
  currency,
  productWeightGrams,
  productTitle,
  productTags,
  productMaterials,
  purchasePrice14kCents,
  purchasePrice10kCents,
  rivalProjection = null,
}: {
  productId: string;
  variants: ListingVariantRow[];
  currency: string;
  /** Varyantsız (tek-parça) listing'de künye gramajı — ürün seviyesinde tutulur. */
  productWeightGrams?: number | null;
  productTitle?: string;
  productTags?: string[] | null;
  productMaterials?: string[] | null;
  purchasePrice14kCents?: number;
  purchasePrice10kCents?: number;
  /**
   * Rakip varyant eşlemesinden $/g × gram yansıması.
   * Liste fiyatını ezmez; Satış sütununda amber renkle gösterilir.
   */
  rivalProjection?: CompetitorGramProjection | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    initialRows(variants),
  );
  const [suggested, setSuggested] = useState<Record<string, Suggestion>>({});
  const [weightDirty, setWeightDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<VariantPriceSnapshot[] | null>(
    null,
  );
  const [undoing, setUndoing] = useState(false);
  /** Toplu kutu: EN DÜŞÜK gramlı varyantın satış fiyatı (örn. 700). */
  const [bulkMinPrice, setBulkMinPrice] = useState("");
  const [anchorSku, setAnchorSku] = useState<string | null>(
    () => variants.find((v) => v.price_cents != null)?.sku ?? variants[0]?.sku ?? null,
  );
  const propagateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Etsy/audit geri alma sonrası sunucu verisini ekrana yansıt.
  const serverFingerprint = variants
    .map(
      (v) =>
        `${v.sku}:${v.price_cents ?? ""}:${v.weight_grams ?? ""}:${v.quantity ?? ""}`,
    )
    .join("|");
  const prevFingerprint = useRef(serverFingerprint);
  useEffect(() => {
    if (prevFingerprint.current === serverFingerprint) return;
    prevFingerprint.current = serverFingerprint;
    setRows(initialRows(variants));
    setSuggested({});
  }, [serverFingerprint, variants]);

  const karat: KaratType | null = useMemo(
    () =>
      detectKarat(
        productTitle ?? "",
        productTags,
        productMaterials,
      ),
    [productTitle, productTags, productMaterials],
  );

  const purchasePrices = useMemo(
    () => ({
      "14K": purchasePrice14kCents,
      "10K": purchasePrice10kCents,
    }),
    [purchasePrice14kCents, purchasePrice10kCents],
  );

  const anchorUnit = useMemo(() => {
    if (!anchorSku) return null;
    const r = rows[anchorSku];
    const p = toCents(r?.price ?? "");
    const w = toGram(r?.weight ?? "");
    if (p == null || w == null) return null;
    return unitPriceCentsPerGram(p, w);
  }, [anchorSku, rows]);

  /** Taslak satırlardan (yoksa sunucu gramından) en hafif varyant. */
  const minGramInfo = useMemo(() => {
    let best: { sku: string; grams: number } | null = null;
    for (const v of variants) {
      const g = toGram(rows[v.sku]?.weight ?? "") ?? v.weight_grams;
      if (g == null || !(g > 0)) continue;
      if (!best || g < best.grams) best = { sku: v.sku, grams: g };
    }
    return best;
  }, [variants, rows]);

  const bulkUnitPreview = useMemo(() => {
    const price = toCents(bulkMinPrice);
    if (price == null || !minGramInfo) return null;
    return {
      unit: price / minGramInfo.grams,
      minSku: minGramInfo.sku,
      minGrams: minGramInfo.grams,
    };
  }, [bulkMinPrice, minGramInfo]);

  function costForGrams(grams: number | null): number | null {
    if (grams == null || !karat) return null;
    return purchaseCostCentsForGrams(grams, karat, purchasePrices);
  }

  if (variants.length === 0) {
    const singleCost = costForGrams(productWeightGrams ?? null);
    return (
      <div className="space-y-4 rounded-2xl border border-dashed p-6">
        <p className="text-muted-foreground text-center text-sm">
          Bu listing&apos;de varyant yok. Varyantlar Etsy senkronundan gelir ya
          da yeni listing açılışında girilir.
        </p>
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-muted-foreground text-xs">
            Ürün gramajı (altın maliyet motorunun ve künye bütünlüğünün kaynağı):
          </p>
          <ProductWeightInput
            productId={productId}
            initialGrams={productWeightGrams ?? null}
          />
          {singleCost != null && (
            <p className="text-muted-foreground text-xs tabular-nums">
              Tahmini alım maliyeti: {formatMoney(singleCost, currency)}
              {karat ? ` · ${karat}` : ""}
            </p>
          )}
        </div>
      </div>
    );
  }

  function distBaseFrom(rs: Record<string, RowState>): DistVariant[] {
    return variants.map((v) => {
      const r = rs[v.sku];
      return {
        sku: v.sku,
        weightGrams: toGram(r?.weight ?? ""),
        priceCents: toCents(r?.price ?? ""),
      };
    });
  }

  function distBase(): DistVariant[] {
    return distBaseFrom(rows);
  }

  /** Çapa fiyat + gram → birim $/g ile tüm satırları güncelle (ekranda). */
  function applyUnitPriceFrom(
    targetSku: string,
    rs: Record<string, RowState>,
    opts?: { silent?: boolean },
  ) {
    const r = rs[targetSku];
    const anchorPrice = toCents(r?.price ?? "");
    const anchorWeight = toGram(r?.weight ?? "");
    if (anchorPrice == null || anchorWeight == null) {
      if (!opts?.silent) {
        toast.error(
          "Çapa satırda satış fiyatı ve gram olmalı — önce gramı gir.",
        );
      }
      return;
    }

    const base = distBaseFrom(rs);
    const wPreds = inferWeightsBySize(base);
    const wMap = new Map(wPreds.map((p) => [p.sku, p]));
    const withWeights: DistVariant[] = base.map((v) => ({
      ...v,
      weightGrams: v.weightGrams ?? wMap.get(v.sku)?.weightGrams ?? null,
    }));
    // Çapanın güncel fiyatını kullan (base eski rows'tan gelebilir).
    const withAnchor = withWeights.map((v) =>
      v.sku === targetSku ? { ...v, priceCents: anchorPrice } : v,
    );

    const preds = propagatePricesFromAnchor(
      withAnchor,
      targetSku,
      anchorPrice,
    );
    if (preds.length === 0) {
      if (!opts?.silent) toast.info("Dağıtılacak ağırlıklı varyant yok.");
      return;
    }

    const nextRows = { ...rs };
    const nextSuggested: Record<string, Suggestion> = { ...suggested };
    const nextDirty = new Set(weightDirty);
    let filledWeights = 0;
    let priced = 0;
    const unit = unitPriceCentsPerGram(anchorPrice, anchorWeight);

    for (const p of wPreds) {
      const row = nextRows[p.sku];
      if (!row || row.weight.trim()) continue;
      nextRows[p.sku] = { ...row, weight: p.weightGrams.toFixed(2) };
      nextSuggested[p.sku] = { ...nextSuggested[p.sku], weight: true };
      nextDirty.add(p.sku);
      filledWeights += 1;
    }
    for (const p of preds) {
      const row = nextRows[p.sku];
      if (!row) continue;
      const nextPrice = (p.priceCents / 100).toFixed(2);
      if (row.price === nextPrice) continue;
      nextRows[p.sku] = { ...nextRows[p.sku], price: nextPrice };
      nextSuggested[p.sku] = {
        ...nextSuggested[p.sku],
        price: p.sku !== targetSku,
      };
      priced += 1;
    }

    setRows(nextRows);
    setSuggested(nextSuggested);
    setWeightDirty(nextDirty);
    setAnchorSku(targetSku);
    if (!opts?.silent) {
      const unitLabel =
        unit != null ? ` · birim ${(unit / 100).toFixed(2)} $/g` : "";
      toast.success(
        `${targetSku} birim fiyatından ${priced} varyant taslakta${unitLabel}` +
          (filledWeights > 0 ? ` · ${filledWeights} gram önerildi` : "") +
          " — Önizle ve uygula ile onayla.",
      );
    }
  }

  function setRow(sku: string, key: keyof RowState, value: string) {
    setRows((rs) => {
      const next = { ...rs, [sku]: { ...rs[sku], [key]: value } };
      rowsRef.current = next;
      return next;
    });
    if (key === "weight") {
      setWeightDirty((s) => new Set(s).add(sku));
    }
    if (key === "price") {
      setAnchorSku(sku);
      if (propagateTimer.current) clearTimeout(propagateTimer.current);
      propagateTimer.current = setTimeout(() => {
        const rs = rowsRef.current;
        const price = toCents(rs[sku]?.price ?? "");
        const weight = toGram(rs[sku]?.weight ?? "");
        if (price != null && weight != null) {
          applyUnitPriceFrom(sku, rs, { silent: true });
        }
      }, 450);
    }
    const field = key === "weight" ? "weight" : key === "price" ? "price" : null;
    if (field) {
      setSuggested((sg) => ({ ...sg, [sku]: { ...sg[sku], [field]: false } }));
    }
  }

  /** Boş gram/fiyat hücrelerine distribute.ts önerilerini yazar (mor, kayıtsız). */
  function autoFill() {
    const base = distBase();
    const wPreds = inferWeightsBySize(base);
    const wMap = new Map(wPreds.map((p) => [p.sku, p]));
    const withWeights: DistVariant[] = base.map((v) => ({
      ...v,
      weightGrams: v.weightGrams ?? wMap.get(v.sku)?.weightGrams ?? null,
    }));
    const pPreds = distributePriceByWeight(withWeights);

    let wCount = 0;
    let pCount = 0;
    const nextRows = { ...rows };
    const nextSuggested: Record<string, Suggestion> = { ...suggested };
    const nextDirty = new Set(weightDirty);

    for (const p of wPreds) {
      const r = nextRows[p.sku];
      if (!r || r.weight.trim()) continue;
      nextRows[p.sku] = { ...r, weight: p.weightGrams.toFixed(2) };
      nextSuggested[p.sku] = { ...nextSuggested[p.sku], weight: true };
      nextDirty.add(p.sku);
      wCount += 1;
    }
    for (const p of pPreds) {
      const r = nextRows[p.sku];
      if (!r || r.price.trim()) continue;
      nextRows[p.sku] = {
        ...nextRows[p.sku],
        price: (p.priceCents / 100).toFixed(2),
      };
      nextSuggested[p.sku] = { ...nextSuggested[p.sku], price: true };
      pCount += 1;
    }

    if (wCount === 0 && pCount === 0) {
      toast.info(
        "Önerilecek eksik hücre yok — bilinen gram/fiyat noktası yetersiz olabilir.",
      );
      return;
    }
    setRows(nextRows);
    setSuggested(nextSuggested);
    setWeightDirty(nextDirty);
    toast.success(
      `${wCount} gram, ${pCount} fiyat önerisi dolduruldu — mor değerler kaydetmeden yazılmaz.`,
    );
  }

  function bulkFromAnchor(sku?: string) {
    const targetSku = sku ?? anchorSku;
    if (!targetSku) {
      toast.error("Önce bir varyant fiyatı seç veya gir.");
      return;
    }
    applyUnitPriceFrom(targetSku, rowsRef.current);
  }

  /**
   * Toplu kutu: girilen tutar = min-gram varyantın fiyatı.
   * Taslağa yaz → önizleme aç (onay olmadan DB’ye yazılmaz).
   */
  function applyBulkMinGramDraft() {
    const priceCents = toCents(bulkMinPrice);
    if (priceCents == null) {
      toast.error("Min-gram satış fiyatı gir (örn. 700).");
      return;
    }
    const rs = rowsRef.current;
    const base = distBaseFrom(rs);
    const wPreds = inferWeightsBySize(base);
    const wMap = new Map(wPreds.map((p) => [p.sku, p]));
    const withWeights: DistVariant[] = base.map((v) => ({
      ...v,
      weightGrams: v.weightGrams ?? wMap.get(v.sku)?.weightGrams ?? null,
    }));

    const result = propagatePricesFromMinGramPrice(withWeights, priceCents);
    if (!result) {
      toast.error(
        "Gramı olan varyant yok — önce gramları gir veya eksikleri hesapla.",
      );
      return;
    }

    const nextRows = { ...rs };
    const nextSuggested: Record<string, Suggestion> = { ...suggested };
    const nextDirty = new Set(weightDirty);

    for (const p of wPreds) {
      const row = nextRows[p.sku];
      if (!row || row.weight.trim()) continue;
      nextRows[p.sku] = { ...row, weight: p.weightGrams.toFixed(2) };
      nextSuggested[p.sku] = { ...nextSuggested[p.sku], weight: true };
      nextDirty.add(p.sku);
    }
    for (const p of result.predictions) {
      const row = nextRows[p.sku];
      if (!row) continue;
      nextRows[p.sku] = {
        ...row,
        price: (p.priceCents / 100).toFixed(2),
      };
      nextSuggested[p.sku] = { ...nextSuggested[p.sku], price: true };
    }

    setRows(nextRows);
    rowsRef.current = nextRows;
    setSuggested(nextSuggested);
    setWeightDirty(nextDirty);
    setAnchorSku(result.minSku);
    toast.success(
      `Taslak: min ${result.minGrams.toFixed(2)}g = $${(priceCents / 100).toFixed(2)} · birim ${(result.unitCentsPerGram / 100).toFixed(2)} $/g · ${result.predictions.length} varyant — önizleyip onayla.`,
    );
    // Önizlemeyi bir tick sonra aç (state settle).
    setTimeout(() => setPreviewOpen(true), 0);
  }

  function buildPreviewRows(): PricePreviewRow[] {
    return variants.map((v) => ({
      sku: v.sku,
      label: v.label,
      grams: toGram(rows[v.sku]?.weight ?? "") ?? v.weight_grams,
      beforeCents: v.price_cents,
      afterCents: toCents(rows[v.sku]?.price ?? ""),
    }));
  }

  function openPricePreview() {
    const preview = buildPreviewRows();
    const changed = preview.filter((r) => r.beforeCents !== r.afterCents);
    if (changed.length === 0) {
      toast.info("Kayda değer fiyat değişikliği yok.");
      return;
    }
    const missingAfter = changed.filter((r) => r.afterCents == null);
    if (missingAfter.length > 0) {
      toast.error("Yeni fiyat boş olan satır var — doldur veya eskiye döndür.");
      return;
    }
    setPreviewOpen(true);
  }

  function confirmPriceApply() {
    const preview = buildPreviewRows().filter(
      (r) => r.beforeCents !== r.afterCents && r.afterCents != null,
    );
    if (preview.length === 0) {
      setPreviewOpen(false);
      return;
    }
    const items = preview.map((r) => ({
      sku: r.sku,
      price: ((r.afterCents as number) / 100).toFixed(2),
    }));
    setBulkSaving(true);
    saveVariantsBulkPrices(productId, items)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        if (res.previous) setUndoSnapshot(res.previous);
        setSuggested({});
        setPreviewOpen(false);
        toast.success(
          `${res.updated ?? 0} fiyat uygulandı — geri alabilirsin.`,
        );
        router.refresh();
      })
      .finally(() => setBulkSaving(false));
  }

  function undoLastApply() {
    if (!undoSnapshot?.length) {
      toast.info("Geri alınacak son uygulama yok.");
      return;
    }
    setUndoing(true);
    undoVariantPrices(productId, undoSnapshot)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(`${res.restored ?? 0} fiyat geri alındı.`);
        setUndoSnapshot(null);
        router.refresh();
      })
      .finally(() => setUndoing(false));
  }

  function restoreFromEtsy() {
    setRestoring(true);
    restoreVariantPricesFromEtsy(productId)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(
          `Etsy’den ${res.variants ?? 0} varyant fiyatı geri alındı.`,
        );
        router.refresh();
      })
      .finally(() => setRestoring(false));
  }

  function restoreFromAudit() {
    setRestoring(true);
    restoreVariantPricesFromAudit(productId)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(
          `Önceki fiyatlara dönüldü (${res.restored ?? 0} varyant).`,
        );
        router.refresh();
      })
      .finally(() => setRestoring(false));
  }

  function save(sku: string) {
    const r = rows[sku];
    if (!r) return;
    const server = variants.find((v) => v.sku === sku);
    const draftPrice = toCents(r.price);
    const priceChanged = (server?.price_cents ?? null) !== draftPrice;

    // Fiyat değiştiyse önizleme zorunlu; yalnız gram/adet ise doğrudan yaz.
    if (priceChanged) {
      setAnchorSku(sku);
      openPricePreview();
      return;
    }

    setSaving((s) => new Set(s).add(sku));
    updateVariant(productId, sku, {
      price: r.price,
      weight: r.weight,
      quantity: r.quantity,
      weightDirty: weightDirty.has(sku),
    })
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(`${sku} kaydedildi.`);
        setSuggested((sg) => ({ ...sg, [sku]: {} }));
        setWeightDirty((s) => {
          const n = new Set(s);
          n.delete(sku);
          return n;
        });
        router.refresh();
      })
      .finally(() =>
        setSaving((s) => {
          const n = new Set(s);
          n.delete(sku);
          return n;
        }),
      );
  }

  const pendingPriceChanges = buildPreviewRows().filter(
    (r) => r.beforeCents !== r.afterCents,
  ).length;

  return (
    <div className="space-y-4">
      {undoSnapshot && undoSnapshot.length > 0 && (
        <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm">
          <span>
            Son fiyat uygulaması geri alınabilir ({undoSnapshot.length} satır).
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={undoing}
            onClick={undoLastApply}
          >
            {undoing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Undo2 className="size-4" />
            )}
            Geri al
          </Button>
        </div>
      )}

      {rivalProjection && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5 text-sm">
          <div className="min-w-0 space-y-0.5">
            <p className="font-mono text-[10px] tracking-[0.14em] text-amber-800 uppercase dark:text-amber-200">
              Rakip eşlemesi · gram fiyat yansıması
            </p>
            <p className="text-muted-foreground text-xs">
              Çapa{" "}
              <span className="text-foreground font-mono">
                {rivalProjection.basisSku}
              </span>
              {rivalProjection.competitorLabel
                ? ` ← ${rivalProjection.competitorLabel}`
                : ""}{" "}
              · {(rivalProjection.unitCentsPerGram / 100).toFixed(2)} $/g ×
              gram. Amber rakamlar liste fiyatını değiştirmez.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-amber-600/40 text-amber-900 dark:text-amber-100"
            onClick={() => {
              const nextRows = { ...rowsRef.current };
              const nextSuggested: Record<string, Suggestion> = {
                ...suggested,
              };
              let n = 0;
              for (const [sku, cents] of Object.entries(
                rivalProjection.projectedCentsBySku,
              )) {
                const row = nextRows[sku];
                if (!row) continue;
                const nextPrice = (cents / 100).toFixed(2);
                if (row.price === nextPrice) continue;
                nextRows[sku] = { ...row, price: nextPrice };
                nextSuggested[sku] = { ...nextSuggested[sku], price: true };
                n += 1;
              }
              if (n === 0) {
                toast.info("Yansıtılacak fark yok — taslak zaten aynı.");
                return;
              }
              setRows(nextRows);
              rowsRef.current = nextRows;
              setSuggested(nextSuggested);
              setAnchorSku(rivalProjection.basisSku);
              toast.success(
                `${n} varyant taslağa yazıldı (amber) — Önizle ve uygula ile onayla.`,
              );
            }}
          >
            Taslağa yaz
          </Button>
        </div>
      )}

      {/* Birincil yol: min-gram fiyatı → birim $/g × tüm gramlar */}
      <div className="nm-pressed space-y-3 rounded-[1.25rem] p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase">
              Toplu fiyat · min gram → birim $/g
            </p>
            <p className="text-muted-foreground text-xs">
              {variants.length} varyant
              {minGramInfo
                ? ` · en hafif ${minGramInfo.grams.toFixed(2)}g (${minGramInfo.sku})`
                : " · gram eksik"}
              . Girdiğin tutar en düşük gramlı varyantın satış fiyatıdır; diğerleri
              birim gram fiyatıyla çarpılır. Önizle → onay olmadan yazılmaz.
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={`/tasarimlar/varyant-hesapla?listing=${productId}`}>
              <Calculator className="size-4" />
              Hesaplayıcı
            </Link>
          </Button>
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            applyBulkMinGramDraft();
          }}
        >
          <div className="relative">
            <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
              $
            </span>
            <Input
              inputMode="decimal"
              value={bulkMinPrice}
              onChange={(e) => setBulkMinPrice(e.target.value)}
              placeholder="700.00"
              className="h-10 w-36 pl-7 text-right tabular-nums"
              aria-label="Min gram varyant satış fiyatı"
            />
          </div>
          <Button type="submit" disabled={!minGramInfo}>
            <Eye className="size-4" />
            Önizle ve dağıt
          </Button>
          {bulkUnitPreview && (
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              → {(bulkUnitPreview.unit / 100).toFixed(2)} $/g × gram
            </span>
          )}
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Tek tek / çapa satır: birim fiyatla dağıt → önizle → onayla.
          {anchorUnit != null
            ? ` · çapa ${(anchorUnit / 100).toFixed(2)} $/g`
            : ""}
          {pendingPriceChanges > 0
            ? ` · ${pendingPriceChanges} taslak değişiklik`
            : ""}
          {karat ? ` · maliyet ${karat}` : ""}.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={`/tasarimlar/varyant-hesapla?listing=${productId}`}>
              <Calculator className="size-4" />
              Hesaplayıcıda aç
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={restoring}
            onClick={restoreFromEtsy}
            title="Etsy envanterindeki fiyatlara dön"
          >
            {restoring ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            Etsy’den geri al
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={restoring}
            onClick={restoreFromAudit}
            title="Panel audit’indeki önceki fiyatlara dön"
          >
            <Undo2 className="size-4" />
            Audit’ten geri al
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => bulkFromAnchor()}
            disabled={!anchorSku}
          >
            <Layers className="size-4" />
            Birim fiyattan dağıt
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={bulkSaving || pendingPriceChanges === 0}
            onClick={openPricePreview}
          >
            <Eye className="size-4" />
            Önizle ve uygula
            {pendingPriceChanges > 0 ? ` (${pendingPriceChanges})` : ""}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={autoFill}>
            <Sparkles className="size-4" />
            Eksikleri otomatik hesapla
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Çapa</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Varyant</TableHead>
              <TableHead className="text-right">Satış ($)</TableHead>
              <TableHead className="text-right">Maliyet ($)</TableHead>
              <TableHead className="text-right">Gram</TableHead>
              <TableHead className="text-right">Adet</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead className="w-1 text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v) => {
              const r = rows[v.sku];
              const sg = suggested[v.sku] ?? {};
              const isSaving = saving.has(v.sku);
              const grams = toGram(r?.weight ?? "");
              const costCents = costForGrams(grams);
              const priceCents = toCents(r?.price ?? "");
              const isAnchor = anchorSku === v.sku;
              return (
                <TableRow
                  key={v.sku}
                  className={cn(
                    v.active === false && "opacity-60",
                    isAnchor && "bg-[color-mix(in_oklab,var(--brand)_6%,transparent)]",
                  )}
                >
                  <TableCell>
                    <input
                      type="radio"
                      name="price-anchor"
                      checked={isAnchor}
                      onChange={() => setAnchorSku(v.sku)}
                      aria-label={`${v.sku} toplu fiyat çapası`}
                      className="accent-[var(--brand)]"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {v.sku}
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <span className="block truncate" title={v.label}>
                      {v.label}
                    </span>
                    {v.active === false && (
                      <Badge variant="outline" className="mt-1">
                        pasif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="ml-auto flex w-28 flex-col items-end gap-0.5">
                      <Input
                        inputMode="decimal"
                        value={r?.price ?? ""}
                        onChange={(e) => setRow(v.sku, "price", e.target.value)}
                        placeholder="—"
                        title={
                          sg.price ? "Öneri — kaydetmeden yazılmaz" : undefined
                        }
                        className={cn(
                          "h-9 w-24 text-right tabular-nums",
                          sg.price && SUGGESTED_CLASS,
                        )}
                      />
                      {rivalProjection?.projectedCentsBySku[v.sku] != null && (
                        <span
                          className={RIVAL_PROJECT_CLASS}
                          title={`Rakip $/g × ${grams ?? v.weight_grams ?? "?"}g — liste fiyatından ayrı`}
                        >
                          Rakip{" "}
                          {formatMoney(
                            rivalProjection.projectedCentsBySku[v.sku]!,
                            currency,
                          )}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-muted-foreground ml-auto space-y-0.5 text-xs tabular-nums">
                      <div>
                        {costCents != null
                          ? formatMoney(costCents, currency)
                          : "—"}
                      </div>
                      {costCents != null &&
                        priceCents != null &&
                        priceCents > 0 && (
                          <div
                            className={cn(
                              "font-mono text-[10px]",
                              priceCents >= costCents
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-rose-700 dark:text-rose-400",
                            )}
                          >
                            {priceCents >= costCents ? "+" : ""}
                            {formatMoney(priceCents - costCents, currency)}
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      inputMode="decimal"
                      value={r?.weight ?? ""}
                      onChange={(e) => setRow(v.sku, "weight", e.target.value)}
                      placeholder="—"
                      title={
                        sg.weight ? "Öneri — kaydetmeden yazılmaz" : undefined
                      }
                      className={cn(
                        "ml-auto h-9 w-20 text-right tabular-nums",
                        sg.weight && SUGGESTED_CLASS,
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      inputMode="numeric"
                      value={r?.quantity ?? ""}
                      onChange={(e) => setRow(v.sku, "quantity", e.target.value)}
                      placeholder="—"
                      className="ml-auto h-9 w-16 text-right tabular-nums"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
                    {sg.weight || sg.price
                      ? "öneri"
                      : v.weight_source
                        ? (WEIGHT_SOURCE_LABELS[v.weight_source] ??
                          v.weight_source)
                        : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        title="Bu satırı çapa alıp tüm fiyatları grama dağıt"
                        onClick={() => bulkFromAnchor(v.sku)}
                      >
                        <Layers className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        onClick={() => save(v.sku)}
                      >
                        {isSaving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Save className="size-4" />
                        )}
                        Kaydet
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground text-xs">
        Akış: taslak düzenle → Önizle ve uygula → Onayla. Uygulamadan sonra
        &ldquo;Geri al&rdquo;. Satır Kaydet fiyat için de önizlemeyi açar;
        yalnız gram/adet doğrudan yazılır. Para {currency}.
      </p>

      <PriceChangePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        rows={buildPreviewRows()}
        currency={currency}
        unitLabel={
          anchorUnit != null
            ? `${(anchorUnit / 100).toFixed(2)} $/g`
            : null
        }
        confirming={bulkSaving}
        onConfirm={confirmPriceApply}
      />
    </div>
  );
}
