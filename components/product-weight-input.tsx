"use client";

import { useState, useTransition } from "react";
import { Scale } from "lucide-react";
import { toast } from "sonner";

import { updateProductWeight } from "@/app/(dashboard)/tasarimlar/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Ürün kartında satır içi ağırlık girişi — altın maliyet motorunun kaynağı. */
export function ProductWeightInput({
  productId,
  initialGrams,
}: {
  productId: string;
  initialGrams: number | null;
}) {
  const [value, setValue] = useState(initialGrams != null ? String(initialGrams) : "");
  const [pending, startTransition] = useTransition();

  function save() {
    const trimmed = value.trim();
    const grams = trimmed ? parseFloat(trimmed.replace(",", ".")) : null;
    if (grams === initialGrams) return;
    startTransition(async () => {
      const res = await updateProductWeight(productId, grams);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Ağırlık kaydedildi");
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={`weight-${productId}`} className="sr-only">
        Ağırlık (gram)
      </Label>
      <Scale className="text-muted-foreground size-3.5 shrink-0" />
      <Input
        id={`weight-${productId}`}
        inputMode="decimal"
        placeholder="gram"
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        className="h-7 w-20 px-2.5 text-xs"
      />
      <span className="text-muted-foreground text-xs">g</span>
    </div>
  );
}
