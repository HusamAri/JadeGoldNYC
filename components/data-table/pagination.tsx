"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Pagination({
  count,
  limit,
  offset,
}: {
  count: number;
  limit: number;
  offset: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(count / limit));

  function go(newOffset: number) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (newOffset > 0) params.set("offset", String(newOffset));
    else params.delete("offset");
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      <p className="text-muted-foreground text-sm">
        {count} kayıt · Sayfa {page}/{pages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={offset <= 0}
          onClick={() => go(Math.max(0, offset - limit))}
        >
          <ChevronLeft />
          Önceki
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={offset + limit >= count}
          onClick={() => go(offset + limit)}
        >
          Sonraki
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
