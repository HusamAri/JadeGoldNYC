"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  CloudUpload,
  Link2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import type { ListingImage } from "@/lib/types";
import {
  addListingImageUpload,
  addListingImageUrl,
  overwriteListingImageOnEtsy,
  removeListingImage,
  reorderListingImages,
  type ListingImageResult,
} from "@/app/(dashboard)/tasarimlar/listing/[id]/image-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SOURCE_LABEL: Record<ListingImage["source"], string> = {
  upload: "yükleme",
  drive: "drive",
  url: "url",
};

export function ListingImageManager({
  productId,
  images,
  etsyLinked,
}: {
  productId: string;
  images: ListingImage[];
  etsyLinked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function run(
    fn: () => Promise<ListingImageResult>,
    okMsg: string,
    after?: () => void,
  ) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.needsReconnect) {
        toast.error("Etsy yazma bağlantısını yeniden kurun.");
        return;
      }
      toast.success(okMsg);
      after?.();
      router.refresh();
    });
  }

  function onUpload(file: File) {
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("file", file);
    run(() => addListingImageUpload(fd), "Görsel eklendi", () => {
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  function onAddUrl() {
    if (!url.trim()) return;
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("url", url.trim());
    run(() => addListingImageUrl(fd), "Görsel eklendi", () => setUrl(""));
  }

  function move(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= images.length) return;
    const ids = images.map((i) => i.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    run(() => reorderListingImages(productId, ids), "Sıra güncellendi");
  }

  return (
    <div className="space-y-4">
      {/* Ekleme araçları */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="size-4" />
          Görsel yükle
        </Button>
        <div className="flex flex-1 items-center gap-2">
          <Input
            type="url"
            inputMode="url"
            placeholder="Görsel URL'i (Drive önizleme veya doğrudan link)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddUrl();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending || !url.trim()}
            onClick={onAddUrl}
          >
            <Link2 className="size-4" />
            Ekle
          </Button>
        </div>
      </div>

      {/* Galeri */}
      {images.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm">
          Bu listing&apos;e henüz görsel eklenmedi. Yükleyin veya bir URL ekleyin;
          ekledikten sonra sırayı ok tuşlarıyla değiştirebilirsiniz.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, index) => (
            <div
              key={img.id}
              className="group bg-muted relative overflow-hidden rounded-2xl border shadow-[var(--lift-sm)]"
            >
              <div className="relative aspect-square w-full">
                <Image
                  src={img.url}
                  alt={img.alt ?? `Listing görseli ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="192px"
                  unoptimized
                />
                <span className="absolute top-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-white uppercase tabular-nums">
                  {String(index + 1).padStart(2, "0")} · {SOURCE_LABEL[img.source]}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                <div className="flex gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={pending || index === 0}
                    onClick={() => move(index, -1)}
                    title="Öne al"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span className="sr-only">Öne al</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={pending || index === images.length - 1}
                    onClick={() => move(index, 1)}
                    title="Geri al"
                  >
                    <ArrowRight className="size-3.5" />
                    <span className="sr-only">Geri al</span>
                  </Button>
                </div>
                <div className="flex gap-0.5">
                  {etsyLinked && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () =>
                            overwriteListingImageOnEtsy(
                              productId,
                              img.id,
                              index + 1,
                            ),
                          `Etsy'de ${String(index + 1).padStart(2, "0")}. görsel güncellendi`,
                        )
                      }
                      title="Etsy'ye gönder"
                    >
                      <CloudUpload className="size-3.5" />
                      <span className="sr-only">Etsy&apos;ye gönder</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive size-7"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => removeListingImage(img.id, productId),
                        "Görsel çıkarıldı",
                      )
                    }
                    title="Çıkar"
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Çıkar</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
