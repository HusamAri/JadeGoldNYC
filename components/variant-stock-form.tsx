"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Package, UploadCloud } from "lucide-react";

import {
  saveVariantTarget,
  pushVariantStock,
} from "@/app/(dashboard)/stok/varyant/actions";
import type { VariantStockGroup } from "@/lib/db/queries/variant-stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function VariantStockForm({
  groups,
  writeEnabled,
}: {
  groups: VariantStockGroup[];
  writeEnabled: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [pushing, startPush] = useTransition();

  function currentTarget(sku: string, fallback: number | null): string {
    return values[sku] ?? (fallback != null ? String(fallback) : "");
  }

  function save(sku: string) {
    const raw = (values[sku] ?? "").trim();
    const qty = raw === "" ? null : Number(raw.replace(/[^\d]/g, ""));
    if (qty != null && (!Number.isInteger(qty) || qty < 0)) {
      toast.error("Adet 0 veya daha büyük tam sayı olmalı.");
      return;
    }
    setSaving((s) => new Set(s).add(sku));
    saveVariantTarget(sku, qty)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        setSaved((d) => new Set(d).add(sku));
        setTimeout(
          () =>
            setSaved((d) => {
              const n = new Set(d);
              n.delete(sku);
              return n;
            }),
          1400,
        );
      })
      .finally(() =>
        setSaving((s) => {
          const n = new Set(s);
          n.delete(sku);
          return n;
        }),
      );
  }

  function push() {
    startPush(async () => {
      const r = await pushVariantStock();
      if (r.error) {
        toast.error(r.error);
        return;
      }
      if (r.needsReconnect) {
        toast.error("Etsy yazma erişimi kapalı. Ayarlar → Etsy'den yeniden bağlanın.");
        return;
      }
      const parts = [`${r.updated} güncellendi`];
      if (r.unchanged) parts.push(`${r.unchanged} değişmedi`);
      if (r.errors) parts.push(`${r.errors} hata`);
      const msg = parts.join(" · ");
      if (r.errors) toast.warning(msg);
      else toast.success(msg);
      router.refresh();
    });
  }

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm">
        Bağlı varyant bulunamadı. Önce Stok sayfasından &quot;Varyantları Senkronize
        Et&quot; ile Etsy envanterini çekin.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Her varyantın hedef adedini girin; hazır olunca Etsy&apos;ye offering
          başına gönderin.
        </p>
        <Button type="button" onClick={push} disabled={pushing || !writeEnabled}>
          {pushing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UploadCloud className="size-4" />
          )}
          {pushing ? "Gönderiliyor…" : "Etsy'ye Gönder"}
        </Button>
      </div>

      {groups.map((g) => (
        <div key={g.productId} className="overflow-hidden rounded-2xl border">
          <div className="bg-muted/40 flex items-center gap-2.5 border-b px-3 py-2.5 sm:px-4">
            <Package className="text-muted-foreground size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{g.productTitle}</p>
              {g.etsyListingId != null && (
                <p className="text-muted-foreground truncate text-xs">
                  Etsy listing #{g.etsyListingId}
                </p>
              )}
            </div>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {g.variants.length} varyant
            </span>
          </div>

          <div className="divide-y">
            {g.variants.map((v) => {
              const target = currentTarget(v.sku, v.targetQuantity);
              const targetNum = target === "" ? null : Number(target);
              const willChange =
                targetNum != null && targetNum !== (v.quantity ?? null);
              return (
                <div
                  key={v.sku}
                  className="flex items-center gap-3 px-3 py-2.5 sm:px-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-medium">{v.sku}</p>
                    {v.name && (
                      <p className="text-muted-foreground truncate text-xs">
                        {v.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 whitespace-nowrap text-xs">
                    <span className="text-muted-foreground">Güncel</span>
                    <Badge variant="outline" className="tabular-nums">
                      {v.quantity ?? "—"}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      inputMode="numeric"
                      placeholder="Hedef"
                      value={target}
                      onChange={(e) =>
                        setValues((s) => ({ ...s, [v.sku]: e.target.value }))
                      }
                      onBlur={() => save(v.sku)}
                      onKeyDown={(e) => e.key === "Enter" && save(v.sku)}
                      className={
                        "h-9 w-20 text-right tabular-nums" +
                        (willChange ? " border-[color:var(--gold,#B89347)]" : "")
                      }
                    />
                    {saving.has(v.sku) && (
                      <Loader2 className="text-muted-foreground absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin" />
                    )}
                    {saved.has(v.sku) && !saving.has(v.sku) && (
                      <Check className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-emerald-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
