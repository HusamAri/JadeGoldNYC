"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ClipboardCheck,
  ExternalLink,
  Loader2,
  Search,
  TriangleAlert,
} from "lucide-react";

import {
  ADS_TRIAGE,
  ADS_ACTION_KIND_META,
  type AdsTriageOption,
} from "@/lib/db/queries/ads-actions";
import { createAdsAction } from "@/app/(dashboard)/reklamlar/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * REKLAM TRİYAJI — "bütçe yiyen/boşa harcayan" listing'de körlemesine
 * kapat/azalt yerine kullanıcının kuralını uygular:
 *   1) Arama terimleri raporuna bak (Etsy panosu — API vermiyor).
 *   2) Hedefte + sipariş yok → sorun LISTING'de (güven boşluğu) → reklama dokunma.
 *   3) Hedef dışı → daralt (etiket çıkar / negatif kelime).
 *   4) Hiç dönüşmez → kapat — ama 3 günlük veriyle DEĞİL.
 * Seçilen sonuç, gözlenen terimlerle birlikte aksiyon kuyruğuna düşer
 * (karar günlüğü: karar anı fotoğrafı + sonradan ölçüm).
 */
export function AdsTriageDialog({
  productId,
  productTitle,
  reason,
  snapshot,
  adsUrl,
}: {
  productId: string;
  productTitle: string;
  /** Sinyal özeti (karar gerekçesinin başına eklenir). */
  reason: string;
  /** Karar anı metrik fotoğrafı (JSON). */
  snapshot: string;
  adsUrl: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<AdsTriageOption | null>(null);
  const [terms, setTerms] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!choice) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("product_id", productId);
      fd.set("kind", choice.kind);
      fd.set(
        "reason",
        `TRİYAJ · ${choice.answer}` +
          (terms.trim() ? ` · gözlenen terimler: ${terms.trim()}` : "") +
          ` · ${reason}`,
      );
      fd.set("snapshot", snapshot);
      try {
        await createAdsAction(fd);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Karar kaydedilemedi.");
        return;
      }
      toast.success(
        `Triyaj kararı kuyruğa alındı: ${ADS_ACTION_KIND_META[choice.kind].label}`,
        { description: choice.action },
      );
      setOpen(false);
      setChoice(null);
      setTerms("");
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setChoice(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Search className="size-4" />
          Triyaj başlat (önerilen)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="pr-6">Reklam triyajı — {productTitle}</DialogTitle>
          <DialogDescription>{ADS_TRIAGE.intro}</DialogDescription>
        </DialogHeader>

        <Button asChild variant="outline" size="sm" className="w-fit">
          <a href={adsUrl} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
            Etsy Reklam panosu → Arama terimleri
          </a>
        </Button>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">{ADS_TRIAGE.question}</p>
          <div className="grid gap-2">
            {ADS_TRIAGE.options.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setChoice(o)}
                aria-pressed={choice?.key === o.key}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  choice?.key === o.key
                    ? "border-[color:var(--gold)] bg-[var(--gold-tint)]/50"
                    : "border-[color:var(--glass-border)] hover:bg-accent/40",
                )}
              >
                {o.answer}
              </button>
            ))}
          </div>
        </div>

        {choice && (
          <div className="space-y-3">
            <div className="rounded-xl border border-[color:var(--glass-border)] bg-[var(--glass)] px-3 py-2.5 text-sm">
              <p className="text-muted-foreground">{choice.verdict}</p>
              <p className="mt-1.5 font-medium">{choice.action}</p>
              {choice.caution && (
                <p className="mt-1.5 flex items-start gap-1.5 text-[13px] text-amber-700 dark:text-amber-300">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {choice.caution}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor={`triage-terms-${productId}`}
                className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              >
                Raporda gördüğün terimler (karar kaydına eklenir)
              </label>
              <Textarea
                id={`triage-terms-${productId}`}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder='ör. "solid gold wedding band" hedefte · "gold ring" hedef dışı'
                rows={2}
              />
            </div>

            <Button onClick={submit} disabled={pending} className="w-full">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ClipboardCheck className="size-4" />
              )}
              Aksiyona al · {ADS_ACTION_KIND_META[choice.kind].label}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
