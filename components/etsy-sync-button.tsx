"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  advanceEtsySyncAction,
  etsySyncStatusAction,
} from "@/app/(dashboard)/ayarlar/etsy/actions";
import type { SyncProgress } from "@/lib/etsy/sync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

const PHASE_LABELS: Record<string, string> = {
  sales: "Siparişler",
  listings: "Ürünler",
  reviews: "Yorumlar",
  ledger: "Ücretler/Reklam",
  done: "Tamamlandı",
};

export function EtsySyncButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const runningRef = useRef(false);

  // Çalışırken her ~1.5sn'de ilerlemeyi yokla → satır satır canlı akış hissi.
  useEffect(() => {
    if (!running) return;
    let active = true;
    const id = setInterval(async () => {
      try {
        const s = await etsySyncStatusAction();
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
      // "Domino": her dilim bittiğinde bir sonrakini tetikle.
      for (;;) {
        const r = await advanceEtsySyncAction();
        setProgress(r);
        if (r.status === "error") {
          toast.error(r.error ?? "Senkronizasyon hatası");
          break;
        }
        if (r.done) {
          toast.success(
            `Senkronize edildi: ${formatNumber(r.sales)} sipariş · ${formatNumber(
              r.items,
            )} kalem`,
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
        {running ? "Senkronize ediliyor…" : "Şimdi Senkronize Et"}
      </Button>

      {showFeed && (
        <div className="nm-raised-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-4 py-3 text-sm tabular-nums">
          <span className="text-foreground inline-flex items-center gap-2 font-medium">
            <Loader2 className="size-3.5 animate-spin" />
            {PHASE_LABELS[progress!.phase] ?? progress!.phase}
          </span>
          <span>
            Sipariş <span className="text-foreground">{formatNumber(progress!.sales)}</span>
          </span>
          <span>
            Kalem <span className="text-foreground">{formatNumber(progress!.items)}</span>
          </span>
          <span>
            Ürün <span className="text-foreground">{formatNumber(progress!.products)}</span>
          </span>
          <span>
            Yorum <span className="text-foreground">{formatNumber(progress!.reviews)}</span>
          </span>
          <span>
            Ücret kaydı{" "}
            <span className="text-foreground">{formatNumber(progress!.ledger)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
