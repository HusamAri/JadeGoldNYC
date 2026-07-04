"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saveTargetQuantity } from "@/app/(dashboard)/stok/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Satır içi hedef stok girişi. Odak çıkışında (blur) otomatik kaydeder;
 * mevcut Etsy adedinden farklıysa görsel olarak vurgulanır (senkronda
 * değişecek satır).
 */
export function StockQuantityInput({
  productId,
  initial,
  current,
}: {
  productId: string;
  initial: number | null;
  current: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial != null ? String(initial) : "");
  const [pending, startTransition] = useTransition();

  const parsed = value.trim() === "" ? null : parseInt(value.trim(), 10);
  const changed = parsed != null && parsed !== current;

  function save() {
    const trimmed = value.trim();
    const qty = trimmed === "" ? null : parseInt(trimmed, 10);
    if (qty === initial) return;
    if (qty != null && (!Number.isInteger(qty) || qty < 0)) {
      toast.error("Adet 0 veya daha büyük tam sayı olmalı.");
      return;
    }
    startTransition(async () => {
      const res = await saveTargetQuantity(productId, qty);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Label htmlFor={`stok-${productId}`} className="sr-only">
        Hedef stok
      </Label>
      <Input
        id={`stok-${productId}`}
        inputMode="numeric"
        placeholder="—"
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={cn(
          "h-8 w-20 px-2 text-right text-sm tabular-nums",
          changed && "border-[color:var(--gold-deep,#9A7A34)] font-semibold",
        )}
      />
    </div>
  );
}
