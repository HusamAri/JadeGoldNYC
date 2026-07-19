import * as React from "react";

import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "text-card-foreground relative flex flex-col gap-6 overflow-hidden rounded-[26px] border py-6",
        // Quiet lift — natural layered shadow; hover rises 1px (not a float jump).
        "transition-[box-shadow,transform] duration-[280ms] ease-[var(--ease-quiet)] will-change-transform",
        "hover:-translate-y-px active:translate-y-0 active:scale-[0.994]",
        // Açık: Spatial cam + doğal gölge + ambient ::before (globals).
        "[background-color:var(--glass)] [background-image:var(--glass-sheen)] [border-color:var(--glass-border)] [backdrop-filter:var(--glass-filter)] shadow-[var(--lift-natural),var(--glass-highlight)] hover:shadow-[var(--lift-natural-lg),var(--glass-highlight)]",
        // Koyu: Lume hücre — yumuşak katmanlı siyah gölge.
        "dark:[background-color:var(--lume-panel)] dark:[background-image:none] dark:[backdrop-filter:none] dark:[border-color:oklch(1_0_0/0.05)] dark:shadow-[var(--lift-natural),inset_0_1px_0_oklch(1_0_0/0.06)] dark:hover:shadow-[var(--lift-natural-lg),inset_0_1px_0_oklch(1_0_0/0.06)]",
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
