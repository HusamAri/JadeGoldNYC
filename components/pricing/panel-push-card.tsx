"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Rocket, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { panelPushAll } from "@/app/(dashboard)/fiyat/actions";

/**
 * TEK TUŞ — paneldeki (denetlenmiş/kanonik) fiyatların TAMAMINI Etsy'ye yazar.
 *
 * İki dokunuş deseni: ilk tıklama butonu SİLAHLANDIRIR (ne olacağını yazar),
 * ikincisi koşturur — tek-kullanımlık onay dersi (yanlış tek tık canlı mağazayı
 * yazmasın), koşarken buton kilitlenir. Sunucu parça parça çalışır
 * (`done:false + nextIndex`); kart bitene kadar aynı turda kendi kendine devam
 * eder — kullanıcı tek buton görür, parçalama görünmezdir.
 */
export function PanelPushCard({
  writeEnabled,
  quota,
}: {
  writeEnabled: boolean;
  /** Etsy günlük kota telemetrisi (son API cevabından; 0134). */
  quota?: {
    quota_remaining: number | null;
    quota_limit_daily: number | null;
    quota_observed_at: string | null;
  } | null;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function calistir() {
    setRunning(true);
    setArmed(false);
    setProgress("Başlıyor…");
    let index = 0;
    let toplamGuncel = 0;
    let toplamAyni = 0;
    let toplamHata = 0;
    let flat = 0;
    try {
      // Sunucu bütçe dolunca nextIndex döner; bitene dek devam et.
      for (let tur = 0; tur < 20; tur++) {
        const res = await panelPushAll(index);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toplamGuncel += res.updated ?? 0;
        toplamAyni += res.unchanged ?? 0;
        toplamHata += res.errors ?? 0;
        flat += res.flatFixed ?? 0;
        if (res.rateLimited) {
          toast.warning(
            "Etsy günlük API kotası doldu — bugün başka yazım yapılamaz. " +
              "Kota 00:00 UTC'de (Türkiye 03:00) sıfırlanır; yarın butona " +
              "tekrar basın, kaldığı yerden sürer." +
              (toplamGuncel ? ` Bugün ${toplamGuncel} varyant yazılabildi.` : ""),
            { duration: 15000 },
          );
          setProgress(null);
          return;
        }
        for (const h of res.hatalar ?? []) {
          toast.error(`Listing ${h.listingId}: ${h.error}`, { duration: 9000 });
        }
        if (res.done) {
          toast.success(
            `Tamamlandı: ${toplamGuncel} varyant güncellendi · ` +
              `${toplamAyni} listing zaten aynıydı` +
              (flat ? ` · ${flat} sıfır-varyant listing düzeltildi` : "") +
              (toplamHata ? ` · ${toplamHata} HATA` : ""),
            { duration: 12000 },
          );
          setProgress(null);
          router.refresh();
          return;
        }
        index = res.nextIndex ?? index;
        setProgress(
          `Devam ediyor… ${index}/${res.totalTargets ?? "?"} listing · ` +
            `${toplamGuncel} güncellendi`,
        );
      }
      toast.error("Tur sınırına ulaşıldı — butona tekrar basın, kaldığı yerden sürer.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium">Panel fiyatlarını Etsy&apos;ye yaz</div>
            <p className="text-muted-foreground mt-1 text-sm">
              Paneldeki denetlenmiş varyant fiyatları otoritedir: her listing
              Etsy&apos;den okunur, yalnız FARKLI olanlar yazılır (idempotent).
              Zararına kalmış sıfır-varyant listing&apos;ler de bu akışta
              düzeltilir. Uzun katalogda parça parça ilerler; buton bitene
              kadar kendi devam eder.
            </p>
            {quota?.quota_remaining != null && (
              <p className="text-muted-foreground mt-1 text-xs">
                Bugün kalan Etsy kotası: ~{quota.quota_remaining}
                {quota.quota_limit_daily ? ` / ${quota.quota_limit_daily}` : ""}
                {quota.quota_observed_at
                  ? ` (${new Date(quota.quota_observed_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} itibarıyla)`
                  : ""}
                {quota.quota_remaining < 500 &&
                  " — kota azaldı; büyük itişi kota sıfırlanınca (TR 03:00) yapın."}
              </p>
            )}
            {progress && (
              <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                {progress}
              </p>
            )}
          </div>
          {armed ? (
            <Button
              type="button"
              onClick={calistir}
              disabled={running || !writeEnabled}
            >
              <ShieldCheck className="size-4" />
              Onayla: tümünü Etsy&apos;ye yaz
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setArmed(true)}
              disabled={running || !writeEnabled}
            >
              {running ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              {running ? "Yazılıyor…" : "Tümünü Etsy'ye push'la"}
            </Button>
          )}
        </div>
        {!writeEnabled && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            Etsy yazma erişimi kapalı — itiş yapılamaz.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
