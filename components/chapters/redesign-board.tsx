"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { RedesignRow, RedesignSummary } from "@/lib/db/queries/listing-redesigns";
import {
  approveRedesign,
  rejectRedesign,
  updateProposedDescription,
  pushRedesign,
  pushRedesignWave,
} from "@/app/(dashboard)/tasarimlar/bolumler/redesign-actions";
import type { Chapter } from "@/lib/collections/chapters";

interface Props {
  chapter: Chapter;
  chapterLabel: string;
  rows: RedesignRow[];
  summary: RedesignSummary;
  writeEnabled: boolean;
  isManager: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "bekliyor",
  approved: "onaylı",
  pushed: "gönderildi",
  rejected: "reddedildi",
  failed: "hata",
};

export function RedesignBoard({
  chapter,
  chapterLabel,
  rows,
  summary,
  writeEnabled,
  isManager,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function run(fn: () => Promise<{ ok?: boolean; error?: string; unchanged?: boolean }>) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else if (res.unchanged) toast.success("Etsy zaten güncel.");
      else toast.success("Tamam.");
      router.refresh();
    });
  }

  // Canary = en düşük trafikli onaylı satır. Hero asla ilk gönderilmez.
  const approved = rows.filter((r) => r.status === "approved");
  const pushedCount = summary.pushed;

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium">{chapterLabel} · içerik</span>
          <span>{summary.total} öneri</span>
          <span>{summary.pending} bekliyor</span>
          <span>{summary.approved} onaylı</span>
          <span>{summary.pushed} gönderildi</span>
          {summary.qaFailed > 0 ? (
            <Badge variant="destructive">{summary.qaFailed} QA hatalı</Badge>
          ) : null}
          {summary.failed > 0 ? (
            <Badge variant="destructive">{summary.failed} başarısız</Badge>
          ) : null}
        </div>

        {!writeEnabled ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Etsy yazma erişimi kapalı — gönderim yapılamaz.
          </p>
        ) : null}

        {isManager && writeEnabled && approved.length > 0 ? (
          <div className="mt-4 flex items-center gap-3">
            <Button
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const w = await pushRedesignWave(chapter);
                  if (w.error) return { error: w.error };
                  if (w.rateLimited) {
                    return {
                      error: `Etsy günlük kotası doldu — ${w.pushed} gönderildi, kalan yarın (kota 00:00 UTC'de sıfırlanır).`,
                    };
                  }
                  if (w.errors > 0) {
                    return { error: `${w.pushed} gönderildi, ${w.errors} hata — satırlara bakın.` };
                  }
                  return { ok: true };
                })
              }
            >
              Dalgayı gönder ({approved.length})
            </Button>
            {pushedCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                Kural: önce TEK listing (canary) gönderilir, 48 saat izlenir. Aşağıdan
                tek tek göndererek başla.
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>

      {rows.map((r) => {
        const dViews =
          r.currentViews != null && r.baselineViews != null
            ? r.currentViews - r.baselineViews
            : null;
        const dFavs =
          r.currentFavs != null && r.baselineFavs != null ? r.currentFavs - r.baselineFavs : null;

        return (
          <Card key={r.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={r.status === "pushed" ? "default" : "secondary"}>
                {STATUS_LABEL[r.status] ?? r.status}
              </Badge>
              {r.qaStatus === "fail" ? <Badge variant="destructive">QA hatalı</Badge> : null}
              {r.confidence ? <Badge variant="outline">{r.confidence} güven</Badge> : null}
              <a
                className="text-sm underline"
                href={`https://www.etsy.com/listing/${r.etsyListingId}`}
                target="_blank"
                rel="noreferrer"
              >
                {r.oldTitle ?? r.etsyListingId}
              </a>
            </div>

            {r.qaErrors.length > 0 ? (
              <ul className="rounded border border-destructive/40 bg-destructive/5 p-2 text-sm">
                {r.qaErrors.map((e) => (
                  <li key={e}>⚠ {e}</li>
                ))}
              </ul>
            ) : null}

            {r.error ? <p className="text-sm text-destructive">{r.error}</p> : null}
            {r.rationale ? (
              <p className="text-sm text-muted-foreground">{r.rationale}</p>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  ŞU AN CANLI ({r.oldDescription?.length ?? 0} kr)
                </p>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded bg-muted/40 p-2 text-xs">
                  {r.oldDescription ?? "—"}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  ÖNERİ ({r.proposedDescription?.length ?? 0} kr)
                </p>
                {editing === r.id ? (
                  <div className="space-y-2">
                    <Textarea
                      className="min-h-56 text-xs"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          run(async () => {
                            const res = await updateProposedDescription(r.id, draft);
                            if (!res.error) setEditing(null);
                            return res;
                          })
                        }
                      >
                        Kaydet
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : (
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded bg-muted/40 p-2 text-xs">
                    {r.proposedDescription ?? "—"}
                  </pre>
                )}
              </div>
            </div>

            {r.status === "pushed" && (dViews != null || dFavs != null) ? (
              <p className="text-sm">
                Gönderimden bu yana:{" "}
                {dViews != null ? <b>{dViews >= 0 ? `+${dViews}` : dViews} görüntülenme</b> : null}
                {dViews != null && dFavs != null ? " · " : null}
                {dFavs != null ? <b>{dFavs >= 0 ? `+${dFavs}` : dFavs} favori</b> : null}
              </p>
            ) : null}

            {isManager && r.status !== "pushed" ? (
              <div className="flex flex-wrap gap-2">
                {r.status !== "approved" ? (
                  <Button
                    size="sm"
                    disabled={pending || r.qaStatus === "fail"}
                    onClick={() => run(() => approveRedesign(r.id))}
                  >
                    Onayla
                  </Button>
                ) : null}
                {r.status === "approved" && writeEnabled ? (
                  <Button size="sm" disabled={pending} onClick={() => run(() => pushRedesign(r.id))}>
                    Etsy&apos;ye gönder
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    setEditing(r.id);
                    setDraft(r.proposedDescription ?? "");
                  }}
                >
                  Metni düzenle
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => run(() => rejectRedesign(r.id))}
                >
                  Reddet
                </Button>
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
