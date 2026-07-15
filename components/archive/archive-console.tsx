"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  ImageIcon,
  Video,
  Check,
  Loader2,
  ExternalLink,
  Trash2,
} from "lucide-react";

import {
  archiveListing,
  deleteEtsyListing,
  type ArchiveResult,
  type DeleteResult,
} from "@/app/(dashboard)/arsiv/actions";
import type { ArchiveRow } from "@/lib/db/queries/listing-archive";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RowState = {
  busy: boolean;
  images: number;
  videos: number;
  done: boolean;
  deleted: boolean;
  deleting: boolean;
  confirming: boolean;
  error?: string;
};

export function ArchiveConsole({
  rows,
  canArchive,
}: {
  rows: ArchiveRow[];
  canArchive: boolean;
}) {
  const [state, setState] = useState<Record<number, RowState>>(() =>
    Object.fromEntries(
      rows.map((r) => [
        r.listingId,
        {
          busy: false,
          images: r.archivedImages,
          videos: r.archivedVideos,
          done: r.archivedImages > 0 || r.archivedVideos > 0,
          deleted: r.etsyDeletedAt != null,
          deleting: false,
          confirming: false,
        },
      ]),
    ),
  );
  const [bulkBusy, setBulkBusy] = useState(false);

  const totals = useMemo(() => {
    let img = 0;
    let vid = 0;
    for (const r of rows) {
      const s = state[r.listingId];
      img += s?.images ?? r.archivedImages;
      vid += s?.videos ?? r.archivedVideos;
    }
    return { img, vid };
  }, [rows, state]);

  async function runOne(listingId: number): Promise<ArchiveResult> {
    setState((p) => ({ ...p, [listingId]: { ...p[listingId], busy: true, error: undefined } }));
    let res: ArchiveResult;
    try {
      res = await archiveListing(listingId);
    } catch {
      res = { error: "Beklenmeyen bir hata oluştu." };
    }
    setState((p) => ({
      ...p,
      [listingId]: {
        ...p[listingId],
        busy: false,
        images: res.images ?? p[listingId]?.images ?? 0,
        videos: res.videos ?? p[listingId]?.videos ?? 0,
        done: (res.images ?? 0) > 0 || (res.videos ?? 0) > 0 || p[listingId]?.done,
        error: res.error ?? (res.needsReconnect ? "Etsy bağlantısı gerekiyor." : undefined),
      },
    }));
    return res;
  }

  async function onDelete(listingId: number, title: string | null) {
    setState((p) => ({
      ...p,
      [listingId]: { ...p[listingId], deleting: true, confirming: false, error: undefined },
    }));
    let res: DeleteResult;
    try {
      res = await deleteEtsyListing(listingId);
    } catch {
      res = { error: "Beklenmeyen bir hata oluştu." };
    }
    const reconnectMsg = "Silme izni yok (listings_d) — Etsy'yi silme yetkisiyle yeniden bağlayın.";
    setState((p) => ({
      ...p,
      [listingId]: {
        ...p[listingId],
        deleting: false,
        deleted: res.ok ? true : p[listingId]?.deleted,
        error: res.error ?? (res.needsReconnect ? reconnectMsg : undefined),
      },
    }));
    if (res.ok) {
      toast.success(`${title ?? "Listing"} Etsy'den silindi — arşiv panelde kaldı`);
    } else {
      toast.error(res.error ?? (res.needsReconnect ? reconnectMsg : "Silinemedi."));
    }
  }

  async function onOne(listingId: number, title: string | null) {
    const res = await runOne(listingId);
    if (res.error || res.needsReconnect) {
      toast.error(res.error ?? "Etsy'yi ayarlardan yeniden bağlayın.");
      return;
    }
    toast.success(
      `${title ?? "Listing"} arşivlendi — ${res.images ?? 0} görsel, ${res.videos ?? 0} video`,
    );
  }

  async function onBulk() {
    if (!rows.length) return;
    setBulkBusy(true);
    let img = 0;
    let vid = 0;
    let failed = 0;
    for (const r of rows) {
      const res = await runOne(r.listingId);
      if (res.error || res.needsReconnect) {
        failed += 1;
        if (res.needsReconnect) {
          toast.error("Etsy bağlantısı gerekiyor — ayarlardan yeniden bağlayın.");
          break;
        }
      } else {
        img += res.images ?? 0;
        vid += res.videos ?? 0;
      }
    }
    setBulkBusy(false);
    toast.success(
      `Arşiv tamam — ${img} görsel, ${vid} video${failed ? ` · ${failed} listing atlandı` : ""}`,
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-card nm-raised-sm flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="text-sm">
          <p className="font-semibold">
            {rows.length} listing · arşivde{" "}
            <span className="tabular-nums">{totals.img}</span> görsel ·{" "}
            <span className="tabular-nums">{totals.vid}</span> video
          </p>
          <p className="text-muted-foreground">
            Medya panele indirilir; Etsy&apos;den silinse bile kalıcıdır.
          </p>
        </div>
        <Button
          onClick={onBulk}
          disabled={!canArchive || bulkBusy || rows.length === 0}
        >
          {bulkBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Archive className="size-4" />
          )}
          {bulkBusy ? "Arşivleniyor…" : "Tümünü Arşivle"}
        </Button>
      </div>

      {!canArchive && (
        <p className="text-muted-foreground text-sm">
          Arşivleme yalnız yönetici (owner/admin) tarafından yapılabilir.
        </p>
      )}

      {rows.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm">
          Bu şirkette Etsy listing&apos;i bulunamadı. Önce Ayarlar&apos;dan Etsy
          senkronunu çalıştırın.
        </p>
      ) : (
        <div className="divide-y rounded-2xl border">
          {rows.map((r) => {
            const s = state[r.listingId];
            return (
              <div
                key={r.listingId}
                className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.title ?? `Listing #${r.listingId}`}
                  </p>
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="capitalize">
                      {r.status ?? "—"}
                    </Badge>
                    {s?.deleted && (
                      <Badge
                        className="border-transparent text-white"
                        style={{ background: "#b23b3b" }}
                      >
                        Etsy&apos;den silindi
                      </Badge>
                    )}
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <ImageIcon className="size-3" />
                      {s?.images ?? r.archivedImages}
                      {r.numImages != null && (
                        <span className="text-muted-foreground/70">
                          /{r.numImages}
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Video className="size-3" />
                      {s?.videos ?? r.archivedVideos}
                    </span>
                    <a
                      href={`https://www.etsy.com/listing/${r.listingId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink className="size-3" /> Etsy
                    </a>
                  </div>
                  {s?.error && (
                    <p className="text-destructive mt-1 text-xs">{s.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOne(r.listingId, r.title)}
                    disabled={!canArchive || s?.busy || bulkBusy || s?.deleting}
                    className={cn(s?.done && "text-[color:var(--jade,#2F5D50)]")}
                  >
                    {s?.busy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : s?.done ? (
                      <Check className="size-4" />
                    ) : (
                      <Archive className="size-4" />
                    )}
                    {s?.busy
                      ? "Çekiliyor…"
                      : s?.done
                        ? "Yeniden çek"
                        : "Arşivle"}
                  </Button>

                  {/* Etsy'den sil — yalnız ARŞİVLENMİŞ ve henüz silinmemiş
                      listingde; iki adımlı onay (medya kaybı geri alınamaz). */}
                  {canArchive && s?.done && !s?.deleted && (
                    s?.confirming ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDelete(r.listingId, r.title)}
                          disabled={s?.deleting}
                        >
                          {s?.deleting ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                          {s?.deleting ? "Siliniyor…" : "Onayla, sil"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setState((p) => ({
                              ...p,
                              [r.listingId]: { ...p[r.listingId], confirming: false },
                            }))
                          }
                          disabled={s?.deleting}
                        >
                          Vazgeç
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#b23b3b] hover:text-[#b23b3b]"
                        onClick={() =>
                          setState((p) => ({
                            ...p,
                            [r.listingId]: { ...p[r.listingId], confirming: true },
                          }))
                        }
                        disabled={bulkBusy}
                        title="Etsy'den siler; arşiv panelde kalır"
                      >
                        <Trash2 className="size-4" />
                        Etsy&apos;den sil
                      </Button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
