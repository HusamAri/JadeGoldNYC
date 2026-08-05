"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronDown, Scale, Send, Loader2, TriangleAlert } from "lucide-react";

import type { ListingWeightPreview } from "@/lib/db/queries/variant-weights";
import {
  pushWeightForListing,
  pushAllWeights,
  stripAllWeightBlocks,
} from "@/app/(dashboard)/tasarimlar/etsy-agirlik/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export function EtsyWeightPush({
  previews,
  writeEnabled,
  connected,
}: {
  previews: ListingWeightPreview[];
  writeEnabled: boolean;
  connected: boolean;
}) {
  const router = useRouter();
  const [pendingAll, startAll] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  function pushOne(productId: string) {
    setBusy(productId);
    pushWeightForListing(productId)
      .then((res) => {
        if (res.error) toast.error(res.error);
        else if (res.unchanged) toast.info("Zaten güncel — değişiklik yok.");
        else toast.success("Etsy açıklaması güncellendi.");
        router.refresh();
      })
      .finally(() => setBusy(null));
  }

  function pushAll() {
    startAll(async () => {
      const r = await pushAllWeights();
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(
        `Bitti: ${r.updated} güncellendi · ${r.unchanged} değişmedi · ${r.errors} hata`,
      );
      router.refresh();
    });
  }

  function stripAll() {
    if (
      !confirm(
        "Tüm listing açıklamalarındaki beden→gram blokları Etsy + panelden silinsin mi?",
      )
    ) {
      return;
    }
    startAll(async () => {
      const r = await stripAllWeightBlocks();
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(
        `Bloklar söküldü: ${r.updated} güncellendi · ${r.unchanged} değişmedi · ${r.errors} hata (taranan ${r.scanned})`,
      );
      router.refresh();
    });
  }

  if (!connected) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Etsy bağlı değil"
        description="Ayarlar → Etsy'den mağazayı bağlayın; ardından bu sayfa gramları listing açıklamalarına yazabilir."
      />
    );
  }

  if (previews.length === 0) {
    return (
      <EmptyState
        icon={Scale}
        title="Gönderilecek ağırlık yok"
        description="Varyantlar henüz listing'lere bağlı değil ya da gramları boş. Önce Etsy varyant senkronunu çalıştırın (/api/cron/etsy-variants), sonra bu sayfa dolar."
      />
    );
  }

  const pending = previews.filter((p) => !p.upToDate);
  const done = previews.filter((p) => p.upToDate);

  /** Tek listing kartı — bekleyen ve güncel bölümlerde aynı yüzey. */
  function renderCard(p: ListingWeightPreview) {
    const isOpen = open === p.productId;
    return (
      <Card key={p.productId} className={cn("p-0", p.upToDate && "opacity-70")}>
        <div className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{p.title}</p>
            <p className="text-muted-foreground text-xs">
              {p.variantCount} beden ·{" "}
              {p.upToDate
                ? "Etsy'de güncel"
                : p.alreadyHasBlock
                  ? "blok mevcut, içeriği değişti (güncellenecek)"
                  : "blok eklenecek"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(isOpen ? null : p.productId)}
          >
            Önizle
            <ChevronDown
              className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
            />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={p.upToDate ? "outline" : "default"}
            disabled={!writeEnabled || busy === p.productId || pendingAll}
            onClick={() => pushOne(p.productId)}
          >
            {busy === p.productId ? (
              <Loader2 className="size-4 animate-spin" />
            ) : p.upToDate ? (
              <Check className="size-3.5" />
            ) : (
              <Send className="size-3.5" />
            )}
            {p.upToDate ? "Yeniden gönder" : "Gönder"}
          </Button>
        </div>
        {isOpen && (
          <pre className="text-muted-foreground max-h-64 overflow-auto border-t bg-secondary/40 p-3 text-xs whitespace-pre-wrap">
            {p.block}
          </pre>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {pending.length > 0 ? (
            <>
              <span className="text-foreground font-semibold tabular-nums">
                {pending.length}
              </span>{" "}
              listing gönderim bekliyor
              {done.length > 0 && (
                <> · {done.length}{" "}listing zaten güncel</>
              )}
              . Açıklamalara idempotent (işaretli) eklenir; tekrar gönderim
              çoğaltmaz.
            </>
          ) : (
            <>
              <Check className="mr-1 inline size-4 text-emerald-600" />
              Hepsi gönderildi — {done.length}{" "}listing&rsquo;in açıklaması
              güncel beden→gram bloğunu taşıyor. Gram değişirse ilgili listing
              yeniden buraya düşer.
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={stripAll}
            disabled={!writeEnabled || pendingAll}
          >
            {pendingAll ? <Loader2 className="animate-spin" /> : null}
            Gram bloklarını sök
          </Button>
          {pending.length > 0 && (
            <Button onClick={pushAll} disabled={!writeEnabled || pendingAll}>
              {pendingAll ? <Loader2 className="animate-spin" /> : <Send />}
              Bekleyenleri Gönder ({pending.length})
            </Button>
          )}
        </div>
      </div>

      {!writeEnabled && (
        <p className="flex items-center gap-2 rounded-xl border border-dashed p-3 text-sm text-amber-600">
          <TriangleAlert className="size-4" />
          Etsy yazma erişimi kapalı (`listings_w`). Gönderim devre dışı — bağlantı
          kapsamını kontrol edin.
        </p>
      )}

      {pending.length > 0 && (
        <div className="space-y-2.5">{pending.map((p) => renderCard(p))}</div>
      )}

      {done.length > 0 && (
        <div className="space-y-2.5">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-medium tracking-wide uppercase transition-colors"
            onClick={() => setShowDone((s) => !s)}
            aria-expanded={showDone}
          >
            <Check className="size-3.5 text-emerald-600" />
            Etsy&rsquo;de güncel ({done.length})
            <ChevronDown
              className={cn("size-3.5 transition-transform", showDone && "rotate-180")}
            />
          </button>
          {showDone && (
            <div className="space-y-2.5">{done.map((p) => renderCard(p))}</div>
          )}
        </div>
      )}
    </div>
  );
}
