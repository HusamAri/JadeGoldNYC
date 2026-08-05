"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";

import { pushAllListingSeoToEtsy } from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { Button } from "@/components/ui/button";

/** Domino turu üst sınırı — imleç ilerlemezse sonsuz döngüye girmeyelim. */
const MAX_TUR = 20;

/**
 * TOPLU "SEO'yu Etsy'ye gönder" — Listeler sayfası başlığında; tüm canlı
 * listing'lerin paneldeki TAG'ini Etsy'ye yazar (başlığa dokunulmaz).
 *
 * Action süre bütçesiyle koşar ve yarıda kalırsa imleç (`nextIndex`) döndürür;
 * bu buton kaldığı yerden devam çağrısı yapar (lib/etsy/sync.ts domino deseni)
 * — yoksa her çağrı baştan başlayıp ilk N listing'i tekrar yazar, sondakilere
 * hiç sıra gelmezdi. Çift tıklama koruması: istek sürerken buton kilitli.
 */
export function PushAllSeoButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run() {
    if (
      !confirm(
        "TÜM canlı listing'lerin paneldeki tag'leri Etsy'ye yazılacak (başlıklara dokunulmaz). " +
          "Listing başına ~1,5 sn sürer — 100+ listing'de birkaç dakika. Devam?",
      )
    ) {
      return;
    }
    setPending(true);
    try {
      let index = 0;
      let sent = 0;
      const failed: { listingId: number; error: string }[] = [];
      for (let tur = 0; tur < MAX_TUR; tur++) {
        const res = await pushAllListingSeoToEtsy(index);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        sent += res.sent ?? 0;
        failed.push(...(res.failed ?? []));
        // Bütçe dolmadıysa iş bitti; imleç ilerlemiyorsa da durmak zorundayız.
        const ilerledi = (res.nextIndex ?? 0) > index;
        if (!res.devam || !ilerledi) break;
        index = res.nextIndex ?? index;
        toast.info(
          `${sent} listing gönderildi · ${res.kalan} kaldı — devam ediliyor…`,
        );
      }

      if (failed.length > 0) {
        toast.warning(
          `${sent} gönderildi · ${failed.length} hata: ` +
            failed
              .slice(0, 3)
              .map((f) => `${f.listingId} (${f.error})`)
              .join(" · ") +
            (failed.length > 3 ? " …" : ""),
          { duration: 12000 },
        );
      } else {
        toast.success(`${sent} listing'in tag'i Etsy'ye gönderildi.`);
      }
      router.refresh();
    } catch (e) {
      // Ağ/zaman aşımı: sessiz kalma — kısmi gönderim yapılmış olabilir.
      toast.error(
        `Gönderim yarıda kaldı: ${e instanceof Error ? e.message : String(e)}. ` +
          "Kısmi yazım Şirket Hafızası'na (audit) düştü; tekrar deneyebilirsiniz.",
        { duration: 12000 },
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={run} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud />}
      {pending ? "Gönderiliyor…" : "SEO'yu Etsy'ye gönder (tümü)"}
    </Button>
  );
}
