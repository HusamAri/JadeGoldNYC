import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Hap (pill) rozet — sayısal içerik tabular (mono okuma dili).
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow,background-color] duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        /** Dolgu rozet — kabartılı; koyu modda hafif dış ışıma (Lume). */
        default:
          "border-transparent bg-primary text-primary-foreground shadow-[var(--shadow-raised-sm)] [a&]:hover:bg-primary/90 dark:shadow-[var(--shadow-raised-sm),0_0_14px_rgb(255_255_255/0.12)]",
        /** Nötr kabartı hap — konveks yüzey + raised-sm gölge. */
        secondary:
          "border-transparent bg-secondary [background-image:var(--nm-convex)] text-secondary-foreground shadow-[var(--shadow-raised-sm)] [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white shadow-[var(--shadow-raised-sm)] [a&]:hover:bg-destructive/90",
        /** Cam çip — hairline kenar + sheen, ortamın üstünde süzülür. */
        outline:
          "border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--glass-sheen)] [backdrop-filter:var(--glass-filter-sm)] shadow-[var(--lift-sm)] text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-primary/15 text-primary [a&]:hover:bg-primary/25",
        warning:
          "border-transparent bg-accent text-accent-foreground [a&]:hover:bg-accent/80",
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
