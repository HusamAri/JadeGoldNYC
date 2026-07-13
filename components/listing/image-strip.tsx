import Image from "next/image";
import { ImageOff } from "lucide-react";

import type { ListingImage } from "@/lib/etsy/images";
import { cn } from "@/lib/utils";

/**
 * Listing görsel şeridi — canlı Etsy görselleri yan yana yatay kaydırmalı
 * şeritte. Canlı görsel yoksa yerel kapak (image_url), o da yoksa zarif boş
 * durum. Sunucu bileşeni (salt sunum).
 */
export function ImageStrip({
  images,
  fallbackUrl,
  title,
}: {
  images: ListingImage[];
  fallbackUrl: string | null;
  title: string;
}) {
  const live = images
    .map((img) => ({
      src: img.url_570xN ?? img.url_fullxfull ?? img.url_75x75,
      full: img.url_fullxfull ?? img.url_570xN ?? img.url_75x75,
      rank: img.rank,
    }))
    .filter((img): img is { src: string; full: string; rank: number } =>
      Boolean(img.src),
    );

  if (live.length === 0 && !fallbackUrl) {
    return (
      <div className="nm-pressed flex flex-col items-center justify-center gap-2 rounded-[1.5rem] p-10 text-center">
        <div className="text-muted-foreground flex size-12 items-center justify-center rounded-full shadow-[var(--shadow-raised-sm)] [background-image:var(--nm-convex)]">
          <ImageOff className="size-6" />
        </div>
        <p className="text-sm font-semibold">Görsel yok</p>
        <p className="text-muted-foreground max-w-sm text-sm">
          Canlı Etsy görselleri için Etsy bağlantısı gerekir; bu listing&apos;in
          panelde kayıtlı kapak görseli de yok.
        </p>
      </div>
    );
  }

  if (live.length === 0 && fallbackUrl) {
    return (
      <div className="space-y-2">
        <Thumb src={fallbackUrl} alt={title} label="kapak" />
        <p className="text-muted-foreground text-xs">
          Canlı Etsy görselleri yüklenemedi — panelde kayıtlı kapak görseli
          gösteriliyor.
        </p>
      </div>
    );
  }

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {live.map((img) => (
        <a
          key={`${img.rank}-${img.src}`}
          href={img.full}
          target="_blank"
          rel="noreferrer noopener"
          className="group shrink-0"
          title="Tam boyutu yeni sekmede aç"
        >
          <Thumb
            src={img.src}
            alt={`${title} — görsel ${img.rank}`}
            label={String(img.rank).padStart(2, "0")}
            className="transition-transform duration-300 ease-[var(--ease-premium)] group-hover:-translate-y-0.5"
          />
        </a>
      ))}
    </div>
  );
}

function Thumb({
  src,
  alt,
  label,
  className,
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted relative size-40 overflow-hidden rounded-2xl border shadow-[var(--lift-sm)] sm:size-48",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="192px"
        unoptimized
      />
      {/* Sıra etiketi — mono index çipi (Amuletta idx dili). */}
      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-white uppercase tabular-nums">
        {label}
      </span>
    </div>
  );
}
