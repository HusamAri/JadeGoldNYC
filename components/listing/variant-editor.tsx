"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calculator, Loader2, Save, Sparkles } from "lucide-react";

import { updateVariant } from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
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
};

/**
 * Varyant editörü — satır başına SKU/etiket + inline fiyat($)/gram/adet
 * Input'ları; satır bazlı kaydet (updateVariant). "Eksikleri otomatik hesapla"
 * distribute.ts motoruyla (ağırlık ← beden, fiyat ← ağırlık) SADECE boş
 * hücrelere öneri yazar; öneriler mor vurguludur ve satır kaydedilmeden
 * veritabanına YAZILMAZ.
 */
export function VariantEditor({
  productId,
  variants,
  currency,
}: {
  productId: string;
  variants: ListingVariantRow[];
  currency: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    initialRows(variants),
  );
  const [suggested, setSuggested] = useState<Record<string, Suggestion>>({});
  const [weightDirty, setWeightDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());

  if (variants.length === 0) {
    return (
      <p className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm">
        Bu listing&apos;de varyant yok. Varyantlar Etsy senkronundan gelir ya da
        yeni listing açılışında girilir.
      </p>
    );
  }

  function setRow(sku: string, key: keyof RowState, value: string) {
    setRows((rs) => ({ ...rs, [sku]: { ...rs[sku], [key]: value } }));
    if (key === "weight") {
      setWeightDirty((s) => new Set(s).add(sku));
    }
    // Elle düzenlenen hücre artık öneri değil.
    const field = key === "weight" ? "weight" : key === "price" ? "price" : null;
    if (field) {
      setSuggested((sg) => ({ ...sg, [sku]: { ...sg[sku], [field]: false } }));
    }
  }

  /** Boş gram/fiyat hücrelerine distribute.ts önerilerini yazar (mor, kayıtsız). */
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
      if (!r || r.weight.trim()) continue; // yalnız BOŞ hücre
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          Fiyat, gram ve adet satır içinde düzenlenir; her satır kendi
          Kaydet&rsquo;iyle yazılır.
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link href={`/tasarimlar/varyant-hesapla?listing=${productId}`}>
              <Calculator className="size-4" />
              Hesaplayıcıda aç
            </Link>
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

      <p className="text-muted-foreground text-xs">
        Otomatik hesap: eksik gramlar bedenden (SKU&rsquo;daki ölçüden), eksik
        fiyatlar ağırlıktan dağıtılır — yalnız boş hücreler doldurulur, para
        birimi {currency}.
      </p>
    </div>
  );
}
