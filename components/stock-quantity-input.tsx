"use client";

import { useState, useTransition, type CSSProperties } from "react";
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
  canEdit = true,
}: {
  productId: string;
  initial: number | null;
  current: number | null;
  /** Manager değilse salt görüntüleme — yazamayacak kişiye açık input gösterme. */
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial != null ? String(initial) : "");
  const [focused, setFocused] = useState(false);
  const [pending, startTransition] = useTransition();

  // Odakta sarı halka yerine: çukur (nm-pressed) korunur + ALT-SOL köşeden
  // içeri vuran çift-katman sıcak altın aydınlanma (bir köşede ışık yanmış da
  // çukurun içine vurmuş gibi). Inline stil, base ring box-shadow'unu ezer.
  const focusStyle: CSSProperties | undefined = focused
    ? {
        boxShadow:
          "var(--shadow-pressed), inset 6px -6px 14px -4px var(--pit-glow), inset 11px -11px 28px -10px var(--pit-glow)",
        outline: "none",
      }
    : undefined;

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
        disabled={pending || !canEdit}
        style={focusStyle}
        onFocus={() => setFocused(true)}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => {
          setFocused(false);
          save();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={cn(
          "h-8 w-20 px-2 text-right text-sm tabular-nums focus-visible:ring-0",
          changed && "border-[color:var(--gold-deep,#9A7A34)] font-semibold",
        )}
      />
    </div>
  );
}
