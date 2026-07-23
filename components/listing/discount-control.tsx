"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Tag } from "lucide-react";

import { formatMoney } from "@/lib/money";
import { clampDiscountPct, discountedCents } from "@/lib/discount";
import { setListingDiscount } from "@/app/(dashboard)/tasarimlar/listing/[id]/reprice-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
}: {
  productId: string;
  initialPct: number;
  basePriceCents: number | null;
  currency: string;
}) {
  const [value, setValue] = useState(String(clampDiscountPct(initialPct)));
  const [savedPct, setSavedPct] = useState(clampDiscountPct(initialPct));
  const [pending, start] = useTransition();

  const pct = clampDiscountPct(Number(value.replace(",", ".")));
  const preview = discountedCents(basePriceCents, pct);
  const dirty = pct !== savedPct;

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

      <p className="text-muted-foreground text-xs">
        Etsy Open API aktif Sale/kupon vermez — Etsy&apos;de yürüttüğün indirimi
        buraya gir. İndirimli fiyat panelde (varyant matrisi + kâr kararları)
        gösterilir; Etsy fiyatına dokunulmaz. Taban fiyat üzerinden %.
      </p>
    </div>
  );
}
