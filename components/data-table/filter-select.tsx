"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const value = searchParams.get(paramKey) ?? "__all";

  function onValueChange(next: string) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (next && next !== "__all") params.set(paramKey, next);
    else params.delete(paramKey);
    params.delete("offset");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className} size="sm">
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
