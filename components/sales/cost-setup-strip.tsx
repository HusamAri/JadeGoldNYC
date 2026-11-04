import { Check } from "lucide-react";

import type { EtsySyncSummary } from "@/lib/etsy/sync";
import { formatDateTime, formatNumber } from "@/lib/format";
import { EtsySyncButton } from "@/components/etsy-sync-button";
import { RefundRefreshButton } from "@/components/sales/refund-refresh-button";
import { cn } from "@/lib/utils";

function Step({
  n,
  title,
  done,
  hint,
  children,
}: {
  n: string;
  title: string;
  done: boolean;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-3 border-l border-[color:var(--rule)] pl-5 first:border-l-0 first:pl-0",
        done && "opacity-70",
      )}
    >
      <div className="flex items-baseline gap-3">
        <span
          className={cn("mono-label shrink-0", done ? "text-neon-ink" : "text-foreground")}
          aria-hidden
        >
          {done ? <Check className="inline size-3" /> : n}
        </span>
        <div className="min-w-0">
          <p className="h-serif text-[20px] leading-tight">{title}</p>
          <p className="text-ink-2 mt-1 text-xs leading-relaxed">{hint}</p>
        </div>
      </div>
      {children && <div className="pl-9">{children}</div>}
    </div>
  );
}

/**
 * Satış & Maliyet — üç adımlık kurulum şeridi (V7: düz, hairline'lı sütunlar,
 * mono adım numarası). Etsy çekimi, iade geri doldurma ve maliyet girişi AYNI
 * sayfada, sırayla, durumuyla birlikte durur; hepsi tamamsa şerit gizlenir.
 */
export function CostSetupStrip({
  connected,
  summary,
  refundBacklog,
  incompleteItems,
  totalItems,
  canRun,
}: {
  connected: boolean;
  summary: EtsySyncSummary;
  refundBacklog: number;
  incompleteItems: number;
  totalItems: number;
  canRun: boolean;
}) {
  const lastSync = summary.lastSyncAt ?? null;
  const syncDone = lastSync != null;
  const refundsDone = refundBacklog === 0;
  const costsDone = totalItems > 0 && incompleteItems === 0;
  const allDone = syncDone && refundsDone && costsDone;
  if (allDone) return null;

  return (
    <section
      aria-label="Kurulum adımları"
      className="border-b border-[color:var(--rule)] pb-6"
    >
      <p className="mono-label mb-4">Üç adımda hazır</p>
      <div className="grid gap-6 lg:grid-cols-3">
        <Step
          n="01"
          title="Etsy'den satışları çek"
          done={syncDone}
          hint={
            !connected
              ? "Etsy bağlı değil: Ayarlar → Etsy → Etsy'ye Bağlan."
              : lastSync
                ? `Son çekim ${formatDateTime(lastSync)}. Yeni sipariş, iade ve kargo etiketi için tekrar bas.`
                : "Siparişler, kalemler, iadeler ve ücretler buradan gelir."
          }
        >
          <EtsySyncButton disabled={!connected || !canRun} initialSummary={summary} />
        </Step>
        <Step
          n="02"
          title="Eski iadelerin tutarını çek"
          done={refundsDone}
          hint={
            refundsDone
              ? "Tüm iadeli siparişlerin tutarı Etsy'den okundu."
              : `${formatNumber(refundBacklog)} iadeli siparişin tutarı henüz okunmadı; sıfıra inene kadar bas.`
          }
        >
          {!refundsDone && (
            <RefundRefreshButton backlog={refundBacklog} canRun={canRun} />
          )}
        </Step>
        <Step
          n="03"
          title="Altın ve işçiliği gir"
          done={costsDone}
          hint={
            totalItems === 0
              ? "Satış gelince aşağıdaki tabloda her satırın Altın / İşçilik hücresine yaz."
              : costsDone
                ? "Her kalemde altın ve işçilik var."
                : `${formatNumber(incompleteItems)} kalemde altın veya işçilik eksik. Aşağıdaki tabloda hücreye yaz, Enter'a bas. "Maliyeti eksik" filtresi yalnız onları gösterir.`
          }
        />
      </div>
    </section>
  );
}
