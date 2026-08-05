import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Hap (pill) rozet — lab .badge birebir: index yüzü (mono 10px, .12em
  // tracking, uppercase), 6/12px dolgu; sayısal içerik tabular.
  "inline-flex items-center justify-center rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-[0.12em] uppercase tabular-nums w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow,background-color] duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        /** Vurgu rozeti — açıkta accent-soft leylak hap; koyuda lume çip:
            oklch(1 0 0/0.12) + lume-hi + lume-glow, beyaz ışımalı metin. */
        default:
          "border-transparent bg-accent text-accent-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_1.5px_rgb(48_42_60/0.14)] [a&]:hover:bg-accent/80 dark:[background-color:oklch(1_0_0/0.12)] dark:text-white dark:shadow-[var(--lume-hi),var(--lume-glow)] dark:[text-shadow:0_0_10px_rgb(255_255_255/0.4)]",
        /** Nötr kabartı hap — konveks yüzey + raised-sm gölge; koyuda sakin lume çip. */
        secondary:
          "border-transparent bg-secondary [background-image:var(--nm-convex)] text-secondary-foreground shadow-[var(--shadow-raised-sm)] [a&]:hover:bg-secondary/90 dark:[background-image:none] dark:[background-color:oklch(1_0_0/0.07)] dark:shadow-[var(--lume-hi)]",
        destructive:
          "border-transparent bg-destructive text-white shadow-[var(--shadow-raised-sm)] [a&]:hover:bg-destructive/90 dark:shadow-[0_0_14px_rgb(238_114_114/0.45)]",
        /** Cam çip — hairline kenar + sheen; koyuda lume rozet (oklch(0 0 0/0.4) + lume-hi). */
        outline:
          "border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] [backdrop-filter:var(--glass-filter-sm)] shadow-[var(--lift-sm)] text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground dark:[background-image:none] dark:[background-color:oklch(0_0_0/0.4)] dark:[border-color:oklch(1_0_0/0.1)] dark:shadow-[var(--lume-hi)]",
        success:
          "border-transparent bg-primary/15 text-primary shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_1.5px_rgb(48_42_60/0.14)] [a&]:hover:bg-primary/25 dark:shadow-[0_0_12px_rgb(169_155_255/0.25)]",
        warning:
          "border-transparent bg-accent text-accent-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_1.5px_rgb(48_42_60/0.14)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.4)] [a&]:hover:bg-accent/80",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
