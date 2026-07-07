"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Star,
  Download,
  Trash2,
  ExternalLink,
  X,
  ImagePlus,
  Loader2,
  Images,
} from "lucide-react";

import type { GeneratedImage } from "@/lib/db/queries/generated-images";
import { PHOTO_KIT } from "@/lib/photo-kit/types";
import {
  addImagesFromUrls,
  toggleImageSelected,
  deleteGeneratedImage,
} from "@/app/(dashboard)/gorsel-uretim/galeri/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const LINE = "var(--line,#DED9CB)";
const GOLD = "var(--gold,#B89347)";

type Filter = "all" | "selected";

export function GeneratedGallery({
  images,
  canManage,
}: {
  images: GeneratedImage[];
  canManage: boolean;
}) {
  const [items, setItems] = useState<GeneratedImage[]>(images);
  const [filter, setFilter] = useState<Filter>("all");
  const [urls, setUrls] = useState("");
  const [listingId, setListingId] = useState<string>("");
  const [adding, startAdd] = useTransition();
  const [lightbox, setLightbox] = useState<GeneratedImage | null>(null);

  const selectedCount = items.filter((i) => i.isSelected).length;
  const shown = useMemo(
    () => (filter === "selected" ? items.filter((i) => i.isSelected) : items),
    [items, filter],
  );

  const listingOptions = useMemo(
    () =>
      [...PHOTO_KIT].sort((a, b) => a.t.localeCompare(b.t, "tr")),
    [],
  );

  function add() {
    if (!urls.trim()) {
      toast.error("En az bir Higgsfield görsel bağlantısı yapıştırın.");
      return;
    }
    const picked = listingId
      ? listingOptions.find((l) => String(l.id) === listingId)
      : null;
    startAdd(async () => {
      const res = await addImagesFromUrls({
        urls,
        listingId: picked?.id ?? null,
        title: picked?.t ?? null,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `${res.added ?? 0} görsel eklendi${res.skipped ? ` · ${res.skipped} atlandı` : ""}.`,
      );
      setUrls("");
      // Sunucudan taze veriyi almak için sayfayı tazele (server action revalidate).
      window.location.reload();
    });
  }

  function toggle(img: GeneratedImage) {
    const next = !img.isSelected;
    setItems((prev) =>
      prev.map((i) => (i.id === img.id ? { ...i, isSelected: next } : i)),
    );
    toggleImageSelected(img.id, next).then((r) => {
      if (r.error) {
        toast.error(r.error);
        setItems((prev) =>
          prev.map((i) =>
            i.id === img.id ? { ...i, isSelected: !next } : i,
          ),
        );
      }
    });
  }

  function remove(img: GeneratedImage) {
    if (!confirm("Bu görseli panelden kaldır?")) return;
    setItems((prev) => prev.filter((i) => i.id !== img.id));
    if (lightbox?.id === img.id) setLightbox(null);
    deleteGeneratedImage(img.id).then((r) => {
      if (r.error) {
        toast.error(r.error);
        setItems((prev) => [img, ...prev]);
      }
    });
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Ekleme kutusu */}
      <div className="bg-card rounded-2xl border p-4" style={{ borderColor: LINE }}>
        <div className="flex items-center gap-2">
          <ImagePlus className="size-4" style={{ color: GOLD }} />
          <h3 className="font-semibold">Higgsfield&apos;dan görsel ekle</h3>
        </div>
        <p className="text-muted-foreground mt-1 text-[13px]">
          Higgsfield&apos;da ürettiğin görsellerin bağlantısını yapıştır (satır
          başına bir URL). Görseller Higgsfield&apos;dan gösterilir; panele yalnız
          bağlantı kaydedilir — indirmedikçe siteye yük binmez.
        </p>
        <Textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="https://…cloudfront.net/…hf_….png"
          rows={3}
          className="mt-3 font-mono text-xs"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="bg-background h-9 min-w-0 max-w-full rounded-lg border px-3 text-sm"
            style={{ borderColor: LINE }}
            aria-label="Listing (opsiyonel)"
          >
            <option value="">Listing bağla (opsiyonel)</option>
            {listingOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.t}
              </option>
            ))}
          </select>
          <Button type="button" onClick={add} disabled={adding}>
            {adding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {adding ? "Ekleniyor…" : "Ekle"}
          </Button>
        </div>
      </div>

      {/* Filtre + sayaç */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="bg-muted/50 flex min-w-0 max-w-full flex-wrap gap-0.5 rounded-xl border p-0.5"
          style={{ borderColor: LINE }}
          role="group"
          aria-label="Filtre"
        >
          {(
            [
              ["all", `Tümü ${items.length}`],
              ["selected", `Seçili ${selectedCount}`],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
              className={cn(
                "rounded-[0.6rem] px-3 py-1.5 text-xs font-semibold transition-colors",
                filter === v
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Izgara */}
      {shown.length === 0 ? (
        <div
          className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm"
          style={{ borderColor: LINE }}
        >
          <Images className="mx-auto mb-3 size-8 opacity-40" />
          {items.length === 0
            ? "Henüz görsel yok. Yukarıdan Higgsfield bağlantılarını yapıştırarak ekle."
            : "Seçili görsel yok. Görsellerin üzerindeki yıldıza tıklayarak seç."}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((img) => (
            <figure
              key={img.id}
              className={cn(
                "group bg-muted relative overflow-hidden rounded-xl border transition-shadow",
                img.isSelected && "ring-2",
              )}
              style={{
                borderColor: img.isSelected ? GOLD : LINE,
                aspectRatio: "1 / 1",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbUrl || img.sourceUrl}
                alt={img.title || "Üretilen görsel"}
                loading="lazy"
                decoding="async"
                onClick={() => setLightbox(img)}
                className="size-full cursor-zoom-in object-cover"
              />
              {/* seçili rozet */}
              {img.isSelected && (
                <span
                  className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ background: GOLD }}
                >
                  <Star className="size-3 fill-current" /> Seçili
                </span>
              )}
              {/* aksiyonlar */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <IconBtn
                  label={img.isSelected ? "Seçimi kaldır" : "Seç"}
                  onClick={() => toggle(img)}
                  active={img.isSelected}
                >
                  <Star className={cn("size-4", img.isSelected && "fill-current")} />
                </IconBtn>
                <a
                  href={`/api/gorsel/indir?id=${img.id}`}
                  className="inline-flex size-8 items-center justify-center rounded-lg bg-white/90 text-neutral-800 hover:bg-white"
                  title="İndir"
                  aria-label="İndir"
                >
                  <Download className="size-4" />
                </a>
                {canManage && (
                  <IconBtn label="Kaldır" onClick={() => remove(img)}>
                    <Trash2 className="size-4" />
                  </IconBtn>
                )}
              </div>
            </figure>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex max-h-[92vh] max-w-4xl flex-col overflow-hidden rounded-2xl bg-[var(--card)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              aria-label="Kapat"
            >
              <X className="size-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.sourceUrl}
              alt={lightbox.title || "Üretilen görsel"}
              className="max-h-[70vh] w-full bg-black object-contain"
            />
            <div className="flex flex-col gap-3 p-4">
              {lightbox.title && (
                <p className="font-semibold">{lightbox.title}</p>
              )}
              {lightbox.prompt && (
                <p className="text-muted-foreground max-h-24 overflow-y-auto font-mono text-[11px] leading-relaxed">
                  {lightbox.prompt}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={lightbox.isSelected ? "default" : "outline"}
                  onClick={() => {
                    toggle(lightbox);
                    setLightbox({
                      ...lightbox,
                      isSelected: !lightbox.isSelected,
                    });
                  }}
                >
                  <Star
                    className={cn(
                      "size-4",
                      lightbox.isSelected && "fill-current",
                    )}
                  />
                  {lightbox.isSelected ? "Seçili" : "Seç"}
                </Button>
                <Button asChild variant="outline">
                  <a href={`/api/gorsel/indir?id=${lightbox.id}`}>
                    <Download className="size-4" /> İndir
                  </a>
                </Button>
                <Button asChild variant="ghost">
                  <a
                    href={lightbox.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" /> Yeni sekmede aç
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-[var(--gold,#B89347)] text-white"
          : "bg-white/90 text-neutral-800 hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
