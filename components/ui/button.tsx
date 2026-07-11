import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[box-shadow,transform,background-color,color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 cursor-pointer",
  {
    variants: {
      variant: {
        /** Kahraman CTA — iridesan holo degrade; görünüm başına TEK holo buton.
            Hover'da yüzer (lift), basınca köpüğe gömülür (inset + scale). */
        default:
          "[background-image:var(--grad-holo)] text-[#3a2f5e] shadow-[var(--lift)] hover:-translate-y-0.5 hover:shadow-[var(--lift-lg)] active:translate-y-0 active:scale-[0.97] active:shadow-[var(--shadow-pressed),inset_0_0_0_100px_rgba(0,0,0,0.05)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[var(--shadow-raised-sm)] hover:-translate-y-px hover:shadow-[var(--shadow-hover)] active:translate-y-0 active:scale-[0.96]",
        outline:
          "bg-background text-foreground nm-interactive jg-glow-warm duration-300",
        secondary:
          "bg-background text-foreground nm-interactive jg-glow-warm duration-300",
        ghost:
          "text-foreground hover:bg-foreground/5 active:scale-[0.94] active:bg-foreground/10",
        link: "text-primary underline-offset-4 hover:underline active:opacity-70",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 px-7 text-[0.95rem] has-[>svg]:px-5",
        icon: "size-10",
        /** Büyük dairesel FAB — bkz. IMG_5673 (kabartmalı, tam yuvarlak, iri ikon). */
        fab: "size-14 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
