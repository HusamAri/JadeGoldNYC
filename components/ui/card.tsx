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
        // V7: düz sis yüzeyi + hairline; gölge yok, cam yok. Derinlik yalnız
        // göstergelerde (.bezel) yaşar; kart yalnız sınır çizer.
        "text-card-foreground bg-card relative flex flex-col gap-6 rounded-[20px] border border-[color:var(--rule)] py-6",
        interactive
          ? "jg-tactile cursor-pointer hover:border-[color:var(--hairline)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:[outline-color:color-mix(in_srgb,var(--ring)_70%,transparent)]"
          : "transition-[border-color] duration-300 ease-[var(--ease-quiet)]",
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
      className={cn("h-serif text-[22px] leading-none", className)}
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
