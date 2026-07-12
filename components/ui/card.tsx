import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "text-card-foreground relative flex flex-col gap-6 rounded-[26px] border py-6 transition-[box-shadow,transform] duration-500 ease-[var(--ease-premium)] hover:-translate-y-0.5",
        // Açık: Spatial cam kart — glass zemin + backdrop blur + hairline kenar
        // + lift + üst pah highlight'ı; hover'da yalnız -2px yükselme.
        "[background-color:var(--glass)] [background-image:var(--glass-sheen)] [border-color:var(--glass-border)] [backdrop-filter:var(--glass-filter)] shadow-[var(--lift),var(--glass-highlight)] hover:shadow-[var(--lift-lg),var(--glass-highlight)]",
        // Koyu: Lume hücre (Liquid_Dark .cell birebir) — opak #262935 panel,
        // 1px oklch(1 0 0/0.05) kenar, 0 20px 50px siyah gölge + üst iç highlight.
        "dark:[background-color:var(--lume-panel)] dark:[background-image:none] dark:[backdrop-filter:none] dark:[border-color:oklch(1_0_0/0.05)] dark:shadow-[0_20px_50px_oklch(0_0_0/0.4),inset_0_1px_0_oklch(1_0_0/0.06)] dark:hover:shadow-[0_20px_50px_oklch(0_0_0/0.45),inset_0_1px_0_oklch(1_0_0/0.06)]",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        // Cam/lume panel başlığı — lab .gncard h3 dili: temiz sans 600, sıkı tracking.
        "leading-none font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-6", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
