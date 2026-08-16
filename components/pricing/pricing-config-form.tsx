"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, SlidersHorizontal } from "lucide-react";

import {
  updatePricingConfig,
  type ConfigInput,
} from "@/app/(dashboard)/fiyat/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface ConfigValues {
  fireFactor: number;
  laborUsd: number;
  laborHandfinishedUsd: number;
  packagingUsd: number;
  shippingUsd: number;
  multiplierNarrow: number;
  multiplierWide: number;
  wideBandMinMm: number;
  saleRate: number;
}

const ALANLAR: { key: keyof ConfigValues; etiket: string; ipucu: string }[] = [
  { key: "fireFactor", etiket: "Fire çarpanı", ipucu: "Döküm/işleme kaybı. 1,07 = %7." },
  { key: "laborUsd", etiket: "İşçilik ($)", ipucu: "Standart profiller (dome, flat, beveled, knife)." },
  {
    key: "laborHandfinishedUsd",
    etiket: "El işçiliği ($)",
    ipucu:
      "Frieze & Textured: milgrain, hammered, basketweave, ribbed, Greek key ve diamond-cut.",
  },
  { key: "packagingUsd", etiket: "Paketleme ($)", ipucu: "Kutu + koruyucu zarf." },
  { key: "shippingUsd", etiket: "Kargo payı ($)", ipucu: "Ücretsiz kargo fiyata gömülüdür." },
  { key: "multiplierNarrow", etiket: "Dar bant çarpanı", ipucu: "Eşik altı genişlikler." },
  { key: "multiplierWide", etiket: "Geniş bant çarpanı", ipucu: "Eşik ve üstü (mens-wide primi)." },
  { key: "wideBandMinMm", etiket: "Geniş bant eşiği (mm)", ipucu: "Bu genişlikten itibaren geniş çarpan." },
  { key: "saleRate", etiket: "Vitrin indirimi oranı", ipucu: "Satış = liste × bu oran. 0,75 = %25 indirim." },
];

/**
 * MOTOR AYARLARI (Faz 5a) — spot DIŞINDAKİ tüm girdiler burada, tek yerde.
 *
 * Bu ekran fiyat DEĞİL girdi değiştirir; çıktı her zaman motordan gelir.
 * Kaydetmek onay ister ve eski→yeni farkı audit_log'a düşer. Kaydetmek canlı
 * fiyatları DEĞİŞTİRMEZ — Etsy'ye yazmak ayrı bir kuru çalıştırma + onay ister.
 */
export function PricingConfigForm({
  config,
  stored,
}: {
  config: ConfigValues;
  stored: boolean;
}) {
  const router = useRouter();
  const [acik, setAcik] = useState(false);
  const [pending, setPending] = useState(false);
  const [degerler, setDegerler] = useState<Record<string, string>>(
    Object.fromEntries(
      ALANLAR.map((a) => [a.key, String(config[a.key])]),
    ) as Record<string, string>,
  );

  async function kaydet() {
    if (
      !confirm(
        "Motor ayarları değişecek. Bundan sonraki HER hesap yeni varsayımlarla " +
          "üretilir. Canlı fiyatlar bu adımda değişmez (itiş ayrı onay ister). Devam?",
      )
    ) {
      return;
    }
    setPending(true);
    try {
      const res = await updatePricingConfig(degerler as unknown as ConfigInput);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Ayarlar kaydedildi ve Şirket Hafızası'na yazıldı.");
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            <span className="text-foreground font-medium">
              Motor ayarları
            </span>
            <span className="text-muted-foreground">
              {" "}
              — işçilik, paket, kargo, fire ve çarpanlar
            </span>
            {!stored && (
              <div className="text-muted-foreground mt-1 text-xs">
                Kayıtlı ayar yok; doğrulanmış varsayılanlar kullanılıyor.
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAcik((v) => !v)}
          >
            <SlidersHorizontal className="size-4" />
            {acik ? "Kapat" : "Ayarları düzenle"}
          </Button>
        </div>

        {acik && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ALANLAR.map((a) => (
                <div key={a.key}>
                  <Label htmlFor={a.key}>{a.etiket}</Label>
                  <Input
                    id={a.key}
                    inputMode="decimal"
                    value={degerler[a.key]}
                    onChange={(e) =>
                      setDegerler((d) => ({ ...d, [a.key]: e.target.value }))
                    }
                    disabled={pending}
                  />
                  <p className="text-muted-foreground mt-1 text-xs">{a.ipucu}</p>
                </div>
              ))}
            </div>
            <Button type="button" onClick={kaydet} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Kaydediliyor…" : "Ayarları kaydet"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
