"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Panel hata sınırı. Uygulamada HİÇ error.tsx yoktu: bir RSC hatası ham /
 * boş ekrana düşüyordu — "dondu" hissinin en sert hâli.
 *
 * Kurallar:
 * • Teknik hata metni KULLANICIYA dökülmez (yığın izi/SQL sızıntısı yok);
 *   yalnız Next'in opak `digest` referansı gösterilir, ayrıntı console'a.
 * • Marka işareti HARDCODE EDİLMEZ — bu bir client bileşeni olduğundan
 *   sunucuda çözülen OrgMark/OrgEmblem buraya import edilemez; bu yüzden
 *   yüzey bilerek NÖTR bırakıldı (yanlış marka yazmaktansa hiç yazma).
 * • Hareket yok: sakin kart + mevcut Button etkileşimi (hover lift + basma)
 *   yeterli geri bildirimi zaten veriyor.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Sorgu `.error` yutulmaz — en azından console'a yüzeye çıkar.
    console.error("[panel] route error:", error);
  }, [error]);

  return (
    <div className="page-stack relative z-0 pb-32">
      <Card className="mx-auto w-full max-w-xl">
        <CardContent className="space-y-6">
          {/* Editorial idx satırı — sayfa başlıklarıyla aynı dil. */}
          <div aria-hidden className="idx">
            <span>Hata</span>
            <span className="idx-bar" />
            <span className="idx-ln" />
          </div>

          <div className="space-y-2">
            <h2 className="h-display text-2xl md:text-3xl">
              Bu bölüm <em>açılamadı</em>
            </h2>
            <p className="text-muted-foreground max-w-[60ch] text-sm">
              Beklenmedik bir aksaklık oldu — verilere şu an ulaşılamıyor.
              Panelin geri kalanı çalışıyor: soldaki menüden başka bir bölüme
              geçebilir ya da bu bölümü yeniden deneyebilirsiniz.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => reset()}>
              <RotateCcw />
              Tekrar dene
            </Button>
            <Button asChild variant="outline">
              <Link href="/panel">
                <LayoutDashboard />
                Panele dön
              </Link>
            </Button>
          </div>

          {error.digest && (
            <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
              Hata referansı:{" "}
              <span className="tabular-nums">{error.digest}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
