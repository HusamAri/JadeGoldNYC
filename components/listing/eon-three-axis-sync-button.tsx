"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  applyEonFlatMilgrainThreeAxis,
  previewEonFlatMilgrainThreeAxis,
  type EonThreeAxisPreviewResult,
} from "@/app/(dashboard)/tasarimlar/listing/[id]/eon-three-axis-actions";
import { Button } from "@/components/ui/button";

type ReadyPreview = Extract<EonThreeAxisPreviewResult, { status: "ready" | "unchanged" }>;

/** Deliberately separate live preview and confirmed, existing-draft inventory PUT. */
export function EonThreeAxisSyncButton({
  productId,
  writeEnabled,
}: {
  productId: string;
  writeEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<ReadyPreview | null>(null);
  const [uncertain, setUncertain] = useState(false);

  function runPreview() {
    setPreview(null);
    startTransition(async () => {
      try {
        const result = await previewEonFlatMilgrainThreeAxis(productId);
        if (result.status === "blocked") {
          toast.error(result.error);
          return;
        }
        setPreview(result);
        if (result.status === "unchanged") {
          toast.info(`Etsy taslağı ${result.listingId} zaten 378 varyantlı üç eksen matrisiyle eşleşiyor.`);
        } else {
          toast.success(`Etsy taslağı ${result.listingId}: 378 varyant ve 10 görsel doğrulandı. Yazım için ayrıca onaylayın.`);
        }
      } catch {
        toast.error("Canlı önizleme tamamlanamadı. Yeniden deneyin.");
      }
    });
  }

  function runApply() {
    if (!preview || preview.status !== "ready" || pending) return;
    const token = preview.token;
    setPreview(null);
    startTransition(async () => {
      try {
        const result = await applyEonFlatMilgrainThreeAxis(productId, token);
        if (result.status === "uncertain") {
          setUncertain(true);
          toast.error(result.error, { duration: 15_000 });
          return;
        }
        if (result.status === "blocked") {
          toast.error(result.error);
          return;
        }
        if (result.status === "unchanged" && "listingId" in result) {
          toast.info(`Etsy taslağı ${result.listingId} zaten doğru; envanter yazılmadı.`);
        } else if (result.status === "applied" && "listingId" in result) {
          toast.success(`Etsy taslağı ${result.listingId}: 378 varyant geri okunarak doğrulandı; yayınlanmadı.`);
        }
        router.refresh();
      } catch {
        setUncertain(true);
        toast.error("İstek sonucu belirsiz. Yeniden göndermeyin; Etsy taslağını bağımsız kontrol edin.", {
          duration: 15_000,
        });
      }
    });
  }

  if (uncertain) {
    return (
      <span className="inline-flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
        <AlertTriangle className="size-4" />
        Sonuç belirsiz — tekrar çalıştırmayın; Etsy ve audit kaydını kontrol edin.
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending || !writeEnabled}
        title={writeEnabled ? "EON panel ve Etsy taslağını taze olarak karşılaştır" : "Etsy listings_w yazma izni kapalı"}
        onClick={runPreview}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        Üç ekseni önizle
      </Button>
      {preview?.status === "ready" && (
        <>
          <Button type="button" size="sm" disabled={pending || !writeEnabled} onClick={runApply}>
            Onayla — taslak envanterini eşitle
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setPreview(null)}>
            Vazgeç
          </Button>
        </>
      )}
      {preview?.status === "unchanged" && (
        <span className="text-muted-foreground text-xs">Etsy taslağı zaten eşleşiyor; yazım gerekmez.</span>
      )}
    </span>
  );
}
