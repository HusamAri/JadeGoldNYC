import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

/**
 * Markalı 404 — küçük monogram + kısa metin + panele dönüş linki.
 * Restraint: tek mark, bol boşluk; warm-minimal estetik (nm yüzeyler Logo/Button
 * içinde). Türkçe arayüz.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <Logo className="size-12" />

      <p className="text-muted-foreground mt-8 text-sm font-medium tracking-[0.32em] uppercase">
        404
      </p>
      <h1 className="text-foreground mt-3 text-2xl font-semibold">
        Sayfa bulunamadı
      </h1>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">
        Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.
      </p>

      <Button asChild className="mt-8">
        <Link href="/panel">Panele dön</Link>
      </Button>
    </main>
  );
}
