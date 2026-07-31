"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UploadCloud } from "lucide-react";

import { pushAllListingSeoToEtsy } from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { Button } from "@/components/ui/button";

/**
 * TOPLU "SEO'yu Etsy'ye gönder" — Listeler sayfası başlığında; tüm canlı
 * listing'lerin paneldeki başlık+tag'ini tek tıkla Etsy'ye yazar.
 * Çift tıklama koruması: istek sürerken buton kilitli.
 */
export function PushAllSeoButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  function run() {
    if (
      !confirm(
        "TÜM canlı listing'lerin paneldeki başlık + tag'leri Etsy'ye yazılacak. Sürebilir (~30 sn) — devam?",
      )
    ) {
      return;
    }
    setPending(true);
    pushAllListingSeoToEtsy()
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        if (res.failed && res.failed.length > 0) {
          toast.warning(
            `${res.sent} gönderildi · ${res.failed.length} hata: ` +
              res.failed
                .slice(0, 3)
                .map((f) => `${f.listingId} (${f.error})`)
                .join(" · ") +
              (res.failed.length > 3 ? " …" : ""),
            { duration: 12000 },
          );
        } else {
          toast.success(`${res.sent} listing'in başlık+tag'i Etsy'ye gönderildi.`);
        }
        router.refresh();
      })
      .finally(() => setPending(false));
  }

  return (
    <Button type="button" variant="outline" onClick={run} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud />}
      {pending ? "Gönderiliyor…" : "SEO'yu Etsy'ye gönder (tümü)"}
    </Button>
  );
}
