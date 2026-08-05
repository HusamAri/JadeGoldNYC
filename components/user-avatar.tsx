/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

function initials(name?: string | null, email?: string | null) {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  const txt =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return txt.toUpperCase();
}

/** Kullanıcı avatarı — görsel varsa, yoksa baş harf rozeti (kabarık).
    Kişi-pin modu: avatar bir pin cutout'u ise (/pins/, kullanıcı kararı:
    "portre pinleri profil fotoğrafı, BÜYÜK olsun") daire kırpması ve halka
    YOK — cutout tam boy, hafif taşkın ve kaldırma gölgeli çizilir. */
export function UserAvatar({
  src,
  name,
  email,
  className,
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
}) {
  const ring = "shadow-[var(--shadow-raised-sm)]";
  if (src && src.startsWith("/pins/")) {
    return (
      <img
        src={src}
        alt={name || email || "Avatar"}
        className={cn(
          // size-8 çağıranlar için taban; scale ile "büyük" durur, satır
          // yüksekliğini bozmaz. object-contain: portre oranı korunur.
          "size-8 scale-[1.3] object-contain [filter:drop-shadow(0_2px_3px_rgb(48_42_60/0.3))_drop-shadow(0_6px_9px_rgb(48_42_60/0.2))] dark:[filter:drop-shadow(0_2px_4px_rgb(0_0_0/0.55))]",
          className,
        )}
      />
    );
  }
  if (src) {
    return (
      <img
        src={src}
        alt={name || email || "Avatar"}
        className={cn("size-8 rounded-full object-cover", ring, className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "bg-accent text-accent-foreground flex size-8 items-center justify-center rounded-full text-xs font-semibold",
        ring,
        className,
      )}
    >
      {initials(name, email)}
    </span>
  );
}
