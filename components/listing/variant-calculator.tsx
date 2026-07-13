"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";

import {
  inferWeightsBySize,
  distributePriceByWeight,
  parseSkuParts,
  type DistVariant,
} from "@/lib/etsy/distribute";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
 * Otomatik varyant hesaplayıcı — SKU'ları (beden gövdeye gömülü) + bilinen
 * birkaç ağırlık/fiyat noktasını girersin; motor eksik AĞIRLIKLARI bedenden
 * (inferWeightsBySize) ve eksik FİYATLARI ağırlıktan (distributePriceByWeight)
 * dağıtır. "1 fiyatı gir → diğerlerine dağıt" bu sayfada. Saf istemci hesabı.
 */
export function VariantCalculator() {
  const [karat, setKarat] = useState("14");
  const [spot, setSpot] = useState(""); // altın gram fiyatı USD/g (ops.)
  const [markup, setMarkup] = useState("2.5");
  const [rows, setRows] = useState<Row[]>([
    { ...EMPTY },
    { ...EMPTY },
    { ...EMPTY },
  ]);

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
  }

  return (
    <div className="space-y-4">
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
            <div className="text-muted-foreground grid grid-cols-[1fr_7rem_7rem_2.5rem] gap-2 font-mono text-[11px] tracking-wide uppercase">
              <span>SKU (beden gömülü)</span>
              <span>Ağırlık (g)</span>
              <span>Fiyat ($)</span>
              <span />
            </div>
            {rows.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_7rem_7rem_2.5rem] items-center gap-2"
              >
                <Input
                  value={r.sku}
                  onChange={(e) => setRow(i, "sku", e.target.value)}
                  placeholder="ör. C14-22"
                  className="font-mono"
                />
                <Input
                  inputMode="decimal"
                  value={r.weight}
                  onChange={(e) => setRow(i, "weight", e.target.value)}
                  placeholder="—"
                />
                <Input
                  inputMode="decimal"
                  value={r.price}
                  onChange={(e) => setRow(i, "price", e.target.value)}
                  placeholder="—"
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((rs) => [...rs, { ...EMPTY }])}
            >
              <Plus className="size-4" />
              Varyant ekle
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            En az bir varyanta ağırlık gir → kalan ağırlıklar bedenden çıkarılır.
            En az bir fiyat gir (veya altın gram fiyatı) → kalan fiyatlar
            ağırlıktan dağıtılır. Hesap anlıktır.
          </p>
        </CardContent>
      </Card>

      {computed && computed.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <div className="idx">
              <Sparkles className="size-4" />
              <span>Hesaplanan varyantlar</span>
              <span className="idx-bar" />
              <span className="idx-ln" />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Beden</TableHead>
                    <TableHead className="text-right">Ağırlık (g)</TableHead>
                    <TableHead className="text-right">Fiyat</TableHead>
                    <TableHead>Kaynak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {computed.map((c) => (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
