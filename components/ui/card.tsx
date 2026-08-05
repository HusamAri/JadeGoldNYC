import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * `interactive`: kart GERÇEKTEN tıklanabilir mi (Link/onClick ile sarılı)?
 * Varsayılan `false` — statik yüzey kıpırdamaz. Daha önce her kart hover'da
 * yükseliyordu; bu, tıklanamayan kartların "tıklanabilirim" yalanı söylemesi
 * demekti. Işık cevabı (gölge derinleşmesi) kalır, YER DEĞİŞTİRME kalkar.
 * `true` → .jg-tactile sözleşmesi: hover'da kalkar, basışta yüzeye oturur,
 * cursor:pointer, klavye odağında halka. Geçişleri jg-tactile'ın kendisi
 * yönetir (asimetrik basma fiziği) — bu yüzden interactive'de utility
 * transition YAZILMAZ; yazılsaydı utilities katmanı jg-tactile'ı ezip
 * fiziği 300ms'e düzlerdi.
 */
function Card({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      data-slot="card"
      data-interactive={interactive ? "true" : undefined}
      className={cn(
        "text-card-foreground relative flex flex-col gap-7 rounded-[1.75rem] border py-7",
        interactive
          ? // • active:[transform:translateY(0)] — jg-tactile'ın basış
            //   transform'undaki `scale(0.995)`i İPTAL eder: Card bir
            //   backdrop-filter taşıyıcısıdır, bütçe backdrop-filter'lı öğenin
            //   ölçeklenmesini yasaklar (bulanık zeminin yeniden üretilmesi).
            //   Oturma hissini translateY zaten anlatıyor.
            // • Odak halkası box-shadow değil OUTLINE: kartın shadow utility'si
            //   (utilities katmanı) components-katmanı gölgelerini ezerdi →
            //   halka hiç görünmezdi. Outline gölgeyle yarışmaz, radius'u
            //   takip eder. focus-within kartın KENDİ odağını da kapsar.
            "jg-tactile active:[transform:translateY(0)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:[outline-color:color-mix(in_srgb,var(--ring)_70%,transparent)]"
          : // Shadow settle — cam durur, yalnız ışık cevap verir.
            "transition-[box-shadow,background-color] duration-300 ease-[var(--ease-quiet)]",
        "[background-color:var(--glass)] [background-image:var(--glass-sheen)] [border-color:var(--glass-border)] [backdrop-filter:var(--glass-filter)] shadow-[var(--lift-natural),var(--glass-highlight)] hover:shadow-[var(--lift-natural-lg),var(--glass-highlight)]",
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
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-7 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
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
      className={cn("leading-none font-semibold tracking-tight", className)}
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
    <div data-slot="card-content" className={cn("px-7", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-7 [.border-t]:pt-6", className)}
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
