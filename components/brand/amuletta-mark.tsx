import { cn } from "@/lib/utils";

/**
 * Amuletta yay/halka — referans negatif-alan A (iki hilal + üçgen).
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
          d="M50 14C30.5 14.5 17 29.5 17 50.5C17 71.5 29.5 86.5 47.5 88.5C41 81 37.5 68.5 37.5 52C37.5 35.5 41.5 23 50 14Z"
        />
        <path
          className="am-arc-right"
          d="M50 14C69.5 14.5 83 29.5 83 50.5C83 71.5 70.5 86.5 52.5 88.5C59 81 62.5 68.5 62.5 52C62.5 35.5 58.5 23 50 14Z"
        />
        <path
          className="am-arc-gem"
          d="M50 56.5 L42.8 70.2 L57.2 70.2 Z"
        />
      </g>
    </svg>
  );
}
