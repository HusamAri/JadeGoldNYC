"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import {
  advanceEtsySyncAction,
  etsySyncStatusAction,
} from "@/app/(dashboard)/ayarlar/etsy/actions";
import type { SyncProgress, EtsySyncSummary } from "@/lib/etsy/sync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNumber, formatDateTime } from "@/lib/format";

const PHASE_LABELS: Record<string, string> = {
  sales: "Siparişler",
  listings: "Ürünler",
  listings_all: "Diğer listeler",
  reviews: "Yorumlar",
  ledger: "Ücretler/Reklam",
  extras: "Mağaza verileri",
  done: "Tamamlandı",
};

export function EtsySyncButton({
  disabled,
  initialSummary,
}: {
  disabled?: boolean;
  initialSummary: EtsySyncSummary;
}) {
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
            `Senkronize edildi: ${formatNumber(r.sales)} yeni sipariş · ${formatNumber(
              r.items,
            )} yeni kalem`,
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
  // Hiç senkron olmadıysa (yeni bağlantı) kalıcı özet kartını gösterme.
  const hasHistory = initialSummary.lastSyncAt != null || initialSummary.startedAt != null;

  return (
    <div className="flex w-full flex-col gap-2">
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

      {!running && hasHistory && <LastSyncSummaryPanel summary={initialSummary} />}
    </div>
  );
}

function etsyListingUrl(id: number | null): string | null {
  return id != null ? `https://www.etsy.com/listing/${id}` : null;
}

/** Sayfa her açıldığında görünen KALICI son senkron özeti — çalışan bir tur olmasa da durur. */
function LastSyncSummaryPanel({ summary }: { summary: EtsySyncSummary }) {
  const { counts, linkedProducts, listingChanges } = summary;
  const hasChanges =
    listingChanges.becameActive.length > 0 ||
    listingChanges.becameInactive.length > 0;

  return (
    <div className="nm-raised-sm w-full space-y-3 rounded-2xl px-4 py-3.5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="font-medium">
          Son Senkron ·{" "}
          <span className="text-muted-foreground font-normal">
            {formatDateTime(summary.lastSyncAt ?? summary.updatedAt)}
          </span>
        </span>
        {summary.status === "error" && summary.error && (
          <span className="text-destructive text-xs">{summary.error}</span>
        )}
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
        <span>
          Bu turda: <span className="text-foreground">{formatNumber(counts.sales)}</span>{" "}
          yeni sipariş · <span className="text-foreground">{formatNumber(counts.items)}</span>{" "}
          yeni kalem
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums">
        <span>
          Bağlı ürün:{" "}
          <span className="text-foreground font-medium">
            {formatNumber(linkedProducts.active)}
          </span>{" "}
          aktif / <span className="text-foreground">{formatNumber(linkedProducts.total)}</span>{" "}
          toplam
        </span>
      </div>

      {hasChanges ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {listingChanges.becameActive.length > 0 && (
            <ListingChangeList
              icon={<ArrowUpRight className="size-3.5 text-emerald-600" />}
              label="Aktif oldu"
              items={listingChanges.becameActive}
              moreCount={listingChanges.moreActiveCount}
            />
          )}
          {listingChanges.becameInactive.length > 0 && (
            <ListingChangeList
              icon={<ArrowDownRight className="size-3.5 text-[color:#b23b3b]" />}
              label="Pasife düştü"
              items={listingChanges.becameInactive}
              moreCount={listingChanges.moreInactiveCount}
            />
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Bu turda ürün durumu değişmedi.
        </p>
      )}
    </div>
  );
}

function ListingChangeList({
  icon,
  label,
  items,
  moreCount,
}: {
  icon: React.ReactNode;
  label: string;
  items: { title: string; etsyListingId: number | null }[];
  moreCount: number;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-xs font-semibold">
        {icon}
        {label} ({items.length + moreCount})
      </p>
      <ul className="space-y-0.5">
        {items.map((it, i) => {
          const url = etsyListingUrl(it.etsyListingId);
          return (
            <li key={i} className="text-muted-foreground truncate text-xs">
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground inline-flex max-w-full items-center gap-1"
                >
                  <span className="truncate">{it.title}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : (
                it.title
              )}
            </li>
          );
        })}
        {moreCount > 0 && (
          <li className="text-muted-foreground text-xs">+{moreCount} tane daha</li>
        )}
      </ul>
    </div>
  );
}
