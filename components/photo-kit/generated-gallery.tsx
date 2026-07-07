"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Star,
  Download,
  Trash2,
  ExternalLink,
  ImagePlus,
  Loader2,
  Images,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";

import type { GeneratedImage } from "@/lib/db/queries/generated-images";
import { PHOTO_KIT } from "@/lib/photo-kit/types";
import {
  addImagesFromUrls,
  toggleImageSelected,
  deleteGeneratedImage,
  uploadImageToListing,
} from "@/app/(dashboard)/gorsel-uretim/galeri/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const LINE = "var(--line,#DED9CB)";

type Filter = "all" | "selected";

export function GeneratedGallery({
  images,
  canManage,
}: {
  images: GeneratedImage[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<GeneratedImage[]>(images);
  const [filter, setFilter] = useState<Filter>("all");
  const [urls, setUrls] = useState("");
  const [listingId, setListingId] = useState<string>("");
  const [adding, startAdd] = useTransition();
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const [bulkUploading, setBulkUploading] = useState(false);
  // Tahmini _min.webp thumb'ı 404 olursa tam görsele düşmek için
  const [thumbFailed, setThumbFailed] = useState<Set<string>>(new Set());

  // Server action + router.refresh() sonrası taze props'u state'e yansıt
  // (render sırasında ayarlama — React'in önerdiği props→state senkron deseni)
  const [prevImages, setPrevImages] = useState(images);
  if (prevImages !== images) {
    setPrevImages(images);
    setItems(images);
  }

  const selectedCount = items.filter((i) => i.isSelected).length;
  const shown = useMemo(
    () => (filter === "selected" ? items.filter((i) => i.isSelected) : items),
    [items, filter],
  );
  // Lightbox tek doğruluk kaynağından (items) türetilir — kopya state yok
  const lightbox = lightboxId
    ? (items.find((i) => i.id === lightboxId) ?? null)
    : null;

  const listingOptions = useMemo(
    () => [...PHOTO_KIT].sort((a, b) => a.t.localeCompare(b.t, "tr")),
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
      const added = res.added ?? 0;
      if (res.invalid) {
        toast.warning(
          `${added} eklendi · ${res.invalid} bağlantı Higgsfield deseniyle eşleşmedi (kutuda bırakıldı)` +
            (res.duplicates ? ` · ${res.duplicates} zaten vardı` : ""),
        );
        // Reddedilenler kutuda kalsın ki kullanıcı düzeltebilsin
        setUrls((res.invalidLines ?? []).join("\n"));
      } else if (added === 0) {
        toast.info("Yeni görsel yok — hepsi zaten ekliydi.");
        setUrls("");
      } else {
        toast.success(
          `${added} görsel eklendi${res.duplicates ? ` · ${res.duplicates} zaten vardı` : ""}.`,
        );
        setUrls("");
      }
      router.refresh();
    });
  }

  function markUploaded(id: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, etsyUploadedAt: new Date().toISOString() } : i,
      ),
    );
  }

  // "fatal" = bağlantı/yetki sorunu — tüm partiyi etkiler, toplu yükleme
  // tekrar denemeden hemen durmalı.
  async function uploadOne(
    img: GeneratedImage,
  ): Promise<"ok" | "fail" | "fatal"> {
    const picked = listingId ? Number(listingId) : null;
    const target = img.etsyListingId ?? picked;
    if (!target) {
      toast.error(
        "Görsel bir listing'e bağlı değil — üstteki menüden listing seçin.",
      );
      return "fail";
    }
    setUploading((s) => new Set(s).add(img.id));
    try {
      const r = await uploadImageToListing(img.id, target);
      if (r.needsReconnect) {
        toast.error(
          "Etsy yazma erişimi kapalı. Ayarlar → Etsy'den yeniden bağlanın.",
        );
        return "fatal";
      }
      if (r.error) {
        toast.error(r.error);
        return "fail";
      }
      markUploaded(img.id);
      return "ok";
    } finally {
      setUploading((s) => {
        const n = new Set(s);
        n.delete(img.id);
        return n;
      });
    }
  }

  async function uploadSelected() {
    const pending = items.filter((i) => i.isSelected && !i.etsyUploadedAt);
    if (pending.length === 0) {
      toast.info("Yüklenecek seçili görsel yok (hepsi zaten yüklü olabilir).");
      return;
    }
    const unlinked = pending.filter((i) => !i.etsyListingId);
    if (unlinked.length > 0 && !listingId) {
      toast.error(
        `${unlinked.length} seçili görsel listing'e bağlı değil — üstteki menüden listing seçin ya da bağlı olanları tek tek yükleyin.`,
      );
      return;
    }
    const ok = confirm(
      `${pending.length} seçili görsel Etsy'ye ürün fotoğrafı olarak yüklenecek` +
        ` (her biri kendi bağlı listing'ine${listingId ? ", bağsızlar menüdeki listing'e" : ""}).` +
        "\nNot: Etsy bir listing'de en fazla 10 fotoğrafa izin verir.\n\nDevam edilsin mi?",
    );
    if (!ok) return;
    setBulkUploading(true);
    let done = 0;
    let totalFailed = 0;
    let streak = 0; // üst üste hata — başarıda sıfırlanır
    try {
      for (const img of pending) {
        const outcome = await uploadOne(img);
        if (outcome === "fatal") break; // bağlantı/yetki: parti geneli, dur
        if (outcome === "ok") {
          done++;
          streak = 0;
        } else {
          totalFailed++;
          streak++;
        }
        if (streak >= 3) {
          toast.warning("Üst üste hatalar — yükleme durduruldu.");
          break;
        }
      }
    } finally {
      setBulkUploading(false);
    }
    if (done > 0 && totalFailed === 0)
      toast.success(`${done} görsel Etsy'ye yüklendi.`);
    else if (done > 0) toast.warning(`${done} yüklendi · ${totalFailed} hata.`);
    router.refresh();
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
    if (lightboxId === img.id) setLightboxId(null);
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
      <div className="bg-card nm-raised-sm rounded-[1.75rem] p-4">
        <div className="flex items-center gap-2">
          <ImagePlus className="size-4" style={{ color: "var(--gold-deep,#9A7A34)" }} />
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
            className="bg-background h-10 max-w-full min-w-0 rounded-lg border px-3 text-sm"
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

      {/* Filtre + sayaç + toplu yükleme */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="bg-muted/50 flex max-w-full min-w-0 flex-wrap gap-0.5 rounded-xl border p-0.5"
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
                "rounded-[0.6rem] px-3 py-1.5 text-xs font-semibold transition-colors pointer-coarse:min-h-10",
                filter === v
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {canManage && (
          <Button
            type="button"
            className="ml-auto"
            onClick={uploadSelected}
            disabled={bulkUploading || selectedCount === 0}
          >
            {bulkUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            {bulkUploading
              ? "Yükleniyor…"
              : `Seçilenleri Etsy'ye Yükle (${items.filter((i) => i.isSelected && !i.etsyUploadedAt).length})`}
          </Button>
        )}
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
                img.isSelected && "ring-2 ring-[color:var(--gold,#B89347)]",
              )}
              style={{
                borderColor: img.isSelected ? "var(--gold,#B89347)" : LINE,
                aspectRatio: "1 / 1",
              }}
            >
              <button
                type="button"
                onClick={() => setLightboxId(img.id)}
                className="block size-full cursor-zoom-in"
                aria-label={`Büyüt: ${img.title || "üretilen görsel"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    thumbFailed.has(img.id)
                      ? img.sourceUrl
                      : img.thumbUrl || img.sourceUrl
                  }
                  alt={img.title || "Üretilen görsel"}
                  loading="lazy"
                  decoding="async"
                  onError={() =>
                    setThumbFailed((s) => {
                      if (s.has(img.id)) return s;
                      const n = new Set(s);
                      n.add(img.id);
                      return n;
                    })
                  }
                  className="size-full object-cover"
                />
              </button>
              {/* rozetler — altın zeminde koyu metin (AA); yüklendi jade+beyaz */}
              <span className="absolute top-2 left-2 flex flex-col items-start gap-1">
                {img.isSelected && (
                  <span className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    <Star className="size-3 fill-current" /> Seçili
                  </span>
                )}
                {img.etsyUploadedAt && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ background: "var(--jade,#2F5D50)" }}
                  >
                    <CheckCircle2 className="size-3" /> Etsy&apos;de
                  </span>
                )}
              </span>
              {uploading.has(img.id) && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="size-6 animate-spin text-white" />
                </span>
              )}
              {/* aksiyonlar — hover'da; dokunmatikte (hover yok) hep görünür */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 pointer-coarse:opacity-100 focus-within:opacity-100">
                <IconBtn
                  label={img.isSelected ? "Seçimi kaldır" : "Seç"}
                  onClick={() => toggle(img)}
                  active={img.isSelected}
                >
                  <Star
                    className={cn("size-4", img.isSelected && "fill-current")}
                  />
                </IconBtn>
                <a
                  href={`/api/gorsel/indir?id=${img.id}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg bg-white/90 text-neutral-800 pointer-coarse:size-11 hover:bg-white"
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

      {/* Lightbox — Radix Dialog: Escape, odak tuzağı ve scroll kilidi hazır */}
      <Dialog
        open={lightbox != null}
        onOpenChange={(open) => !open && setLightboxId(null)}
      >
        {lightbox && (
          <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
            <DialogTitle className="sr-only">
              {lightbox.title || "Üretilen görsel"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Üretilen görselin büyük önizlemesi; seçme ve indirme eylemleri.
            </DialogDescription>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.sourceUrl}
              alt={lightbox.title || "Üretilen görsel"}
              className="max-h-[62vh] w-full bg-black object-contain"
            />
            <div className="flex flex-col gap-3 p-4">
              {lightbox.title && (
                <p className="font-semibold">{lightbox.title}</p>
              )}
              {lightbox.prompt && (
                <p className="text-muted-foreground max-h-24 overflow-y-auto font-mono text-[11px] leading-relaxed break-words">
                  {lightbox.prompt}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={lightbox.isSelected ? "default" : "outline"}
                  onClick={() => toggle(lightbox)}
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
                {canManage &&
                  (lightbox.etsyUploadedAt ? (
                    <Button type="button" variant="outline" disabled>
                      <CheckCircle2 className="size-4" /> Etsy&apos;de yüklü
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading.has(lightbox.id)}
                      onClick={() =>
                        uploadOne(lightbox).then(
                          (r) =>
                            r === "ok" &&
                            toast.success("Görsel Etsy'ye yüklendi."),
                        )
                      }
                    >
                      {uploading.has(lightbox.id) ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <UploadCloud className="size-4" />
                      )}
                      Etsy&apos;ye Yükle
                    </Button>
                  ))}
                <Button asChild variant="ghost">
                  <a
                    href={lightbox.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-4" /> Yeni sekmede aç
                  </a>
                </Button>
                {canManage && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => remove(lightbox)}
                  >
                    <Trash2 className="size-4" /> Kaldır
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
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
        "inline-flex size-9 items-center justify-center rounded-lg transition-colors pointer-coarse:size-11",
        active
          ? "bg-accent text-accent-foreground"
          : "bg-white/90 text-neutral-800 hover:bg-white",
      )}
    >
      {children}
    </button>
  );
}
