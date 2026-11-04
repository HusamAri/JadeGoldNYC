import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Hap (pill) rozet — lab .badge birebir: index yüzü (mono 10px, .12em
  // tracking, uppercase), 6/12px dolgu; sayısal içerik tabular.
  "inline-flex items-center justify-center rounded-full border px-3 py-1 font-mono text-[10px] font-medium tracking-[0.12em] uppercase tabular-nums w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--neon)]/40 transition-[color,background-color] duration-200",
  {
    variants: {
      variant: {
        /** Asit hap — tek vurgu (ödendi, +%, yeni). */
        default: "border-transparent bg-neon text-foreground",
        /** Yumuşak çip — bezel yüzey, hafif kabartı (serpiştirilmiş neumorph). */
        secondary: "soft border-transparent text-foreground",
        destructive: "border-transparent bg-destructive text-white",
        /** Hairline çip. */
        outline: "border-[color:var(--rule)] text-ink-2 bg-transparent",
        success: "border-transparent bg-neon/60 text-foreground",
        warning: "border-[color:var(--negative)]/50 text-[color:var(--negative)] bg-transparent",
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
