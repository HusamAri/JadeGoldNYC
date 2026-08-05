"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function FilterSelect({
  paramKey,
  placeholder,
  options,
  allLabel = "Tümü",
  className = "w-[170px]",
}: {
  paramKey: string;
  placeholder: string;
  options: { value: string; label: string }[];
  allLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Filtre değişimi de bir RSC turu: transition içinde koşar, `isPending`
  // yeni yük gelene kadar true kalır (Pagination/SearchInput ile aynı dil).
  const [isPending, startTransition] = useTransition();
  const value = searchParams.get(paramKey) ?? "__all";

  function onValueChange(next: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (next && next !== "__all") params.set(paramKey, next);
    else params.delete(paramKey);
    params.delete("offset");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      {/* jg-busy: bekleyen tetikleyici SOLMAZ (soluklaştırma "bozuk/pasif"
          okunur) — yalnız imleç ilerlemeyi anlatır + aria-busy ekran
          okuyucuya bildirir. Seçilen değer anında görünür kalır. */}
      <SelectTrigger
        className={cn("jg-busy", className)}
        size="sm"
        aria-busy={isPending}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
