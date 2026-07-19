import { cn } from "@/lib/utils";

/**
 * Amuletta yay/halka markası — iki hilal + üçgen; negatif alan A.
 * Katmanlar frost/loading animasyonu için ayrı class’larla hedeflenir.
 */
export function AmulettaMark({
  className,
  title = "Amuletta",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("block", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <g className="am-mark-arcs" fill="currentColor">
        <path
          className="am-arc-left"
          d="M38.5 12C20.5 18.5 11.5 34 11.5 48.5C11.5 67 26.5 81 44 81C35.5 81 25.5 71.5 25.5 48.5C25.5 31.5 31.5 18.5 38.5 12Z"
        />
        <path
          className="am-arc-right"
          d="M61.5 12C79.5 18.5 88.5 34 88.5 48.5C88.5 67 73.5 81 56 81C64.5 81 74.5 71.5 74.5 48.5C74.5 31.5 68.5 18.5 61.5 12Z"
        />
        <ellipse className="am-arc-join" cx="50" cy="16.5" rx="5.5" ry="4.2" />
        <path className="am-arc-gem" d="M50 52 L41.5 65.5 L58.5 65.5 Z" />
      </g>
    </svg>
  );
}
