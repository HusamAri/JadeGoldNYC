import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // lbtn formu (Liquid/04) — pill, index yüzü (mono 12px, .1em tracking,
  // uppercase); dolgu varyantlarında hover'da ::before katmanı ALTTAN yükselir
  // (translateY(100%)→0, .5s ease-premium); ghost/link'te alt çizgi scaleX(0→1).
  // ASİMETRİK BASMA FİZİĞİ: transform hızlı iner (--motion-press-in, :active),
  // yavaş + hafif yaylanarak kalkar (--motion-press-out / --ease-press-out).
  // Renk/gölge kendi (daha uzun) sürelerinde kalır — bu yüzden süre ve easing
  // per-property listelenir. `will-change` KALICI değil: yalnız hover'da
  // katman terfisi (109 düğmeyi sürekli kompozitöre almak bütçe md.7 ihlali).
  "relative isolate inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-mono text-xs font-medium tracking-[0.1em] uppercase transition-[color,background-color,border-color,box-shadow,transform] [transition-duration:450ms,450ms,450ms,300ms,var(--motion-press-out)] [transition-timing-function:var(--ease-premium),var(--ease-premium),var(--ease-premium),var(--ease-premium),var(--ease-press-out)] active:[transition-duration:var(--motion-press-in)] hover:will-change-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/60 focus-visible:ring-[3px] focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 cursor-pointer",
  {
    variants: {
      variant: {
        /** Kahraman CTA — grad-holo pill + glow (Spatial nav pill: 0 0 24px
            rgb(157 140 255/.35) + lift-sm). Hover'da mürekkep dolgu ALTTAN
            yükselir (lbtn.gold dili: dolgu --primary, metin beyaza döner). */
        default:
          "jg-ink-origin [--mx:50%] [--my:50%] overflow-hidden border border-transparent [background-image:var(--btn-hero-bg)] text-[color:var(--btn-hero-fg)] shadow-[0_6px_22px_-4px_rgb(157_140_255/0.45),var(--lift-sm)] before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-primary before:translate-y-full before:transition-transform before:duration-500 before:ease-[var(--ease-premium)] hover:before:translate-y-0 hover:text-primary-foreground hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-4px_rgb(157_140_255/0.5),var(--lift)] active:translate-y-0 active:scale-[0.97] dark:shadow-[0_6px_22px_-4px_rgb(169_155_255/0.4),var(--lift-sm)] dark:hover:shadow-[0_10px_28px_-4px_rgb(205_214_255/0.45),var(--lift)]",
        /** Dolu tehlike pill'i — lbtn.gold deseni: dolgu sabit, hover'da bir
            ton koyusu alttan dolar, metin beyaz kalır. */
        destructive:
          "jg-ink-origin [--mx:50%] [--my:50%] overflow-hidden border border-transparent bg-destructive text-destructive-foreground shadow-[var(--lift-sm)] before:absolute before:inset-0 before:-z-10 before:rounded-full before:[background:color-mix(in_srgb,var(--destructive)_72%,black)] before:translate-y-full before:transition-transform before:duration-500 before:ease-[var(--ease-premium)] hover:before:translate-y-0 hover:-translate-y-0.5 hover:shadow-[var(--lift)] active:translate-y-0 active:scale-[0.97]",
        /** lbtn (Liquid/04 birebir): şeffaf zemin + 1px mürekkep border;
            hover'da mürekkep dolgu alttan yükselir, metin zemin rengine döner. */
        outline:
          "jg-ink-origin [--mx:50%] [--my:50%] overflow-hidden border border-foreground bg-transparent text-foreground before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-foreground before:translate-y-full before:transition-transform before:duration-500 before:ease-[var(--ease-premium)] hover:before:translate-y-0 hover:text-background hover:-translate-y-0.5 hover:shadow-[var(--lift-sm)] active:translate-y-0 active:scale-[0.97]",
        secondary:
          "jg-ink-origin [--mx:50%] [--my:50%] overflow-hidden border border-foreground bg-transparent text-foreground before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-foreground before:translate-y-full before:transition-transform before:duration-500 before:ease-[var(--ease-premium)] hover:before:translate-y-0 hover:text-background hover:-translate-y-0.5 hover:shadow-[var(--lift-sm)] active:translate-y-0 active:scale-[0.97]",
        /** lbtn.link dili — bordersız; hover'da 1px alt çizgi soldan dolar.
            Basışta opaklık DÜŞMEZ (soluk düğme "devre dışı" okunur) — dolgu
            varyantlarıyla aynı fizikte kısa bir basılma yaşar. Zeminsiz
            olduğu için jg-ink-origin YOK (hale kutu dışına taşardı). */
        ghost:
          "text-foreground before:absolute before:left-1.5 before:right-1.5 before:bottom-1.5 before:h-px before:bg-foreground before:origin-left before:scale-x-0 before:transition-transform before:duration-[400ms] before:ease-[var(--ease-premium)] hover:before:scale-x-100 active:scale-[0.97]",
        link: "text-primary before:absolute before:left-1.5 before:right-1.5 before:bottom-1.5 before:h-px before:bg-primary before:origin-left before:scale-x-0 before:transition-transform before:duration-[400ms] before:ease-[var(--ease-premium)] hover:before:scale-x-100 active:scale-[0.97]",
      },
      size: {
        default: "h-10 px-5 py-2 has-[>svg]:px-4",
        sm: "h-8 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 px-7 text-[13px] has-[>svg]:px-5",
        icon: "size-10",
        /** Büyük dairesel FAB — kabartmalı, tam yuvarlak, iri ikon. */
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
