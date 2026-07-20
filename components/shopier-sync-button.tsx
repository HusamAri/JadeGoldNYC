"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  advanceShopierSyncAction,
  shopierStatusAction,
} from "@/app/(dashboard)/ayarlar/shopier/actions";
import type { ShopierProgress } from "@/lib/shopier/sync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

/** Shopier senkron butonu — "domino" döngüsü: done olana dek adım adım. */
export function ShopierSyncButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<ShopierProgress | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    let active = true;
    const id = setInterval(async () => {
      try {
        const s = await shopierStatusAction();
        if (active && runningRef.current) setProgress(s);
      } catch {
        // yok say
      }
    }, 1500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [running]);

  async function onClick() {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setProgress(null);
    try {
      for (;;) {
        const r = await advanceShopierSyncAction();
        setProgress(r);
        if (r.status === "error") {
          toast.error(r.error ?? "Senkronizasyon hatası");
          break;
        }
        if (r.status === "paused") {
          toast.message("Shopier oran sınırı — kısa bir süre sonra tekrar deneyin.");
          break;
        }
        if (r.done) {
          toast.success(
            `Senkronize edildi: ${formatNumber(r.orders)} sipariş · ${formatNumber(r.items)} kalem`,
          );
          router.refresh();
          break;
        }
      }
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }

  const showFeed = running && progress != null;

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={onClick} disabled={running || disabled}>
        <RefreshCw className={cn("size-4", running && "animate-spin")} />
        {running ? "Senkronize ediliyor…" : "Shopier'i Senkronize Et"}
      </Button>

      {showFeed && (
        <div className="nm-raised-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-4 py-3 text-sm tabular-nums">
          <span className="text-foreground inline-flex items-center gap-2 font-medium">
            <Loader2 className="size-3.5 animate-spin" />
            Siparişler
          </span>
          <span>
            Sipariş{" "}
            <span className="text-foreground">
              {formatNumber(progress!.orders)}
            </span>
          </span>
          <span>
            Kalem{" "}
            <span className="text-foreground">
              {formatNumber(progress!.items)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
