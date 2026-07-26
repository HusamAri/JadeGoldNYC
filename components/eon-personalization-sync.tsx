"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";

import {
  scanEonPersonalization,
  pushEonPersonalizationBatch,
  type PersonalizationScanItem,
} from "@/app/(dashboard)/tasarimlar/iyilestir/actions";
import {
  ApiCredentialGuide,
  ETSY_WRITE_GUIDE,
} from "@/components/setup/api-credential-guide";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * EON kişiselleştirme senkronu — Alura listing helper'daki "actionable fix"
 * deseni: önce tara (canlı Etsy), sapmaları listele, sonra toplu uygula.
 * SEO etiketleri kartındaki "Hepsini gönder" ile aynı kapı (yönetici + yazma).
 */
export function EonPersonalizationSync({
  writeEnabled,
  isManager,
}: {
  writeEnabled: boolean;
  isManager: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "scan" | "push">("idle");
  const [scanned, setScanned] = useState(0);
  const [matched, setMatched] = useState(0);
  const [mismatches, setMismatches] = useState<PersonalizationScanItem[]>([]);

  const canPush = writeEnabled && isManager;

  function runScan() {
    setMode("scan");
    startTransition(async () => {
      const res = await scanEonPersonalization();
      setMode("idle");
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setScanned(res.scanned);
      setMatched(res.matched);
      setMismatches(res.mismatches);
      toast.success(
        res.mismatches.length === 0
          ? `${res.scanned} listing tarandı — hepsi kanonik.`
          : `${res.mismatches.length}/${res.scanned} listing sapıyor.`,
      );
    });
  }

  function runPush() {
    if (!canPush) return;
    const ids = mismatches.map((m) => m.etsyListingId);
    if (ids.length === 0) return;
    setMode("push");
    startTransition(async () => {
      const res = await pushEonPersonalizationBatch(ids);
      setMode("idle");
      if (res.error && res.applied === 0) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.applied} listing güncellendi` +
          (res.failed ? ` · ${res.failed} hata` : "") +
          (res.skipped ? ` · ${res.skipped} atlandı` : ""),
      );
      // Yeniden tara — sapma listesini taze tut.
      const again = await scanEonPersonalization();
      if (!again.error) {
        setScanned(again.scanned);
        setMatched(again.matched);
        setMismatches(again.mismatches);
      }
    });
  }

  return (
    <div className="border-border/70 bg-muted/20 space-y-3 rounded-2xl border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
            Kişiselleştirme · EON
          </p>
          <h2 className="text-sm font-semibold">
            Gravür + Engraving style (canlı Etsy)
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Alura listing helper gibi: önce tara, sapmaları gör, tek tuşla
            kanonik sete çek. Text (30 karakter) + stil dropdown (The Signature /
            Ornament / Monument / Editorial).
          </p>
          {scanned > 0 && (
            <p className="font-mono text-[11px] tabular-nums">
              {matched}/{scanned} uyumlu
              {mismatches.length > 0 && (
                <span className="text-amber-700 dark:text-amber-400">
                  {" "}
                  · {mismatches.length} sapma
                </span>
              )}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={runScan}
          >
            {pending && mode === "scan" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Tara
          </Button>
          <Button
            size="sm"
            disabled={pending || !canPush || mismatches.length === 0}
            onClick={runPush}
          >
            {pending && mode === "push" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Hepsini gönder ({mismatches.length})
          </Button>
        </div>
      </div>

      {!writeEnabled && (
        <ApiCredentialGuide items={[ETSY_WRITE_GUIDE]} />
      )}
      {writeEnabled && !isManager && (
        <p className="text-muted-foreground text-xs">
          Etsy&rsquo;ye yazmak için sahip veya yönetici yetkisi gerekir.
        </p>
      )}

      {mismatches.length > 0 && (
        <ul className="divide-border/60 max-h-64 divide-y overflow-y-auto rounded-xl border bg-background/50">
          {mismatches.map((it) => (
            <li
              key={it.etsyListingId}
              className="flex items-center gap-3 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{it.title}</p>
                <p
                  className={cn(
                    "text-muted-foreground font-mono text-[11px]",
                  )}
                >
                  #{it.etsyListingId} · {it.summary}
                </p>
              </div>
              {it.productId && (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/tasarimlar/listing/${it.productId}`}>
                    Aç
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
