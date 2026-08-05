"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CopyPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createMissingEtsyVariantsAction } from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { Button } from "@/components/ui/button";

/**
 * Panel'de olup Etsy'de OLMAYAN varyantları listing'e yeni offering olarak
 * ekler. Fiyat itişinden ayrı bir akış: mevcut offering'lerin fiyatına
 * DOKUNULMAZ (externalPricing kuralıyla uyumlu), yalnız eksikler açılır —
 * vaka: panele sonradan eklenen 2-5mm genişlikler Etsy'de yoktu.
 */
export function EtsyVariantCreateButton({
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
      const r = await createMissingEtsyVariantsAction(productId);
      setArmed(false);
      if (r.needsReconnect) {
        toast.error("Etsy bağlantısı yok — Ayarlar → Etsy'den yeniden bağlanın.");
        return;
      }
      if (r.error) {
        toast.error(r.error);
        return;
      }
      if (r.unchanged) {
        toast.info("Tüm panel varyantları zaten Etsy'de — eksik yok.");
        return;
      }
      if ((r.missing?.length ?? 0) > 0) {
        toast.warning(
          `${r.created ?? 0} yeni varyant oluşturuldu; ${r.missing?.length} tanesi oluşturulamadı (fiyat/property eksik).`,
        );
      } else {
        toast.success(
          `${r.created ?? 0} yeni varyant Etsy'de oluşturuldu — mevcut fiyatlara dokunulmadı.`,
        );
      }
      router.refresh();
    });
  }

  if (armed && !pending) {
    return (
      <span className="inline-flex items-center gap-2">
        <Button type="button" size="sm" onClick={run}>
          <CopyPlus className="size-4" />
          Onayla — eksikleri oluştur
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
          ? "Panel'de olup Etsy'de olmayan varyantları Etsy'de oluştur (mevcut fiyatlara dokunulmaz)"
          : "Etsy yazma izni (listings_w) kapalı — Ayarlar → Etsy'den yeniden bağlanın"
      }
      onClick={() => setArmed(true)}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <CopyPlus className="size-4" />
      )}
      Eksik varyantları oluştur
    </Button>
  );
}
