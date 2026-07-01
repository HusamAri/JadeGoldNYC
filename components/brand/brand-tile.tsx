import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Marka görseli karosu. Arkada jade→altın degrade, üstünde kapak görseli.
 * Görsel yoksa (dosya eklenmemişse) degrade görünür — kırık görsel olmaz.
 * `video` verilirse sessiz, kendiliğinden döngüde oynayan bir klip gösterilir
 * (bu karo kaydırma rayı olmayan tek-ekran sayfalarda kullanılır — ör. giriş
 * ekranı — o yüzden kaydırmaya bağlı sabitleme burada uygulanmaz); `src` her
 * zaman poster/geri dönüş görseli olarak kalır.
 */
export function BrandTile({
  src,
  video,
  className,
  rounded = true,
  scrim = false,
  children,
}: {
  src: string;
  video?: string;
  className?: string;
  rounded?: boolean;
  scrim?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "from-primary via-primary/70 to-accent relative overflow-hidden bg-gradient-to-br",
        rounded && "rounded-xl",
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${src}')` }}
        aria-hidden
      />
      {video && (
        <video
          src={video}
          poster={src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 size-full object-cover"
          aria-hidden
        />
      )}
      {scrim && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
          aria-hidden
        />
      )}
      {children}
    </div>
  );
}
