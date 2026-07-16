"use client";

import { useTransition } from "react";
import { ScrollText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { fillWeightsFromDescriptions } from "@/app/(dashboard)/tasarimlar/eksik-agirlik/fill-actions";
import { Button } from "@/components/ui/button";

/**
 * Etsy açıklamalarındaki "Average Weight" tablolarından eksik gramajları
 * tek tıkla doldurur (yalnız boş varyantlar; tartı/elle değer ezilmez).
 */
export function FillFromDescriptionButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const res = await fillWeightsFromDescriptions();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.filled} varyant dolduruldu (${res.exact} birebir, ${res.scaled} ölçekli)` +
          (res.unmatched ? ` · ${res.unmatched} eşleşmedi` : "") +
          (res.gated ? ` · ${res.gated} listing tartıyla çeliştiği için atlandı` : ""),
      );
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={onClick}
    >
      <ScrollText className="size-4" />
      {pending ? "Açıklamalar taranıyor…" : "Açıklamalardan doldur"}
    </Button>
  );
}
