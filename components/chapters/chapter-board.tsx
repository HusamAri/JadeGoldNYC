"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw, Lock, ArrowRight } from "lucide-react";

import type { ChapterSummary } from "@/lib/db/queries/chapters";
import { CHAPTER_OPTIONS } from "@/lib/collections/chapters";
import {
  rebuildChapters,
  setChapter,
} from "@/app/(dashboard)/tasarimlar/bolumler/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UnclassifiedRow {
  id: string;
  title: string | null;
  etsy_listing_id: number | null;
}

const NUM = new Intl.NumberFormat("tr-TR");

export function ChapterBoard({
  chapters,
  unclassified,
  unclassifiedCount,
}: {
  chapters: ChapterSummary[];
  unclassified: UnclassifiedRow[];
  unclassifiedCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [assigning, setAssigning] = useState<string | null>(null);

  function onRebuild() {
    startTransition(async () => {
      const res = await rebuildChapters();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.changed
          ? `${res.changed} listing yeniden sınıflandı.`
          : "Sınıflama zaten güncel.",
      );
      router.refresh();
    });
  }

  function onAssign(productId: string, chapter: string) {
    setAssigning(productId);
    startTransition(async () => {
      const res = await setChapter(productId, chapter);
      setAssigning(null);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Bölüm sabitlendi.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Bölüm ataması otomatik türetilir; elle değiştirdiğinde{" "}
          <Lock className="inline size-3" aria-hidden /> kilitlenir ve yeniden
          çalıştırma bunu bozmaz.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRebuild}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Yeniden sınıfla
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((c) => {
          const bekleyen = c.redesign.pending + c.redesign.approved;
          return (
            <Card key={c.meta.key} className="overflow-hidden">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">
                      {c.meta.ch ? `${c.meta.ch} · ` : ""}
                      {c.meta.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {c.meta.section}
                    </p>
                  </div>
                  <Badge variant="secondary">{c.listings} listing</Badge>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  {c.meta.meaning}
                </p>

                <dl className="grid grid-cols-3 gap-2 border-t pt-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Aktif</dt>
                    <dd className="font-medium tabular-nums">{c.active}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Görüntülenme</dt>
                    <dd className="font-medium tabular-nums">
                      {NUM.format(c.views)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Favori</dt>
                    <dd className="font-medium tabular-nums">
                      {NUM.format(c.favs)}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {bekleyen > 0 ? (
                    <Badge>{bekleyen} içerik bekliyor</Badge>
                  ) : null}
                  {c.redesign.pushed > 0 ? (
                    <Badge variant="outline">
                      {c.redesign.pushed} gönderildi
                    </Badge>
                  ) : null}
                  {c.locked > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="size-3" aria-hidden />
                      {c.locked} sabit
                    </span>
                  ) : null}
                </div>

                <Link
                  href={`/tasarimlar?chapter=${c.meta.key}`}
                  className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2"
                >
                  Listingleri gör
                  <ArrowRight className="size-3" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {unclassifiedCount > 0 ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div>
              <h3 className="font-medium">
                Sınıflanmamış: {unclassifiedCount} listing
              </h3>
              <p className="text-xs text-muted-foreground">
                Bu listingler hiçbir bölüme düşmedi — bölüm bazlı çalışmada
                atlanırlar, yani hikâyesi yazılmayan ve reklamı yönlendirilmeyen
                ürün olarak kalırlar. Aşağıdan elle ata ya da &laquo;Yeniden
                sınıfla&raquo; ile motoru çalıştır.
              </p>
            </div>
            <ul className="divide-y text-sm">
              {unclassified.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center gap-2 py-2"
                >
                  <Link
                    href={`/tasarimlar/listing/${r.id}`}
                    className="flex-1 truncate underline-offset-2 hover:underline"
                  >
                    {r.title ?? "(başlıksız)"}
                  </Link>
                  <select
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                    defaultValue=""
                    disabled={pending && assigning === r.id}
                    onChange={(e) => {
                      if (e.target.value) onAssign(r.id, e.target.value);
                    }}
                    aria-label="Bölüm ata"
                  >
                    <option value="" disabled>
                      Bölüm ata…
                    </option>
                    {CHAPTER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
