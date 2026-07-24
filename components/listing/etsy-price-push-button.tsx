"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { pushListingPricesToEtsyAction } from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { Button } from "@/components/ui/button";

/**
 * Tek listing'in panel fiyatlarını Etsy'ye gönderir — toplu "Etsy'e her şeyi
 * gönder"in kanaryası. Sonucun NEDEN'ini net gösterir (yazıldı / zaten güncel /
 * yazma izni yok / hata) ki toplu itiş öncesi tek ilanda dene-doğrula yapılsın.
 */
export function EtsyPricePushButton({
  productId,
  writeEnabled,
  hasEtsyListing,
}: {
  productId: string;
  writeEnabled: boolean;
  hasEtsyListing: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [armed, setArmed] = useState(false);

  if (!hasEtsyListing) return null;

  function run() {
    start(async () => {
      const r = await pushListingPricesToEtsyAction(productId);
      setArmed(false);
      if (r.needsReconnect) {
        toast.error("Etsy bağlantısı yok — Ayarlar → Etsy'den yeniden bağlanın.");
        return;
      }
      if (r.error) {
        toast.error(r.error);
        return;
      }
      if (r.updated) {
        toast.success(
          `Etsy'ye gönderildi — ${r.changed ?? 0} varyant fiyatı güncellendi.`,
        );
        router.refresh();
      } else {
        toast.info("Etsy fiyatları zaten panelle aynı — değişiklik yok.");
      }
    });
  }

  if (armed && !pending) {
    return (
      <span className="inline-flex items-center gap-2">
        <Button type="button" size="sm" onClick={run}>
          <UploadCloud className="size-4" />
          Onayla — Etsy&apos;ye yaz
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setArmed(false)}
        >
          Vazgeç
        </Button>
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending || !writeEnabled}
      title={
        writeEnabled
          ? "Bu listing'in panel fiyatlarını Etsy'ye gönder"
          : "Etsy yazma izni (listings_w) kapalı — Ayarlar → Etsy'den yeniden bağlanın"
      }
      onClick={() => setArmed(true)}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <UploadCloud className="size-4" />
      )}
      Fiyatı Etsy&apos;e gönder
    </Button>
  );
}
