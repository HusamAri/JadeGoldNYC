"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronDown, Scale, Send, Loader2, TriangleAlert } from "lucide-react";

import type { ListingWeightPreview } from "@/lib/db/queries/variant-weights";
import {
  pushWeightForListing,
  pushAllWeights,
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

  const total = previews.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-semibold tabular-nums">{total}</span>{" "}
          listing için beden→gram bloğu hazır. Açıklamalara idempotent (işaretli)
          eklenir; tekrar gönderim çoğaltmaz.
        </p>
        <Button onClick={pushAll} disabled={!writeEnabled || pendingAll}>
          {pendingAll ? <Loader2 className="animate-spin" /> : <Send />}
          Tümünü Gönder
        </Button>
      </div>

      {!writeEnabled && (
        <p className="flex items-center gap-2 rounded-xl border border-dashed p-3 text-sm text-amber-600">
          <TriangleAlert className="size-4" />
          Etsy yazma erişimi kapalı (`listings_w`). Gönderim devre dışı — bağlantı
          kapsamını kontrol edin.
        </p>
      )}

      <div className="space-y-2.5">
        {previews.map((p) => {
          const isOpen = open === p.productId;
          return (
            <Card key={p.productId} className="p-0">
              <div className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {p.variantCount} beden · {p.alreadyHasBlock ? "blok mevcut (güncellenir)" : "blok eklenecek"}
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
                  disabled={!writeEnabled || busy === p.productId || pendingAll}
                  onClick={() => pushOne(p.productId)}
                >
                  {busy === p.productId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : p.alreadyHasBlock ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  Gönder
                </Button>
              </div>
              {isOpen && (
                <pre className="text-muted-foreground max-h-64 overflow-auto border-t bg-secondary/40 p-3 text-xs whitespace-pre-wrap">
                  {p.block}
                </pre>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
