"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Dir = "prev" | "next";

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
  // Sayfa değişimi bir RSC turudur: `router.replace` transition içinde
  // koşarsa `isPending` yeni yük GELENE KADAR true kalır — kullanıcı ilk kez
  // "bir şey oluyor" sinyali görür ("dondu" hissinin ikinci ana kaynağı).
  const [isPending, startTransition] = useTransition();
  // Hangi yöne gidiliyor: yalnız o düğmede iş göstergesi döner (iki spinner
  // birden dönmez; ekranda eşzamanlı süresiz animasyon 1 adet).
  const [dir, setDir] = useState<Dir | null>(null);

  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(count / limit));

  function go(newOffset: number, direction: Dir) {
    setDir(direction);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (newOffset > 0) params.set("offset", String(newOffset));
    else params.delete("offset");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  const busyPrev = isPending && dir === "prev";
  const busyNext = isPending && dir === "next";

  return (
    <div className="flex items-center justify-between gap-3 pt-3">
      {/* Sayaç bekleme boyunca BAYAT: yerinde durur ama söner — layout kaymaz,
          metin okunur kalır (aria-live ile ekran okuyucuya da bildirilir). */}
      <p
        aria-live="polite"
        className="jg-pending-region text-muted-foreground text-sm"
        data-pending={isPending ? "true" : "false"}
      >
        {count} kayıt · Sayfa {page}/{pages}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="jg-busy"
          aria-busy={busyPrev}
          disabled={isPending || offset <= 0}
          onClick={() => go(Math.max(0, offset - limit), "prev")}
        >
          {/* İkon YERİNE geçer (yan yana değil) → genişlik sabit, satır kaymaz.
              motion-reduce'da dönme durur ama ikon+disabled sinyali kalır. */}
          {busyPrev ? (
            <Loader2 className="animate-spin motion-reduce:animate-none" />
          ) : (
            <ChevronLeft />
          )}
          Önceki
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="jg-busy"
          aria-busy={busyNext}
          disabled={isPending || offset + limit >= count}
          onClick={() => go(offset + limit, "next")}
        >
          Sonraki
          {busyNext ? (
            <Loader2 className="animate-spin motion-reduce:animate-none" />
          ) : (
            <ChevronRight />
          )}
        </Button>
      </div>
    </div>
  );
}
