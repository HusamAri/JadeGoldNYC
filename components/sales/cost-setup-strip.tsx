import { Check, CircleDashed } from "lucide-react";

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
  n: number;
  title: string;
  done: boolean;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "nm-pressed flex flex-col gap-3 rounded-[1.25rem] p-4",
        done && "opacity-80",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold",
            done
              ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
              : "bg-[var(--brand)]/15 text-[var(--brand)]",
          )}
          aria-hidden
        >
          {done ? <Check className="size-3.5" /> : n}
        </span>
        <div className="min-w-0">
          <p className="font-medium leading-tight">{title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
        </div>
      </div>
      {children && <div className="pl-10">{children}</div>}
    </div>
  );
}

/**
 * Satış & Maliyet Takibi — üç adımlık kurulum şeridi. Kullanıcı Ayarlar'da
 * buton aramasın: Etsy çekimi, iade geri doldurma ve maliyet girişi AYNI
 * sayfada, sırayla, durumuyla birlikte durur.
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
      className="glass-board rounded-[26px] p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center gap-2">
        <CircleDashed className="text-muted-foreground size-4" aria-hidden />
        <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
          Üç adımda hazır
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Step
          n={1}
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
          n={2}
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
          n={3}
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
