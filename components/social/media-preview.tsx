"use client";

import { useState } from "react";
import { ExternalLink, Film, ImageOff, Link2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Link → inline medya önizleme.
 *
 * Panel dosya BARINDIRMAZ; kullanıcının yapıştırdığı linki türüne göre çizer:
 *  - doğrudan görsel dosyası  → <img>
 *  - doğrudan video dosyası   → <video controls>
 *  - Google Drive dosya linki → Drive'ın kendi /preview iframe'i (görsel de
 *    video da oynar; dosya "linki olan görebilir" paylaşımında olmalı)
 *  - Instagram/TikTok/Pinterest → hotlink engellidir, embed dış script ister →
 *    dürüst davranıp link çipi basılır
 *  - bilinmeyen link → <img> denenir; yüklenemezse link çipine düşer
 */

type MediaKind = "image" | "video" | "drive" | "platform" | "unknown";

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif|svg)(\?|#|$)/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;
const PLATFORM_RE =
  /(^|\.)(instagram\.com|tiktok\.com|pinterest\.[a-z.]+|youtube\.com|youtu\.be|facebook\.com|x\.com|twitter\.com)$/i;

/** Drive linkinden dosya id'si — file/d/<id>, ?id=<id> ve uc?id=<id> biçimleri. */
export function driveFileId(url: URL): string | null {
  if (!/(^|\.)drive\.google\.com$/i.test(url.hostname)) return null;
  const path = url.pathname.match(/\/file\/d\/([\w-]+)/);
  if (path) return path[1];
  const q = url.searchParams.get("id");
  return q && /^[\w-]+$/.test(q) ? q : null;
}

export function classifyMediaUrl(raw: string): {
  kind: MediaKind;
  src: string;
} {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "platform", src: raw };
  }
  const driveId = driveFileId(url);
  if (driveId) {
    return {
      kind: "drive",
      src: `https://drive.google.com/file/d/${driveId}/preview`,
    };
  }
  if (PLATFORM_RE.test(url.hostname)) return { kind: "platform", src: raw };
  if (VIDEO_RE.test(url.pathname)) return { kind: "video", src: raw };
  if (IMAGE_RE.test(url.pathname)) return { kind: "image", src: raw };
  return { kind: "unknown", src: raw };
}

function hostLabel(raw: string): string {
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return raw.slice(0, 40);
  }
}

/** Önizlenemeyen link için dürüst çip — yeni sekmede açılır. */
function LinkChip({ url, className }: { url: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "border-input text-muted-foreground hover:text-foreground inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
        className,
      )}
    >
      <Link2 className="size-3.5 shrink-0" />
      <span className="truncate">{hostLabel(url)}</span>
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}

/** Tek link — tam boy önizleme (detay galerisi). */
export function MediaPreview({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const { kind, src } = classifyMediaUrl(url);

  if (kind === "platform" || broken) {
    return <LinkChip url={url} className={className} />;
  }
  if (kind === "drive") {
    return (
      <iframe
        src={src}
        title="Medya önizleme (Google Drive)"
        loading="lazy"
        allow="autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups"
        className={cn(
          "bg-muted aspect-square w-full rounded-xl border-0",
          className,
        )}
      />
    );
  }
  if (kind === "video") {
    return (
      <video
        src={src}
        controls
        playsInline
        preload="metadata"
        onError={() => setBroken(true)}
        className={cn("bg-muted w-full rounded-xl", className)}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn("bg-muted w-full rounded-xl object-cover", className)}
    />
  );
}

/** Kart kapağı — ilk önizlenebilir link, sabit oranlı sessiz kapak. */
export function MediaCover({ urls }: { urls: string[] }) {
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const first = urls.find((u) => {
    if (broken[u]) return false;
    return classifyMediaUrl(u).kind !== "platform";
  });
  const extra = urls.length - 1;

  if (!first) {
    // Yalnız platform linki varsa kapak yerine çip — boş gri kutu basma.
    return urls.length > 0 ? <LinkChip url={urls[0]} /> : null;
  }
  const { kind, src } = classifyMediaUrl(first);

  return (
    <div className="bg-muted relative aspect-video w-full overflow-hidden rounded-xl">
      {kind === "drive" ? (
        <iframe
          src={src}
          title="Medya önizleme (Google Drive)"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          className="h-full w-full border-0"
        />
      ) : kind === "video" ? (
        <video
          src={src}
          muted
          playsInline
          preload="metadata"
          onError={() => setBroken((b) => ({ ...b, [first]: true }))}
          className="h-full w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setBroken((b) => ({ ...b, [first]: true }))}
          className="h-full w-full object-cover"
        />
      )}
      {kind === "video" && (
        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 p-1 text-white">
          <Film className="size-3" />
        </span>
      )}
      {extra > 0 && (
        <span className="absolute right-1.5 bottom-1.5 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] text-white tabular-nums">
          +{extra}
        </span>
      )}
    </div>
  );
}

/** Detay galerisi — tüm linkler; önizlenemeyenler çip olarak en altta. */
export function MediaGallery({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  const rich = urls.filter((u) => classifyMediaUrl(u).kind !== "platform");
  const chips = urls.filter((u) => classifyMediaUrl(u).kind === "platform");
  return (
    <div className="space-y-3">
      {rich.length > 0 && (
        <div
          className={cn(
            "grid gap-3",
            rich.length === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {rich.map((u) => (
            <MediaPreview key={u} url={u} />
          ))}
        </div>
      )}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((u) => (
            <LinkChip key={u} url={u} />
          ))}
        </div>
      )}
      {rich.length === 0 && chips.length === 0 && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <ImageOff className="size-3.5" /> Önizlenebilir medya yok
        </p>
      )}
    </div>
  );
}
