"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Rows3 } from "lucide-react";
import { toast } from "sonner";

import { pushWeddingBandMatricesToEtsyAction } from "@/app/(dashboard)/ayarlar/etsy/actions";
import { Button } from "@/components/ui/button";
import { useFrost } from "@/components/layout/frost-provider";
import { formatNumber } from "@/lib/format";

export function WeddingBandMatrixPushButton({
  disabled,
  writeEnabled,
}: {
  disabled?: boolean;
  writeEnabled: boolean;
}) {
  const router = useRouter();
  const frost = useFrost();
  const runningRef = useRef(false);
  const [armed, setArmed] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    updated: number;
    errors: number;
  } | null>(null);

  async function run() {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setArmed(false);
    frost.show("syncing", "Wedding band varyantları Etsy'ye gönderiliyor…");
    let offset = 0;
    let updated = 0;
    let errors = 0;
    const samples: string[] = [];
    try {
      for (;;) {
        const result = await pushWeddingBandMatricesToEtsyAction(offset);
        if (result.error) {
          toast.error(result.error);
          break;
        }
        updated += result.updated;
        errors += result.errors;
        for (const error of result.sampleErrors) {
          if (samples.length < 5) samples.push(error);
        }
        offset = result.nextOffset;
        setProgress({
          processed: Math.min(offset, result.total),
          total: result.total,
          updated,
          errors,
        });
        if (!result.done) continue;
        if (errors > 0) {
          toast.warning(
            `${formatNumber(updated)} listing doğrulandı, ${formatNumber(errors)} hata`,
            { description: samples.join(" · ") || undefined },
          );
        } else if (updated > 0) {
          toast.success(
            `${formatNumber(updated)} wedding band matrisi Etsy'de doğrulandı.`,
          );
        } else {
          toast.info("Gönderime hazır wedding band matrisi yok.");
        }
        router.refresh();
        break;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Toplu gönderim yarıda kesildi.");
    } finally {
      runningRef.current = false;
      setRunning(false);
      frost.hide();
    }
  }

  const blocked = disabled || !writeEnabled;
  return (
    <div className="flex w-full flex-col gap-2">
      {armed && !running ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={run}>
            <Rows3 className="size-4" />
            Onayla, varyantları canlıya yaz
          </Button>
          <Button variant="ghost" onClick={() => setArmed(false)}>
            Vazgeç
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setArmed(true)}
          disabled={blocked || running}
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Rows3 className="size-4" />
          )}
          {running ? "Matrisler gönderiliyor…" : "Wedding band varyantlarını gönder"}
        </Button>
      )}
      {armed && !running && (
        <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--chart-4)]" />
          Yalnız kontrolden geçmiş Width ve Ring Size matrisleri canlı Etsy
          envanterine yazılır. Her listing işlemden sonra geri okunur.
        </p>
      )}
      {progress && progress.total > 0 && (
        <p className="text-muted-foreground text-xs tabular-nums">
          {formatNumber(progress.processed)}/{formatNumber(progress.total)} işlendi,
          {" "}{formatNumber(progress.updated)} doğrulandı,
          {" "}{formatNumber(progress.errors)} hata
        </p>
      )}
    </div>
  );
}
