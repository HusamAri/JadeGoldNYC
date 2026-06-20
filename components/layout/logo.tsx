import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-9 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground ring-1 ring-accent/60",
        className,
      )}
      aria-hidden
    >
      <span className="text-sm tracking-tight">JG</span>
    </div>
  );
}
