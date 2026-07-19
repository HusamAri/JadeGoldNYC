"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calculator,
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
} from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { ProductWeightInput } from "@/components/product-weight-input";
import {
  inferWeightsBySize,
  distributePriceByWeight,
  propagatePricesFromAnchor,
  unitPriceCentsPerGram,
  type DistVariant,
} from "@/lib/etsy/distribute";
import type { ListingVariantRow } from "@/lib/db/queries/listings";
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
        `${targetSku} birim fiyatından ${priced} varyant güncellendi${unitLabel}` +
          (filledWeights > 0 ? ` · ${filledWeights} gram önerildi` : "") +
          " — kaydetmeden yazılmaz.",
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

  function saveAllPrices() {
    const items = variants.map((v) => ({
      sku: v.sku,
      price: rows[v.sku]?.price ?? "",
    }));
    setBulkSaving(true);
    saveVariantsBulkPrices(productId, items)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(`${res.updated ?? 0} varyant fiyatı kaydedildi.`);
        setSuggested({});
        router.refresh();
      })
      .finally(() => setBulkSaving(false));
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Bir satıra satış fiyatı gir → diğerleri birim fiyatla ($/g × gram)
          dolar
          {anchorUnit != null
            ? ` · çapa ${(anchorUnit / 100).toFixed(2)} $/g`
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
            Önceki fiyatlar
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
            disabled={bulkSaving}
            onClick={saveAllPrices}
          >
            {bulkSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Tüm fiyatları kaydet
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
                    <Input
                      inputMode="decimal"
                      value={r?.price ?? ""}
                      onChange={(e) => setRow(v.sku, "price", e.target.value)}
                      placeholder="—"
                      title={sg.price ? "Öneri — kaydetmeden yazılmaz" : undefined}
                      className={cn(
                        "ml-auto h-9 w-24 text-right tabular-nums",
                        sg.price && SUGGESTED_CLASS,
                      )}
                    />
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
        Birim fiyat: P_i = (P_çapa / g_çapa) × g_i. Fiyat yazınca diğerleri
        otomatik dolar; &ldquo;Tüm fiyatları kaydet&rdquo; veya satır Kaydet ile
        yazılır. Yanlışlıkla ezildiyse &ldquo;Etsy’den geri al&rdquo;. Para{" "}
        {currency}.
      </p>
    </div>
  );
}
