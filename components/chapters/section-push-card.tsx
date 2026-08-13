"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  AlertTriangle,
  Check,
  Store,
  RefreshCw,
} from "lucide-react";

import type {
  SectionPlan,
  SectionPlanRow,
} from "@/app/(dashboard)/tasarimlar/bolumler/section-actions";
import {
  pushSections,
  refreshShopSections,
} from "@/app/(dashboard)/tasarimlar/bolumler/section-actions";
import { CHAPTERS } from "@/lib/collections/chapters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function groupByTarget(rows: SectionPlanRow[]) {
  const m = new Map<string, SectionPlanRow[]>();
  for (const r of rows) {
    const arr = m.get(r.targetSection) ?? [];
    arr.push(r);
    m.set(r.targetSection, arr);
  }
  return [...m.entries()];
}

export function SectionPushCard({ plan }: { plan: SectionPlan }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [canaryDone, setCanaryDone] = useState(false);

  const blocked = plan.missingSections.length > 0;
  const groups = groupByTarget(plan.rows);

  function refresh() {
    startTransition(async () => {
      const res = await refreshShopSections();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`${res.count} bölüm Etsy'den alındı.`);
      router.refresh();
    });
  }

  function run(limit?: number) {
    startTransition(async () => {
      const res = await pushSections(limit != null ? { limit } : undefined);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.failed) {
        toast.error(
          `${res.moved ?? 0} taşındı, ${res.failed} başarısız: ` +
            (res.details ?? [])
              .slice(0, 2)
              .map((d) => d.error)
              .join(" · "),
        );
      } else {
        toast.success(
          limit != null
            ? `Canary gönderildi (${res.moved} listing). Etsy'de gözle doğrula, sonra dalgayı başlat.`
            : `${res.moved} listing vitrin bölümüne taşındı.`,
        );
      }
      if (limit != null && (res.moved ?? 0) > 0) setCanaryDone(true);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-2">
          <Send className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div className="flex-1">
            <h3 className="font-medium">Vitrin bölümlerine gönder</h3>
            <p className="text-xs text-muted-foreground">
              Anlam bölümü Etsy&apos;deki vitrin bölümüne yazılır. Yalnız{" "}
              <code className="rounded bg-muted px-1">shop_section_id</code>{" "}
              değişir — başlık, açıklama, tag ve fiyat Etsy&apos;de olduğu gibi
              kalır. Her yazma geri okunarak doğrulanır.
            </p>
          </div>
          <Badge variant={plan.toMove > 0 ? "default" : "secondary"}>
            {plan.toMove} taşınacak
          </Badge>
        </div>

        {blocked ? (
          <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="flex items-start gap-2 text-xs">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-amber-600"
                aria-hidden
              />
              <span>
                <strong>
                  Etsy&apos;de bulunamayan bölüm:{" "}
                  {plan.missingSections.join(", ")}.
                </strong>{" "}
                Bu bölüme düşecek listingler gönderilmez. Bölümleri
                Etsy&apos;de açtıysan{" "}
                <strong>&quot;Bölümleri Etsy&apos;den tazele&quot;</strong>{" "}
                düğmesine bas — kimlikleri hemen iner (tam senkronu beklemeye
                gerek yok). Panelde kayıtlı liste{" "}
                {plan.sectionsUpdatedAt
                  ? new Date(plan.sectionsUpdatedAt).toLocaleDateString("tr-TR")
                  : "bilinmiyor"}{" "}
                tarihli.
              </span>
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Bölümleri Etsy&apos;den tazele
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => run(1)}
            disabled={pending || plan.toMove === 0}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Store className="size-4" />
            )}
            Canary gönder (1 listing)
          </Button>
          <Button
            size="sm"
            onClick={() => run()}
            disabled={pending || plan.toMove === 0 || !canaryDone}
            title={
              canaryDone
                ? undefined
                : "Önce canary gönder ve Etsy'de gözle doğrula"
            }
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Kalanını gönder ({plan.toMove})
          </Button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs underline underline-offset-2"
          >
            {open ? "Eşleme listesini gizle" : "Eşleme listesini gör"}
          </button>
        </div>

        {!canaryDone && plan.toMove > 0 ? (
          <p className="text-xs text-muted-foreground">
            Dalga, canary gönderilip Etsy&apos;de doğrulanana kadar kilitli —
            yanlış eşleme 121 listing&apos;e yayılmasın.
          </p>
        ) : null}

        {open ? (
          <div className="space-y-3 border-t pt-3">
            {groups.map(([target, rows]) => (
              <div key={target}>
                <p className="mb-1 text-xs font-medium">
                  {target}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {rows.length} listing
                    {rows[0]?.targetSectionId == null
                      ? " · Etsy'de bölüm yok"
                      : ""}
                  </span>
                </p>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {rows.map((r) => (
                    <li key={r.productId} className="flex items-center gap-2">
                      {r.alreadyThere ? (
                        <Check
                          className="size-3 shrink-0 text-emerald-600"
                          aria-hidden
                        />
                      ) : (
                        <span className="w-3 shrink-0" />
                      )}
                      <span className="truncate">{r.title}</span>
                      <span className="ml-auto shrink-0 opacity-60">
                        {CHAPTERS[r.chapter].label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
