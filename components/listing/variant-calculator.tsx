"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers, Loader2, Plus, Save, Trash2, Sparkles } from "lucide-react";

import {
  inferWeightsBySize,
  distributePriceByWeight,
  propagatePricesFromAnchor,
  parseSkuParts,
  type DistVariant,
} from "@/lib/etsy/distribute";
import {
  fetchListingVariantRows,
  applyCalculatedVariants,
  type ApplyVariantItem,
} from "@/app/(dashboard)/tasarimlar/varyant-hesapla/actions";
import type { VariantListingOption } from "@/lib/db/queries/variant-weights";
import {
  purchaseCostCentsForGrams,
  type KaratType,
} from "@/lib/gold-cost";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Row {
  sku: string;
  weight: string; // gram (biliniyorsa)
  price: string; // USD (biliniyorsa)
}

interface Computed {
  sku: string;
  size: number | null;
  weightGrams: number | null;
  weightSource: "given" | "inferred" | "—";
  priceCents: number | null;
  priceSource: "given" | "computed" | "—";
  confidence: string;
}

const EMPTY: Row = { sku: "", weight: "", price: "" };
/** Radix Select boş string value kabul etmez — serbest mod için sabit anahtar. */
const FREE_MODE = "__free__";

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

/**
 * Otomatik varyant hesaplayıcı — iki mod:
 * 1) LISTING MODU: yukarıdan bir listing seç → varyant SKU'ları + bilinen
 *    gram/fiyatlar otomatik yüklenir; motor eksikleri doldurur; "Listing'e
 *    kaydet" hesaplananları o listing'in varyantlarına yazar.
 * 2) SERBEST MOD: henüz açılmamış bir liste için SKU'ları elle girersin;
 *    hesap yalnız ekranda kalır (hiçbir yere yazılmaz).
 * Motor: eksik AĞIRLIK bedenden (inferWeightsBySize), eksik FİYAT ağırlıktan
 * (distributePriceByWeight).
 */
export function VariantCalculator({
  listings = [],
  initialListingId,
  purchasePrice14kCents,
  purchasePrice10kCents,
}: {
  listings?: VariantListingOption[];
  initialListingId?: string;
  purchasePrice14kCents?: number;
  purchasePrice10kCents?: number;
}) {
  const router = useRouter();
  const [listingId, setListingId] = useState<string>(
    initialListingId ?? FREE_MODE,
  );
  const [loading, startLoading] = useTransition();
  const [saving, startSaving] = useTransition();
  const [karat, setKarat] = useState("14");
  const [spot, setSpot] = useState(""); // altın gram fiyatı USD/g (ops.)
  const [markup, setMarkup] = useState("2.5");
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [rows, setRows] = useState<Row[]>([
    { ...EMPTY },
    { ...EMPTY },
    { ...EMPTY },
  ]);

  const karatType: KaratType | null =
    karat === "10" ? "10K" : karat === "14" ? "14K" : null;

  function loadRows(id: string) {
    startLoading(async () => {
      const res = await fetchListingVariantRows(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const loaded: Row[] = (res.rows ?? []).map((r) => ({
        sku: r.sku,
        weight: r.weight_grams != null ? String(r.weight_grams) : "",
        price: r.price_cents != null ? (r.price_cents / 100).toFixed(2) : "",
      }));
      if (loaded.length === 0) {
        toast.info("Bu listing'de kayıtlı varyant yok.");
        setRows([{ ...EMPTY }]);
        return;
      }
      setRows(loaded);
    });
  }

  function loadListing(id: string) {
    setListingId(id);
    if (id === FREE_MODE) {
      setRows([{ ...EMPTY }, { ...EMPTY }, { ...EMPTY }]);
      return;
    }
    loadRows(id);
  }

  // Derin bağlantı (?listing=...) ile gelindiyse satırları bir kez yükle;
  // listingId zaten prop'tan başlatıldı, effect yalnız async fetch'i tetikler.
  const preloaded = useRef(false);
  useEffect(() => {
    if (preloaded.current) return;
    preloaded.current = true;
    if (initialListingId) loadRows(initialListingId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computed = useMemo<Computed[] | null>(() => {
    const base: DistVariant[] = rows
      .filter((r) => r.sku.trim())
      .map((r) => ({
        sku: r.sku.trim(),
        weightGrams: toGram(r.weight),
        priceCents: toCents(r.price),
      }));
    if (base.length === 0) return null;

    // 1) Eksik ağırlıkları bedenden çıkar.
    const wPred = new Map(
      inferWeightsBySize(base).map((p) => [p.sku, p]),
    );
    const withWeights: DistVariant[] = base.map((v) => ({
      ...v,
      weightGrams: v.weightGrams ?? wPred.get(v.sku)?.weightGrams ?? null,
    }));

    // 2) Eksik fiyatları ağırlıktan dağıt.
    const opts = {
      karat: Number(karat) || undefined,
      goldSpotPerGramUsd: toGram(spot) ?? undefined,
      markup: toGram(markup) ?? undefined,
    };
    const pPred = new Map(
      distributePriceByWeight(withWeights, opts).map((p) => [p.sku, p]),
    );

    return base.map((v) => {
      const wp = wPred.get(v.sku);
      const finalWeight = v.weightGrams ?? wp?.weightGrams ?? null;
      const pp = pPred.get(v.sku);
      const finalPrice = v.priceCents ?? pp?.priceCents ?? null;
      return {
        sku: v.sku,
        size: parseSkuParts(v.sku).size,
        weightGrams: finalWeight,
        weightSource: v.weightGrams != null ? "given" : wp ? "inferred" : "—",
        priceCents: finalPrice,
        priceSource: v.priceCents != null ? "given" : pp ? "computed" : "—",
        confidence: wp?.confidence ?? pp?.confidence ?? "—",
      };
    });
  }, [rows, karat, spot, markup]);

  function setRow(i: number, key: keyof Row, value: string) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
    if (key === "price") setAnchorIndex(i);
  }

  /**
   * Çapa satırın fiyatından tüm satır fiyatlarını grama göre yeniden yazar
   * (mevcut fiyat↔gram çarpanı korunur; boşları da doldurur).
   */
  function bulkFromAnchor() {
    const anchor = rows[anchorIndex];
    if (!anchor?.sku.trim()) {
      toast.error("Çapa satırda SKU olmalı.");
      return;
    }
    const anchorPrice = toCents(anchor.price);
    if (anchorPrice == null) {
      toast.error("Çapa satırda satış fiyatı olmalı.");
      return;
    }

    const base: DistVariant[] = rows
      .filter((r) => r.sku.trim())
      .map((r) => ({
        sku: r.sku.trim(),
        weightGrams: toGram(r.weight),
        priceCents: toCents(r.price),
      }));
    const wPred = new Map(inferWeightsBySize(base).map((p) => [p.sku, p]));
    const withWeights: DistVariant[] = base.map((v) => ({
      ...v,
      weightGrams: v.weightGrams ?? wPred.get(v.sku)?.weightGrams ?? null,
    }));
    const anchorSku = anchor.sku.trim();
    if (
      withWeights.find((v) => v.sku === anchorSku)?.weightGrams == null
    ) {
      toast.error("Çapa satırda gram olmalı (veya bedenden çıkarılamıyor).");
      return;
    }

    const preds = propagatePricesFromAnchor(
      withWeights,
      anchorSku,
      anchorPrice,
    );
    if (preds.length === 0) {
      toast.info("Dağıtılacak ağırlıklı satır yok.");
      return;
    }
    const priceMap = new Map(preds.map((p) => [p.sku, p.priceCents]));
    const weightMap = new Map(
      withWeights
        .filter((v) => v.weightGrams != null)
        .map((v) => [v.sku, v.weightGrams as number]),
    );

    setRows((rs) =>
      rs.map((r) => {
        const sku = r.sku.trim();
        if (!sku) return r;
        const next: Row = { ...r };
        const w = weightMap.get(sku);
        if (w != null && !r.weight.trim()) next.weight = w.toFixed(2);
        const p = priceMap.get(sku);
        if (p != null) next.price = (p / 100).toFixed(2);
        return next;
      }),
    );
    toast.success(
      `${anchorSku} çapasından ${preds.length} fiyat grama göre yazıldı.`,
    );
  }

  const boundListing =
    listingId !== FREE_MODE ? listings.find((l) => l.id === listingId) : null;

  function saveToListing() {
    if (!boundListing || !computed) return;
    const items: ApplyVariantItem[] = computed
      .filter((c) => c.weightGrams != null || c.priceCents != null)
      .map((c) => ({
        sku: c.sku,
        weightGrams: c.weightGrams,
        weightSource: c.weightSource === "—" ? null : c.weightSource,
        priceCents: c.priceCents,
      }));
    if (items.length === 0) {
      toast.info("Kaydedilecek hesaplanmış değer yok.");
      return;
    }
    startSaving(async () => {
      const res = await applyCalculatedVariants(boundListing.id, items);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.updated ?? 0} varyant "${boundListing.title}" listing'ine kaydedildi.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="listing-select">
              1 · Hangi listing için hesaplıyorsun?
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={listingId} onValueChange={loadListing}>
                <SelectTrigger
                  id="listing-select"
                  className="max-w-full sm:max-w-[32rem]"
                >
                  <SelectValue placeholder="Listing seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FREE_MODE}>
                    Serbest hesap — listing&rsquo;e bağlı değil
                  </SelectItem>
                  {listings.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title} ({l.variantCount} varyant)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading && (
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
              )}
              {boundListing && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/tasarimlar/listing/${boundListing.id}`}>
                    Listing detayına git
                  </Link>
                </Button>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {boundListing
                ? "Varyantlar ve bilinen gram/fiyatlar listing'den yüklendi; eksikler aşağıda otomatik hesaplanır ve istersen listing'e geri kaydedilir."
                : "Serbest modda SKU'ları elle girersin; hesap yalnız ekranda kalır, hiçbir listing'e yazılmaz."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="karat">Ayar</Label>
              <Input
                id="karat"
                inputMode="numeric"
                value={karat}
                onChange={(e) => setKarat(e.target.value)}
                placeholder="14"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spot">Altın gram fiyatı (USD/g) — ops.</Label>
              <Input
                id="spot"
                inputMode="decimal"
                value={spot}
                onChange={(e) => setSpot(e.target.value)}
                placeholder="Tek fiyat noktası yoksa gerekli"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="markup">Markup (işçilik/kâr çarpanı)</Label>
              <Input
                id="markup"
                inputMode="decimal"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                placeholder="2.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground grid grid-cols-[2.5rem_1fr_7rem_7rem_2.5rem] gap-2 font-mono text-[11px] tracking-wide uppercase">
              <span>Çapa</span>
              <span>SKU (beden gömülü)</span>
              <span>Ağırlık (g)</span>
              <span>Satış ($)</span>
              <span />
            </div>
            {rows.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[2.5rem_1fr_7rem_7rem_2.5rem] items-center gap-2"
              >
                <input
                  type="radio"
                  name="calc-anchor"
                  checked={anchorIndex === i}
                  onChange={() => setAnchorIndex(i)}
                  aria-label={`Satır ${i + 1} toplu fiyat çapası`}
                  className="accent-[var(--brand)] justify-self-center"
                />
                <Input
                  value={r.sku}
                  onChange={(e) => setRow(i, "sku", e.target.value)}
                  placeholder="ör. C14-22"
                  aria-label={`Satır ${i + 1} SKU`}
                  className="font-mono"
                />
                <Input
                  inputMode="decimal"
                  value={r.weight}
                  onChange={(e) => setRow(i, "weight", e.target.value)}
                  placeholder="—"
                  aria-label={`Satır ${i + 1} ağırlık (gram)`}
                />
                <Input
                  inputMode="decimal"
                  value={r.price}
                  onChange={(e) => setRow(i, "price", e.target.value)}
                  placeholder="—"
                  aria-label={`Satır ${i + 1} satış fiyatı (USD)`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setRows((rs) =>
                      rs.length > 1 ? rs.filter((_, j) => j !== i) : rs,
                    )
                  }
                  aria-label="Satırı sil"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRows((rs) => [...rs, { ...EMPTY }])}
              >
                <Plus className="size-4" />
                Varyant ekle
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={bulkFromAnchor}
              >
                <Layers className="size-4" />
                Toplu fiyat (çapa → gram)
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            2 · En az bir varyanta ağırlık gir → kalan ağırlıklar bedenden
            çıkarılır. Eksik fiyatlar ağırlıktan dolar. Toplu fiyat: çapa
            satırın satışından mevcut fiyat/gram çarpanıyla tümünü yeniden
            yazar. Hesap anlıktır.
          </p>
        </CardContent>
      </Card>

      {computed && computed.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="idx">
                <Sparkles aria-hidden className="size-4" />
                <span>Hesaplanan varyantlar</span>
                <span className="idx-bar" />
                <span className="idx-ln" />
              </div>
              {boundListing && (
                <Button
                  type="button"
                  size="sm"
                  disabled={saving || loading}
                  onClick={saveToListing}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  3 · Listing&rsquo;e kaydet
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Beden</TableHead>
                    <TableHead className="text-right">Ağırlık (g)</TableHead>
                    <TableHead className="text-right">Satış</TableHead>
                    <TableHead className="text-right">Maliyet</TableHead>
                    <TableHead>Kaynak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.map((c) => {
                    const costCents =
                      karatType && c.weightGrams != null
                        ? purchaseCostCentsForGrams(c.weightGrams, karatType, {
                            "14K": purchasePrice14kCents,
                            "10K": purchasePrice10kCents,
                          })
                        : null;
                    return (
                    <TableRow key={c.sku}>
                      <TableCell className="font-mono">{c.sku}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.size ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {c.weightGrams != null ? c.weightGrams.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {c.priceCents != null
                          ? formatMoney(c.priceCents, "USD")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right font-mono text-xs tabular-nums">
                        {costCents != null
                          ? formatMoney(costCents, "USD")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {c.weightSource === "inferred" && "ağırlık: çıkarıldı"}
                        {c.weightSource === "inferred" &&
                          c.priceSource === "computed" &&
                          " · "}
                        {c.priceSource === "computed" && "fiyat: dağıtıldı"}
                        {c.weightSource === "given" &&
                          c.priceSource === "given" &&
                          "girildi"}
                        {c.confidence !== "—" && ` (${c.confidence})`}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {boundListing && (
              <p className="text-muted-foreground text-xs">
                Kaydet, yalnız değeri hesaplanabilen satırları yazar; motorun
                çözemediği satırlara dokunulmaz. Elle girdiğin gramlar
                &ldquo;elle&rdquo;, bedenden çıkarılanlar &ldquo;çıkarım&rdquo;
                kaynağıyla işaretlenir.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
