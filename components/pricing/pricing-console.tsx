"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Calculator, ShieldCheck, TriangleAlert } from "lucide-react";

import {
  createPricingDryRun,
  approvePricingRun,
  savePricingSpot,
} from "@/app/(dashboard)/fiyat/actions";
import type { PricingRunRow } from "@/lib/pricing-engine/run";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Bekleyen {
  id: string;
  spot: number;
  rows: PricingRunRow[];
  total: number;
  changed: number;
  belowFloor: number;
  unknown: number;
  createdAt: string;
}

const usd = (cents: number | null) =>
  cents == null ? "—" : `$${(cents / 100).toFixed(2)}`;

/**
 * FİYAT KONSOLU — tek kol, kuru çalıştırma, tek onay.
 *
 * Bilinçli olarak EKSİK olan şeyler:
 *  - Fiyat yazılabilen hiçbir alan yok. Girdi yalnız spot'tur.
 *  - "Bu fiyatı diğer varyantlara uygula" YOK. Tek listing içinde doğru
 *    fiyatlar ~5,9 kat aralığa yayılır (gram genişlikle ölçeklenir);
 *    kopyalama kolaylık değil, zarar olayıdır.
 */
export function PricingConsole({
  spot,
  writeEnabled,
  bekleyen,
}: {
  spot: number;
  writeEnabled: boolean;
  bekleyen: Bekleyen | null;
}) {
  const router = useRouter();
  const [spotInput, setSpotInput] = useState(String(spot));
  const [pending, setPending] = useState(false);
  const [pushing, setPushing] = useState(false);

  async function kuruCalistir() {
    setPending(true);
    try {
      const res = await createPricingDryRun(spotInput);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.total} varyant hesaplandı · ${res.changed} değişecek · ` +
          `${res.unknown} bilinmiyor${res.belowFloor ? ` · ${res.belowFloor} ZEMİN ALTI` : ""}`,
        { duration: 9000 },
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function spotKaydet() {
    const res = await savePricingSpot(spotInput);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Spot kaydedildi. Fiyat YAZILMADI — itiş ayrı onay ister.");
      router.refresh();
    }
  }

  async function onayla() {
    if (!bekleyen) return;
    if (
      !confirm(
        `${bekleyen.changed} varyantın fiyatı Etsy'ye yazılacak (spot ${bekleyen.spot} $/ozt). ` +
          "Bu tek onay tek itiş başlatır ve geri alınamaz. Devam?",
      )
    ) {
      return;
    }
    setPushing(true);
    try {
      const res = await approvePricingRun(bekleyen.id);
      if (res.error) {
        toast.error(res.error, { duration: 12000 });
        return;
      }
      toast.success(
        `${res.listings} listing · ${res.updated} varyant yazıldı` +
          `${res.skipped ? ` · ${res.skipped} zaten aynı` : ""}` +
          `${res.errors ? ` · ${res.errors} hata` : ""}`,
        { duration: 12000 },
      );
      router.refresh();
    } finally {
      setPushing(false);
    }
  }

  const zeminVar = (bekleyen?.belowFloor ?? 0) > 0;
  const gosterilen = bekleyen?.rows.slice(0, 200) ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-56">
              <Label htmlFor="spot">Altın spot fiyatı (USD / troy ons)</Label>
              <Input
                id="spot"
                inputMode="decimal"
                value={spotInput}
                onChange={(e) => setSpotInput(e.target.value)}
                disabled={pending || pushing}
              />
            </div>
            <Button
              type="button"
              onClick={kuruCalistir}
              disabled={pending || pushing}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Calculator className="size-4" />
              )}
              {pending ? "Hesaplanıyor…" : "Kuru çalıştır"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={spotKaydet}
              disabled={pending || pushing}
            >
              Spot&apos;u kaydet
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            Kuru çalıştırma canlı Etsy fiyatlarını okur ve motorun hesabıyla
            karşılaştırır. Hiçbir şey yazılmaz. Gramı bilinmeyen varyant
            hesaplanmaz — tahmin üretilmez, &quot;bilinmiyor&quot; olarak işaretlenir.
          </p>
        </CardContent>
      </Card>

      {bekleyen && (
        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <span className="text-foreground font-medium">
                  Onay bekleyen fark
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · spot {bekleyen.spot} $/ozt ·{" "}
                  {new Date(bekleyen.createdAt).toLocaleString("tr-TR")}
                </span>
                <div className="text-muted-foreground mt-1 text-xs">
                  {bekleyen.total} satır · {bekleyen.changed} değişecek ·{" "}
                  {bekleyen.unknown} bilinmiyor · {bekleyen.belowFloor} zemin altı
                </div>
              </div>
              <Button
                type="button"
                onClick={onayla}
                disabled={
                  pushing || pending || zeminVar || !writeEnabled ||
                  bekleyen.changed === 0
                }
              >
                {pushing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ShieldCheck className="size-4" />
                )}
                {pushing ? "Yazılıyor…" : "Onayla ve Etsy'ye yaz"}
              </Button>
            </div>

            {!writeEnabled && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Etsy yazma erişimi kapalı — itiş yapılamaz.
              </p>
            )}
            {zeminVar && (
              <p className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <span>
                  {bekleyen.belowFloor} satırın yeni satış fiyatı zeminin altında
                  kalıyor — bu koşu onaylanamaz. Kapsamı daraltıp kuru
                  çalıştırmayı yenileyin.
                </span>
              </p>
            )}
            {bekleyen.changed === 0 && !zeminVar && (
              <p className="text-muted-foreground text-sm">
                Değişecek satır yok — canlı fiyatlar motorla zaten örtüşüyor.
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr className="border-b border-border/60 text-left">
                    <th className="py-2 pr-3">SKU</th>
                    <th className="py-2 pr-3">Gram</th>
                    <th className="py-2 pr-3 text-right">Canlı</th>
                    <th className="py-2 pr-3 text-right">Yeni</th>
                    <th className="py-2 pr-3 text-right">Fark</th>
                    <th className="py-2 pr-3 text-right">Zemin</th>
                    <th className="py-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {gosterilen.map((r) => (
                    <tr
                      key={r.sku}
                      className="border-b border-border/40 last:border-0"
                    >
                      <td className="py-1.5 pr-3 font-mono text-xs">{r.sku}</td>
                      <td className="py-1.5 pr-3">{r.grams ?? "—"}</td>
                      <td className="py-1.5 pr-3 text-right">
                        {usd(r.liveCents)}
                      </td>
                      <td className="py-1.5 pr-3 text-right">
                        {usd(r.newCents)}
                      </td>
                      <td
                        className={`py-1.5 pr-3 text-right ${
                          (r.deltaCents ?? 0) > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : (r.deltaCents ?? 0) < 0
                              ? "text-red-600 dark:text-red-400"
                              : ""
                        }`}
                      >
                        {r.deltaCents == null
                          ? "—"
                          : `${r.deltaCents > 0 ? "+" : ""}${usd(r.deltaCents)}`}
                      </td>
                      <td className="py-1.5 pr-3 text-right">
                        {r.floorUsd == null ? "—" : `$${r.floorUsd}`}
                      </td>
                      <td className="py-1.5 text-xs">
                        {r.status === "below_floor" ? (
                          <span className="text-red-600 dark:text-red-400">
                            zemin altı
                          </span>
                        ) : r.status === "unknown" ? (
                          <span className="text-muted-foreground">
                            bilinmiyor — {r.note}
                          </span>
                        ) : r.status === "unchanged" ? (
                          <span className="text-muted-foreground">aynı</span>
                        ) : (
                          "değişecek"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bekleyen.rows.length > gosterilen.length && (
                <p className="text-muted-foreground mt-2 text-xs">
                  İlk {gosterilen.length} satır gösteriliyor; onay ve itiş{" "}
                  {bekleyen.rows.length} satırın TAMAMI üzerinde çalışır. Tam
                  fark <code>pricing_runs</code> kaydında saklanır.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
