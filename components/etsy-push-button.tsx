"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { pushAllPricesToEtsyAction } from "@/app/(dashboard)/ayarlar/etsy/actions";
import { Button } from "@/components/ui/button";
import { useFrost } from "@/components/layout/frost-provider";
import { formatNumber } from "@/lib/format";

/**
 * "Etsy'e her şeyi gönder" — "Etsy'den her şeyi çek"in simetriği. Panelde
 * düzenlenen varyant fiyatlarını Etsy'ye canlı yazar (domino: dilim dilim,
 * her çağrı zaman bütçeli). Canlı mağazaya yazdığından iki adımlı onay ister;
 * yalnız owner/admin + Etsy yazma izni açıkken etkin.
 */
export function EtsyPushButton({
  disabled,
  writeEnabled,
}: {
  disabled?: boolean;
  writeEnabled: boolean;
}) {
  const router = useRouter();
  const frost = useFrost();
  const [running, setRunning] = useState(false);
  const [armed, setArmed] = useState(false);
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
    updated: number;
    unchanged: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const runningRef = useRef(false);

  const blocked = disabled || !writeEnabled;

  async function run() {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setArmed(false);
    setProgress(null);
    frost.show("syncing", "Fiyatlar Etsy'ye gönderiliyor…");
    let updated = 0;
    let unchanged = 0;
    let skipped = 0;
    let errors = 0;
    const errSamples: string[] = [];
    try {
      let offset = 0;
      let total = 0;
      for (;;) {
        const r = await pushAllPricesToEtsyAction(offset);
        if (r.error) {
          toast.error(r.error);
          break;
        }
        updated += r.updated;
        unchanged += r.unchanged;
        skipped += r.skipped;
        errors += r.errors;
        for (const e of r.sampleErrors)
          if (errSamples.length < 5) errSamples.push(e);
        total = r.total;
        offset = r.nextOffset;
        setProgress({
          processed: Math.min(offset, total),
          total,
          updated,
          unchanged,
          skipped,
          errors,
        });
        if (r.done) {
          // "Fiyatı olan varyant yok" (skipped) durumunu ayrı anlat: hiç
          // pushable listing yoksa kullanıcı "0 güncellendi"yi doğru yorumlar.
          const skipNote =
            skipped > 0 ? ` · ${formatNumber(skipped)} fiyatsız (atlandı)` : "";
          if (total === 0) {
            toast.info("Etsy'de fiyat yazılacak listing yok.");
          } else if (updated === 0 && unchanged === 0 && errors === 0) {
            // Hepsi atlandı: gönderilecek fiyatlı varyant hiç yoktu.
            toast.info(
              `Gönderilecek fiyat bulunamadı — ${formatNumber(
                skipped,
              )} listing'de fiyatlı varyant yok. Önce varyant fiyatlarını girin.`,
            );
          } else if (errors > 0) {
            toast.warning(
              `Gönderildi: ${formatNumber(updated)} güncellendi · ${formatNumber(
                unchanged,
              )} zaten güncel${skipNote} · ${formatNumber(errors)} hata`,
              { description: errSamples.join(" · ") || undefined },
            );
          } else {
            toast.success(
              `Etsy'ye gönderildi: ${formatNumber(updated)} listing güncellendi · ${formatNumber(
                unchanged,
              )} zaten güncel${skipNote}`,
            );
          }
          router.refresh();
          break;
        }
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Gönderim yarıda kesildi.",
        { description: "Tekrar deneyin — kaldığı yerden idempotent devam eder." },
      );
    } finally {
      runningRef.current = false;
      setRunning(false);
      frost.hide();
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {armed && !running ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="default" onClick={run}>
            <UploadCloud className="size-4" />
            Onayla — canlı mağazaya yaz
          </Button>
          <Button variant="ghost" onClick={() => setArmed(false)}>
            Vazgeç
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setArmed(true)}
          disabled={running || blocked}
          title={
            !writeEnabled
              ? "Etsy yazma izni (listings_w) kapalı — yeniden bağlanırken yazma iznini seçin"
              : "Panel varyant fiyatlarını Etsy'ye gönder"
          }
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UploadCloud className="size-4" />
          )}
          {running ? "Etsy'ye gönderiliyor…" : "Etsy'e her şeyi gönder"}
        </Button>
      )}

      {armed && !running && (
        <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-[var(--chart-4)]" />
          Panel fiyatları CANLI Etsy listinglerine yazılacak (indirim değil, taban
          fiyat). Değişmemiş listingler atlanır; fiyatı olmayan varyanta
          dokunulmaz.
        </p>
      )}

      {progress && progress.total > 0 && (
        <div className="nm-raised-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-4 py-3 text-sm tabular-nums">
          <span className="text-foreground inline-flex items-center gap-2 font-medium">
            {running && <Loader2 className="size-3.5 animate-spin" />}
            {formatNumber(progress.processed)}/{formatNumber(progress.total)} listing
          </span>
          <span>
            Güncellendi{" "}
            <span className="text-foreground">{formatNumber(progress.updated)}</span>
          </span>
          <span>
            Zaten güncel{" "}
            <span className="text-foreground">{formatNumber(progress.unchanged)}</span>
          </span>
          {progress.skipped > 0 && (
            <span>
              Fiyatsız{" "}
              <span className="text-foreground">
                {formatNumber(progress.skipped)}
              </span>
            </span>
          )}
          {progress.errors > 0 && (
            <span className="text-destructive">
              Hata {formatNumber(progress.errors)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
