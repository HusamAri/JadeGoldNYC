"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Info, Loader2, Package, UploadCloud } from "lucide-react";

import {
  saveVariantTarget,
  previewVariantPush,
  pushVariantStock,
} from "@/app/(dashboard)/stok/varyant/actions";
import type {
  VariantStockGroup,
  VariantStockRow,
} from "@/lib/db/queries/variant-stock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function VariantStockForm({
  groups,
  writeEnabled,
  canEdit,
}: {
  groups: VariantStockGroup[];
  writeEnabled: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  // Oturum içinde SON KAYDEDİLEN değerler — "değişmedi" kıyası prop'a değil
  // buna bakar; yoksa kaydet→eski değere geri dön akışı sessizce atlanırdı
  // (prop bayat kalır çünkü save() router.refresh çağırmaz).
  const [lastSaved, setLastSaved] = useState<Record<string, number | null>>({});
  const [pushing, startPush] = useTransition();

  function currentTarget(sku: string, fallback: number | null): string {
    return values[sku] ?? (fallback != null ? String(fallback) : "");
  }

  function save(v: VariantStockRow) {
    // Kullanıcı bu inputa hiç yazmadıysa (görünen değer fallback) blur'da
    // KAYDETME — aksi hâlde "" null'a dönüşüp kayıtlı hedefi sessizce siler.
    if (values[v.sku] === undefined) return;
    const raw = values[v.sku].trim();
    if (raw !== "" && !/^\d+$/.test(raw)) {
      toast.error("Adet yalnız rakam olmalı (0 veya daha büyük tam sayı).");
      return;
    }
    const qty = raw === "" ? null : parseInt(raw, 10);
    // Değişmediyse sunucuya gitme (bu oturumda kaydedilen ?? sunucu değeri)
    const baseline =
      v.sku in lastSaved ? lastSaved[v.sku] : (v.targetQuantity ?? null);
    if (qty === baseline) return;
    setSaving((s) => new Set(s).add(v.sku));
    saveVariantTarget(v.sku, qty)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        setLastSaved((m) => ({ ...m, [v.sku]: qty }));
        setSaved((d) => new Set(d).add(v.sku));
        setTimeout(
          () =>
            setSaved((d) => {
              const n = new Set(d);
              n.delete(v.sku);
              return n;
            }),
          1400,
        );
      })
      .finally(() =>
        setSaving((s) => {
          const n = new Set(s);
          n.delete(v.sku);
          return n;
        }),
      );
  }

  function push() {
    startPush(async () => {
      // Önce kapsam önizlemesi: org genelinde kaç varyant değişecek?
      const preview = await previewVariantPush();
      if (preview.error) {
        toast.error(preview.error);
        return;
      }
      if (preview.wouldChange === 0) {
        toast.info("Değişecek varyant yok — hedefler Etsy ile aynı.");
        return;
      }
      const capped = Math.min(preview.wouldChange, 40);
      const ok = confirm(
        `${preview.wouldChange} varyant Etsy'de güncellenecek (tüm listede — ekrandaki filtreden bağımsız).` +
          (preview.wouldChange > 40
            ? ` Bu turda ilk ${capped} tanesi gönderilir; kalanlar için tekrar basmanız gerekir.`
            : "") +
          "\n\nDevam edilsin mi?",
      );
      if (!ok) return;

      const r = await pushVariantStock();
      if (r.error) {
        toast.error(r.error);
        return;
      }
      if (r.needsReconnect) {
        toast.error(
          "Etsy yazma erişimi kapalı. Ayarlar → Etsy'den yeniden bağlanın.",
        );
        return;
      }
      const parts = [`${r.updated} güncellendi`];
      if (r.unchanged) parts.push(`${r.unchanged} değişmedi`);
      if (r.errors) parts.push(`${r.errors} hata`);
      if (r.remaining > 0) {
        toast.warning(
          `${parts.join(" · ")} · ${r.remaining} varyant kaldı — "Etsy'ye Gönder"e tekrar basın.`,
        );
      } else if (r.errors) {
        toast.warning(parts.join(" · "));
      } else {
        toast.success(parts.join(" · "));
      }
      router.refresh();
    });
  }

  if (groups.length === 0) {
    return (
      <p className="nm-pressed text-muted-foreground rounded-2xl p-6 text-center text-sm">
        Bağlı varyant bulunamadı. Önce Stok sayfasından &quot;Varyantları Senkronize
        Et&quot; ile Etsy envanterini çekin.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {canEdit
            ? "Her varyantın hedef adedini girin; hazır olunca Etsy'ye offering başına gönderin."
            : "Salt görüntüleme — hedef girmek için sahip (owner) veya yönetici (admin) yetkisi gerekir."}
        </p>
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            onClick={push}
            disabled={pushing || !writeEnabled || !canEdit}
          >
            {pushing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            {pushing ? "Gönderiliyor…" : "Etsy'ye Gönder"}
          </Button>
          {!writeEnabled && (
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <Info className="size-3.5" />
              Etsy yazma erişimi kapalı —{" "}
              <Link
                href="/ayarlar/etsy"
                className="font-medium underline underline-offset-2"
              >
                yeniden bağlanın
              </Link>
            </p>
          )}
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.productId} className="nm-raised overflow-hidden rounded-[26px]">
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
                  <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                    <span className="text-muted-foreground">Güncel</span>
                    <Badge variant="outline" className="tabular-nums">
                      {v.quantity ?? "—"}
                    </Badge>
                  </div>
                  <div className="relative">
                    <Input
                      inputMode="numeric"
                      placeholder="Hedef"
                      aria-label={`${v.sku} hedef adet`}
                      value={target}
                      disabled={!canEdit}
                      onChange={(e) =>
                        setValues((s) => ({
                          ...s,
                          [v.sku]: e.target.value.replace(/[^0-9]/g, ""),
                        }))
                      }
                      onBlur={() => save(v)}
                      onKeyDown={(e) => e.key === "Enter" && save(v)}
                      className={
                        "h-9 w-20 text-right tabular-nums" +
                        (willChange ? " border-[color:var(--gold)]" : "")
                      }
                    />
                    {saving.has(v.sku) && (
                      <Loader2
                        aria-hidden
                        className="text-muted-foreground absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin"
                      />
                    )}
                    {saved.has(v.sku) && !saving.has(v.sku) && (
                      <Check
                        aria-label="Kaydedildi"
                        className="absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-emerald-600"
                      />
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
