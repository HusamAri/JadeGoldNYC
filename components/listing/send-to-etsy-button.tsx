"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Send, Store } from "lucide-react";

import { sendListingToEtsy } from "@/app/(dashboard)/tasarimlar/listing/[id]/send-actions";
import { Button } from "@/components/ui/button";

/**
 * "Etsy'e gönder" — panel taslağını Etsy'de DRAFT listing olarak açar.
 * İKİ ADIMLI onay: ilk tık silahlar (canlı Etsy'ye YAZAR uyarısı), ikinci tık
 * gönderir. Sonuç toast'ta Etsy linki ya da hata. Yalnız taslakta görünür
 * (alreadyOnEtsy=false); listing zaten Etsy'deyse buton hiç render edilmez.
 */
export function SendToEtsyButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [armed, setArmed] = useState(false);

  function send() {
    if (!armed) {
      // 1. tık: onayı silahla — bu buton CANLI Etsy'ye yazar.
      setArmed(true);
      toast.warning("Bu işlem Etsy'de canlı taslak açar. Onaylamak için tekrar tıklayın.");
      // 4 sn sonra kendini disarm et (yanlışlıkla kalması önlensin).
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    setArmed(false);
    setSending(true);
    sendListingToEtsy(productId)
      .then((res) => {
        if (res.error) {
          toast.error(res.error, {
            action: res.url
              ? {
                  label: "Etsy'de aç",
                  onClick: () => window.open(res.url, "_blank", "noopener"),
                }
              : undefined,
          });
          return;
        }
        for (const w of res.warnings ?? []) toast.warning(w);
        toast.success(
          res.skipped
            ? "Bu listing zaten Etsy'de."
            : `Etsy taslağı açıldı (#${res.listingId}).`,
          {
            action: res.url
              ? {
                  label: "Etsy'de aç",
                  onClick: () => window.open(res.url, "_blank", "noopener"),
                }
              : undefined,
          },
        );
        router.refresh();
      })
      .catch((e: unknown) => {
        // Reject (canlı Etsy yazımı ortasında ağ kopması) sessiz kalamaz —
        // taslağın açılıp açılmadığı belirsizdir; tekrar denemeden önce
        // Etsy Drafts kontrol edilmeli (idempotens çift açabilir).
        toast.error(
          e instanceof Error ? e.message : "Etsy'e gönderim yarıda kesildi.",
          {
            description:
              "Taslak açılmış olabilir — tekrar denemeden önce Etsy Drafts'ı kontrol edin.",
          },
        );
      })
      .finally(() => setSending(false));
  }

  return (
    <Button
      type="button"
      variant={armed ? "destructive" : "outline"}
      onClick={send}
      disabled={sending}
      title="Panel taslağını Etsy'de DRAFT listing olarak açar"
    >
      {sending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : armed ? (
        <Send />
      ) : (
        <Store />
      )}
      {armed ? "Onayla — Etsy'e yaz" : "Etsy'e gönder"}
    </Button>
  );
}
