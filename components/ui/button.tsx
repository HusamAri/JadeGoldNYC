import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[box-shadow,transform,background-color,color] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 cursor-pointer",
  {
    variants: {
      variant: {
        /** Kahraman CTA — marka-parametrik: platformda iridesan holo degrade,
            Jade Gold'da özgün jade dolgusu (--btn-hero-*). Hover'da yüzer +
            liquid-fill: alt kenardan yükselen --primary katmanı (after:, metnin
            ALTINDA / holo zeminin ÜSTÜNDE); basınca köpüğe gömülür (inset + scale).
            Koyu modda dolgu hafif dış ışıma taşır (Lume — belli belirsiz). */
        default:
          "relative isolate overflow-hidden [background-image:var(--btn-hero-bg)] text-[color:var(--btn-hero-fg)] shadow-[var(--lift)] after:absolute after:inset-0 after:-z-10 after:rounded-full after:bg-primary after:origin-bottom after:scale-y-0 after:transition-transform after:duration-500 after:ease-[var(--ease-premium)] hover:after:scale-y-100 hover:text-primary-foreground hover:-translate-y-0.5 hover:shadow-[var(--lift-lg)] active:translate-y-0 active:scale-[0.97] active:shadow-[var(--shadow-pressed),inset_0_0_0_100px_rgba(0,0,0,0.05)] dark:hover:shadow-[var(--lift-lg),0_0_14px_rgb(255_255_255/0.28)]",
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
