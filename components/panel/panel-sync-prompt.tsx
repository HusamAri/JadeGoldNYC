"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ExternalLink } from "lucide-react";

import { EtsySyncButton } from "@/components/etsy-sync-button";
import type { EtsySyncSummary } from "@/lib/etsy/sync";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Panel ilk açıldığında (oturum başına bir kez) çıkan Etsy senkronizasyon
 * hatırlatıcısı. Bağlıysa doğrudan "Şimdi Senkronize Et" butonu (ayarlardaki
 * ile aynı akış), bağlı değilse Etsy'ye bağlanma linki gösterir.
 *
 * "İlk açılış" oturum bazlıdır (sessionStorage): panele o oturumda ilk
 * girişte bir kez görünür, sonraki gezinmelerde tekrar açılmaz.
 */
const SEEN_KEY = "etsy-sync-prompt-seen";

export function PanelSyncPrompt({
  connected,
  configured,
  initialSummary,
}: {
  connected: boolean;
  configured: boolean;
  initialSummary: EtsySyncSummary;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Bir sonraki frame'de aç: SSR/hydration ile uyum + effect içinde
    // senkron setState'ten kaçın.
    const id = requestAnimationFrame(() => {
      try {
        if (!sessionStorage.getItem(SEEN_KEY)) {
          setOpen(true);
          // Oturum başına bir kez: gösterir göstermez işaretle.
          sessionStorage.setItem(SEEN_KEY, "1");
        }
      } catch {
        // sessionStorage erişilemezse sessizce geç (popup açılmaz).
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-4" />
            Etsy senkronizasyonu
          </DialogTitle>
          <DialogDescription>
            {connected
              ? "Panele hoş geldiniz. Verileri güncel tutmak için Etsy mağazanızı şimdi senkronize edebilirsiniz."
              : "Etsy mağazanız bağlı değil. Siparişleri ve ürünleri senkronize etmek için önce mağazanızı bağlayın."}
          </DialogDescription>
        </DialogHeader>

        {connected ? (
          <EtsySyncButton initialSummary={initialSummary} />
        ) : configured ? (
          <Button asChild>
            <Link href="/ayarlar/etsy">
              <ExternalLink className="size-4" />
              Etsy&apos;ye Bağlan
            </Link>
          </Button>
        ) : (
          /* asChild + disabled anchor'da ÇALIŞMAZ (a :disabled bilmez) — buton
             "disabled görünüp" tıklanabilir kalıyordu. Yapılandırma yoksa
             gerçek disabled buton + neden açıklaması göster. */
          <Button disabled title="ETSY_API_KEY / SECRET yapılandırılmadan bağlantı kurulamaz">
            <ExternalLink className="size-4" />
            Etsy&apos;ye Bağlan (yapılandırma gerekli)
          </Button>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Daha sonra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
