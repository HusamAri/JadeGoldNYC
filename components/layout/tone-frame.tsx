"use client";

import { usePathname } from "next/navigation";

import { toneForPath } from "@/components/layout/nav-items";

/**
 * Editoryal bölüm tonu — Amuletta 2.0. Yol → ton eşlemesi nav-items'ta
 * (`toneForPath`); burada yalnız `data-tone` basılır. globals.css bu
 * özniteliğe göre `--surface`i değiştirir; nm/glass/lift gölgeleri yüzeyden
 * türediği için tüm kabuk kendiliğinden o tona döner. Client bileşen ama
 * SSR'da da çalışır (usePathname sunucuda çözülür), yani ilk boyada flaş yok.
 */
export function ToneFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div
      data-tone={toneForPath(pathname)}
      className="bg-background text-foreground relative isolate flex min-h-svh overflow-x-clip transition-[background-color] duration-500 ease-[var(--ease-quiet)]"
    >
      {children}
    </div>
  );
}
