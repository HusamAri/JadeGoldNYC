/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

function initials(name?: string | null, email?: string | null) {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  const txt =
    parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return txt.toUpperCase();
}

/** Kullanıcı avatarı — görsel varsa, yoksa baş harf rozeti (kabarık). */
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
