"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Tag, TriangleAlert } from "lucide-react";

import { formatMoney } from "@/lib/money";
import { clampDiscountPct, discountedCents } from "@/lib/discount";
import { setListingDiscount } from "@/app/(dashboard)/tasarimlar/listing/[id]/reprice-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Simülatör girdisi — varyantın satış fiyatı + gramı (maliyet tabanı için). */
export interface SimVariant {
  sku: string;
  price_cents: number;
  weight_grams: number | null;
}

/**
 * Listing indirim kontrolü — manuel indirim yüzdesi (0..90) girer/kaydeder.
 * Etsy Open API v3 aktif Sale/promosyon ya da kupon kodunu OKUTMUYOR (0115),
 * bu yüzden satıcı Etsy'de yürüttüğü indirimi buraya girer. İndirimli fiyat
 * panelde türetilir (burada + varyant matrisinde) ve kâr/eritme kararlarında
 * kullanılır; Etsy'ye YAZILMAZ (taban fiyat değişmez). Anlık önizleme: girilen
 * yüzde için indirimli taban fiyat.
 */
export function DiscountControl({
  productId,
  initialPct,
  basePriceCents,
  currency,
  costPerGramCents = null,
  variants = [],
}: {
  productId: string;
  initialPct: number;
  basePriceCents: number | null;
  currency: string;
  /** Ayar alım fiyatı (cent/gram) — maliyet tabanı. null → simülatör gizli. */
  costPerGramCents?: number | null;
  /** Varyantlar (fiyat + gram) — indirimli fiyatı maliyetle kıyaslamak için. */
  variants?: SimVariant[];
}) {
  const [value, setValue] = useState(String(clampDiscountPct(initialPct)));
  const [savedPct, setSavedPct] = useState(clampDiscountPct(initialPct));
  const [pending, start] = useTransition();

  const pct = clampDiscountPct(Number(value.replace(",", ".")));
  const preview = discountedCents(basePriceCents, pct);
  const dirty = pct !== savedPct;

  // Simülatör: girilen yüzdede indirimli fiyatı METAL MALİYETİNİN (gram × ayar
  // alım fiyatı) altına düşen varyantları anında listeler. Yalnız gramı olan
  // varyantlar değerlendirilir (gramsızın maliyeti bilinemez → sessiz atlanır).
  const belowCost =
    costPerGramCents == null || costPerGramCents <= 0
      ? null
      : variants
          .filter((v) => v.weight_grams != null && v.weight_grams > 0)
          .map((v) => {
            const costCents = Math.round(
              costPerGramCents * (v.weight_grams as number),
            );
            const discounted =
              discountedCents(v.price_cents, pct) ?? v.price_cents;
            return {
              ...v,
              costCents,
              discounted,
              marginCents: discounted - costCents,
            };
          })
          .filter((v) => v.marginCents < 0)
          .sort((a, b) => a.marginCents - b.marginCents);
  const gramlessCount = variants.filter(
    (v) => v.weight_grams == null || !(v.weight_grams > 0),
  ).length;

  function save() {
    start(async () => {
      const res = await setListingDiscount(productId, pct);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setSavedPct(pct);
      setValue(String(pct));
      toast.success(
        pct > 0 ? `%${pct} indirim kaydedildi.` : "İndirim kaldırıldı.",
      );
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        <label className="space-y-1">
          <span className="text-muted-foreground block font-mono text-[10px] tracking-[0.14em] uppercase">
            İndirim %
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={90}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-24 tabular-nums"
              aria-label="İndirim yüzdesi (0-90)"
            />
            <Button size="sm" onClick={save} disabled={pending || !dirty}>
              <Tag className="size-4" />
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </div>
        </label>

        {basePriceCents != null && (
          <div className="space-y-0.5">
            <span className="text-muted-foreground block font-mono text-[10px] tracking-[0.14em] uppercase">
              İndirimli taban fiyat
            </span>
            {pct > 0 && preview != null ? (
              <p className="font-mono text-sm font-semibold tabular-nums">
                <span className="text-[color:var(--tl-doing)]">
                  {formatMoney(preview, currency)}
                </span>{" "}
                <span className="text-muted-foreground/80 text-xs line-through">
                  {formatMoney(basePriceCents, currency)}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground font-mono text-sm tabular-nums">
                {formatMoney(basePriceCents, currency)} · indirim yok
              </p>
            )}
          </div>
        )}
      </div>

      {/* İndirim simülatörü — girilen yüzdede maliyet altına düşen varyantlar. */}
      {belowCost != null && (
        <div className="border-border/60 space-y-2 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
              İndirim simülatörü{pct > 0 ? ` · %${pct}` : ""}
            </span>
            <span
              className={
                "font-mono text-[11px] tabular-nums " +
                (belowCost.length > 0
                  ? "font-semibold text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]"
                  : "text-muted-foreground")
              }
            >
              {belowCost.length > 0
                ? `${belowCost.length} varyant maliyet altında`
                : "hepsi maliyet üstünde ✓"}
            </span>
          </div>

          {belowCost.length > 0 && (
            <>
              <p className="flex items-start gap-1.5 text-xs text-[oklch(0.55_0.17_344)] dark:text-[oklch(0.76_0.12_344)]">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  Bu yüzdede aşağıdaki varyantların indirimli fiyatı metal
                  maliyetinin (gram × ayar alım fiyatı) altına düşüyor — her
                  satış garantili zarar.
                </span>
              </p>
              <ul className="max-h-44 space-y-1 overflow-y-auto">
                {belowCost.slice(0, 20).map((v) => (
                  <li
                    key={v.sku}
                    className="flex items-center justify-between gap-3 font-mono text-[11px] tabular-nums"
                  >
                    <span className="text-muted-foreground truncate">
                      {v.sku}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span>{formatMoney(v.discounted, currency)}</span>
                      <span className="text-muted-foreground/70">
                        / mal. {formatMoney(v.costCents, currency)}
                      </span>
                      <span className="font-semibold text-[oklch(0.55_0.17_344)] dark:text-[oklch(0.76_0.12_344)]">
                        {formatMoney(v.marginCents, currency)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {belowCost.length > 20 && (
                <p className="text-muted-foreground text-[11px]">
                  … ve {belowCost.length - 20} varyant daha.
                </p>
              )}
            </>
          )}
          <p className="text-muted-foreground/70 text-[10px]">
            Maliyet = metal (gram × ayar alım fiyatı); Etsy ücreti + işçilik
            hariç.
            {gramlessCount > 0
              ? ` ${gramlessCount} gramsız varyant değerlendirilemedi.`
              : ""}
          </p>
        </div>
      )}

      <p className="text-muted-foreground text-xs">
        Etsy Open API aktif Sale/kupon vermez — Etsy&apos;de yürüttüğün indirimi
        buraya gir. İndirimli fiyat panelde (varyant matrisi + kâr kararları)
        gösterilir; Etsy fiyatına dokunulmaz. Taban fiyat üzerinden %.
      </p>
    </div>
  );
}
