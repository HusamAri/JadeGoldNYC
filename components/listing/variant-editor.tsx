"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calculator,
  ChevronDown,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";

import {
  updateVariant,
  updateVariantsBulkPrice,
} from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { ProductWeightInput } from "@/components/product-weight-input";
import {
  inferWeightsBySize,
  distributePriceByWeight,
  type DistVariant,
} from "@/lib/etsy/distribute";
import type { ListingVariantRow } from "@/lib/db/queries/listings";
import { centsToDecimal } from "@/lib/money";
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
 * Varyant editörü — varsayılan yol: TEK fiyat → tüm varyantlar.
 * Satır satır fiyat/gram hesabı nadir; o yüzden "Tek tek düzenle" altında
 * katlanır. Otomatik dolum (distribute) yine per-row paneline bağlı.
 */
export function VariantEditor({
  productId,
  variants,
  currency,
  productWeightGrams,
}: {
  productId: string;
  variants: ListingVariantRow[];
  currency: string;
  /** Varyantsız (tek-parça) listing'de künye gramajı — ürün seviyesinde tutulur. */
  productWeightGrams?: number | null;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    initialRows(variants),
  );
  const [suggested, setSuggested] = useState<Record<string, Suggestion>>({});
  const [weightDirty, setWeightDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState(() => {
    const priced = variants
      .map((v) => v.price_cents)
      .filter((c): c is number => c != null && c > 0);
    if (priced.length === 0) return "";
    // En sık görülen fiyat (çoğu listing zaten tek fiyatlı).
    const counts = new Map<number, number>();
    for (const c of priced) counts.set(c, (counts.get(c) ?? 0) + 1);
    let best = priced[0];
    let bestN = 0;
    for (const [c, n] of counts) {
      if (n > bestN) {
        best = c;
        bestN = n;
      }
    }
    return centsToDecimal(best).toFixed(2);
  });
  const [bulkSaving, setBulkSaving] = useState(false);

  const summary = useMemo(() => {
    const prices = variants
      .map((v) => v.price_cents)
      .filter((c): c is number => c != null && c > 0);
    const missingW = variants.filter((v) => v.weight_grams == null).length;
    const missingP = variants.filter((v) => v.price_cents == null).length;
    const uniq = new Set(prices);
    return {
      missingW,
      missingP,
      singlePrice: uniq.size <= 1,
      min: prices.length ? Math.min(...prices) : null,
      max: prices.length ? Math.max(...prices) : null,
    };
  }, [variants]);

  if (variants.length === 0) {
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
        </div>
      </div>
    );
  }

  function setRow(sku: string, key: keyof RowState, value: string) {
    setRows((rs) => ({ ...rs, [sku]: { ...rs[sku], [key]: value } }));
    if (key === "weight") {
      setWeightDirty((s) => new Set(s).add(sku));
    }
    const field = key === "weight" ? "weight" : key === "price" ? "price" : null;
    if (field) {
      setSuggested((sg) => ({ ...sg, [sku]: { ...sg[sku], [field]: false } }));
    }
  }

  function autoFill() {
    const base: DistVariant[] = variants.map((v) => {
      const r = rows[v.sku];
      return {
        sku: v.sku,
        weightGrams: toGram(r?.weight ?? ""),
        priceCents: toCents(r?.price ?? ""),
      };
    });

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

  function applyBulk() {
    if (!bulkPrice.trim()) {
      toast.error("Toplu fiyat girin.");
      return;
    }
    setBulkSaving(true);
    updateVariantsBulkPrice(productId, bulkPrice)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        const n = res.updated ?? variants.length;
        toast.success(`${n} varyanta $${bulkPrice.trim()} yazıldı.`);
        // Yerel satırları da hizala ki tek-tek panel açılınca tutarlı görünsün.
        const next = { ...rows };
        for (const v of variants) {
          next[v.sku] = { ...next[v.sku], price: bulkPrice.trim() };
        }
        setRows(next);
        router.refresh();
      })
      .finally(() => setBulkSaving(false));
  }

  return (
    <div className="space-y-4">
      {/* Birincil yol: tek fiyat → hepsi */}
      <div className="nm-pressed space-y-3 rounded-[1.25rem] p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase">
              Toplu fiyat · tüm varyantlar
            </p>
            <p className="text-muted-foreground text-xs">
              {variants.length} varyant
              {summary.missingW > 0 ? ` · ${summary.missingW} gram eksik` : ""}
              {summary.missingP > 0 ? ` · ${summary.missingP} fiyatsız` : ""}
              {summary.singlePrice && summary.min != null
                ? ` · şu an hepsi $${centsToDecimal(summary.min).toFixed(2)}`
                : summary.min != null && summary.max != null
                  ? ` · aralık $${centsToDecimal(summary.min).toFixed(2)}–$${centsToDecimal(summary.max).toFixed(2)}`
                  : ""}
              . Gram hesabına dokunulmaz.
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
            applyBulk();
          }}
        >
          <div className="relative">
            <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
              $
            </span>
            <Input
              inputMode="decimal"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              placeholder="129.00"
              className="h-10 w-36 pl-7 text-right tabular-nums"
              aria-label="Toplu varyant fiyatı"
            />
          </div>
          <Button type="submit" disabled={bulkSaving}>
            {bulkSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Tümüne uygula
          </Button>
        </form>
      </div>

      {/* Nadir yol: satır satır — kapalı başlar */}
      <details className="group/vr">
        <summary className="text-muted-foreground flex cursor-pointer list-none items-center gap-2 text-sm select-none [&::-webkit-details-marker]:hidden">
          <ChevronDown className="size-4 transition-transform group-open/vr:rotate-180" />
          <span>Tek tek düzenle</span>
          <span className="font-mono text-[10px] tracking-[0.12em] uppercase">
            nadiren · gram / ayrı fiyat
          </span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs">
              Fiyat, gram ve adet satır içinde; her satır kendi Kaydet&rsquo;iyle
              yazılır. Para birimi {currency}.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={autoFill}>
              <Sparkles className="size-4" />
              Eksikleri otomatik hesapla
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Varyant</TableHead>
                  <TableHead className="text-right">Fiyat ($)</TableHead>
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
                  return (
                    <TableRow
                      key={v.sku}
                      className={cn(v.active === false && "opacity-60")}
                    >
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
                          onChange={(e) =>
                            setRow(v.sku, "price", e.target.value)
                          }
                          placeholder="—"
                          title={
                            sg.price ? "Öneri — kaydetmeden yazılmaz" : undefined
                          }
                          className={cn(
                            "ml-auto h-9 w-24 text-right tabular-nums",
                            sg.price && SUGGESTED_CLASS,
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          inputMode="decimal"
                          value={r?.weight ?? ""}
                          onChange={(e) =>
                            setRow(v.sku, "weight", e.target.value)
                          }
                          placeholder="—"
                          title={
                            sg.weight
                              ? "Öneri — kaydetmeden yazılmaz"
                              : undefined
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
                          onChange={(e) =>
                            setRow(v.sku, "quantity", e.target.value)
                          }
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </details>
    </div>
  );
}
