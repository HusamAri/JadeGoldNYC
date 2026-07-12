import * as React from "react";

import { cn } from "@/lib/utils";

// Hem Lucide hem markaya özel Lux ikonlarını kabul eder.
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: IconType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    // Boş durum = zemine bastırılmış nöromorfik oluk (pressed well);
    // içindeki ikon çipi kabartılı (raised) — çift ışık dili.
    <div
      className={cn(
        "nm-pressed flex flex-col items-center justify-center rounded-[1.5rem] p-10 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full shadow-[var(--shadow-raised-sm)] [background-image:var(--nm-convex)]">
          <Icon className="size-6" />
        </div>
      )}
      <h3 className="text-carved text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
