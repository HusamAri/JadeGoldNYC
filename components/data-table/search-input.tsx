"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function SearchInput({
  placeholder = "Ara…",
  paramKey = "search",
}: {
  placeholder?: string;
  paramKey?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // İki ayrı bekleme evresi var ve İKİSİ de kullanıcıya "çalışıyorum" demeli:
  //  1) debounce kuyruğu (350ms) — henüz istek yok,
  //  2) RSC turu (isPending) — istek uçuşta.
  // Yalnız (2) gösterilseydi ilk 350ms sessiz kalır, "dondu" hissi orada doğardı.
  const [queued, setQueued] = useState(false);
  const [isPending, startTransition] = useTransition();
  const busy = queued || isPending;

  // Bileşen sökülürse bekleyen debounce state yazmaya çalışmasın.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function onChange(next: string) {
    setValue(next);
    setQueued(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (next) params.set(paramKey, next);
      else params.delete(paramKey);
      params.delete("offset");
      setQueued(false);
      // Transition: yeni RSC yükü gelene kadar isPending true kalır.
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 350);
  }

  return (
    // jg-glow-warm: odaklanınca/hover'da altından yükselen sıcak altın parıltı
    // (bkz. IMG_5665). `position:relative` zaten arama ikonunun konumlandığı
    // kapsayıcıda olduğundan `::after` haleyle çakışmaz.
    <div className="jg-glow-warm relative w-full sm:max-w-xs">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-busy={busy}
        // pr-9: spinner yuvası HER ZAMAN ayrılı — gösterge girip çıkarken
        // metin kaymaz (yuva boşken de aynı genişlik).
        className="pr-9 pl-9"
      />
      {/* Sabit yuvalı iş göstergesi. Bekleme YOKKEN DOM'da yok → ekranda
          süresiz animasyon taşımıyoruz; varken tek, 16px'lik hasar bölgesi.
          motion-reduce: dönme durur, gösterge (ve aria-busy) kalır. */}
      {busy && (
        <Loader2
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin motion-reduce:animate-none"
        />
      )}
    </div>
  );
}
