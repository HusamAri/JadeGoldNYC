"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { COST_BEARERS } from "@/lib/cost-bearer";
import type { CostBearer, CostCategory } from "@/lib/types";
import { setCategoryDefaultBearer } from "@/app/(dashboard)/maliyetler/actions";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Kategori → varsayılan taraf (otomatik atama) editörü. Bir kategoriye taraf
 * tanımlanınca, o kategoriye taraf SEÇİLMEDEN girilen her maliyet (form,
 * altın motoru, CSV) DB trigger'ıyla o tarafı alır; elle seçim daima kazanır.
 */
export function CostCategoryBearerEditor({
  categories,
}: {
  categories: CostCategory[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function onChange(categoryId: string, value: string) {
    startTransition(async () => {
      const bearer = value === "none" ? null : (value as CostBearer);
      const res = await setCategoryDefaultBearer(categoryId, bearer);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Kategori varsayılanı güncellendi");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-3">
          <Label
            htmlFor={`bearer-${c.id}`}
            className="text-muted-foreground truncate text-sm font-normal"
          >
            {c.label_tr}
          </Label>
          <Select
            value={c.default_bearer ?? "none"}
            onValueChange={(v) => onChange(c.id, v)}
          >
            <SelectTrigger id={`bearer-${c.id}`} size="sm" className="w-40 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Atama yok</SelectItem>
              {COST_BEARERS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
