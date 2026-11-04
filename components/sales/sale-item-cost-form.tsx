"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save, Undo2 } from "lucide-react";

import {
  setSaleItemReturn,
  upsertSaleItemCosts,
} from "@/app/(dashboard)/satislar/maliyet/actions";
import { centsToDecimal } from "@/lib/money";
import type { SaleItemPnlRow } from "@/lib/pnl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const KINDS = [
  { key: "gold", label: "Altın" },
  { key: "labor", label: "İşçilik" },
  { key: "gem", label: "Taş / Gem" },
  { key: "packaging", label: "Paketleme" },
  { key: "other", label: "Diğer" },
] as const;
type Kind = (typeof KINDS)[number]["key"];

function initialFor(it: SaleItemPnlRow, k: Kind): string {
  const map: Record<Kind, [number, boolean]> = {
    gold: [it.gold_cents, it.has_gold],
    labor: [it.labor_cents, it.has_labor],
    gem: [it.gem_cents, it.has_gem],
    packaging: [it.packaging_cents, it.has_packaging],
    other: [0, false],
  };
  const [cents, present] = map[k];
  return present && cents !== 0 ? centsToDecimal(cents).toFixed(2) : "";
}

/**
 * Satış detayı — kalem maliyet formu (toplu: tüm türler tek kaydet) + iade/
 * geri kazanım. Otomatik motor değerleri ön-dolu gelir; kaydedince ELLE olur.
 */
export function SaleItemCostForm({
  item,
  notes,
  canEdit,
  currency,
}: {
  item: SaleItemPnlRow;
  notes: Map<string, string>;
  canEdit: boolean;
  currency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [vals, setVals] = useState<Record<Kind, string>>({
    gold: initialFor(item, "gold"),
    labor: initialFor(item, "labor"),
    gem: initialFor(item, "gem"),
    packaging: initialFor(item, "packaging"),
    other: initialFor(item, "other"),
  });
  const [note, setNote] = useState(
    notes.get(`${item.sale_item_id}:labor`) ??
      notes.get(`${item.sale_item_id}:gold`) ??
      "",
  );
  const [returned, setReturned] = useState(Boolean(item.returned_at));
  const [recovered, setRecovered] = useState(
    item.recovered_cents > 0 ? centsToDecimal(item.recovered_cents).toFixed(2) : "",
  );

  function save() {
    startTransition(async () => {
      const res = await upsertSaleItemCosts({
        sale_item_id: item.sale_item_id,
        ...vals,
        note,
      });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Kalem maliyeti kaydedildi");
      router.refresh();
    });
  }

  function saveReturn() {
    startTransition(async () => {
      const res = await setSaleItemReturn({
        sale_item_id: item.sale_item_id,
        returned,
        recovered,
      });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(returned ? "İade/geri kazanım kaydedildi" : "İade işareti kaldırıldı");
      router.refresh();
    });
  }

  if (!canEdit) {
    return (
      <p className="text-muted-foreground text-xs">
        Maliyet girişi yalnız sahip/yönetici rolüne açık.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {KINDS.map((k) => (
          <div key={k.key} className="space-y-1">
            <Label htmlFor={`${item.sale_item_id}-${k.key}`} className="text-[11px]">
              {k.label} ({currency})
            </Label>
            <Input
              id={`${item.sale_item_id}-${k.key}`}
              inputMode="decimal"
              placeholder="0,00"
              value={vals[k.key]}
              onChange={(e) => setVals((v) => ({ ...v, [k.key]: e.target.value }))}
              className="h-9 font-mono text-xs"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor={`${item.sale_item_id}-note`} className="text-[11px]">
            Not (tedarikçi, fatura no, taş cinsi…)
          </Label>
          <Input
            id={`${item.sale_item_id}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-9 text-xs"
            maxLength={500}
          />
        </div>
        <Button type="button" size="sm" onClick={save} disabled={pending} aria-busy={pending}>
          <Save />
          Maliyeti kaydet
        </Button>
      </div>

      <div className="border-border/60 flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-end">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={returned}
            onChange={(e) => setReturned(e.target.checked)}
            className="size-4"
          />
          <Undo2 className="size-3.5" /> Ürün geri geldi (iade)
        </label>
        <div className="space-y-1">
          <Label htmlFor={`${item.sale_item_id}-rec`} className="text-[11px]">
            Geri kazanılan değer ({currency}) — stoğa döndüyse orijinal maliyet, hurdaysa eritme değeri
          </Label>
          <Input
            id={`${item.sale_item_id}-rec`}
            inputMode="decimal"
            placeholder="0,00"
            value={recovered}
            disabled={!returned}
            onChange={(e) => setRecovered(e.target.value)}
            className="h-9 w-[160px] font-mono text-xs"
          />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={saveReturn} disabled={pending}>
          İadeyi kaydet
        </Button>
      </div>
    </div>
  );
}
