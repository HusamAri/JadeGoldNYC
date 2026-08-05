"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Server-action <form> submit'i için pending-farkında buton.
 *
 * Tasarım kararları (hepsi "dondu hissi = geri bildirim eksikliği" tezinden):
 *
 * 1. Spinner etiketin YANINA değil ÜSTÜNE biner. Yan yana dizilseydi buton
 *    genişlerdi ve etiket tıklama anında kayardı — kullanıcı "yanlış yere
 *    bastım" hissi yaşar. İçerik `opacity-0` olur, ölçüsü yerinde kalır.
 * 2. Bekleyen buton `disabled` DEĞİL, `aria-disabled` + tıklama muhafızıdır.
 *    Native `disabled` Button'ın `disabled:opacity-50`'sini tetikler ve düğme
 *    "bozuldu/pasif" okunur; oysa durum "çalışıyor"dur. `.jg-busy` opaklığı
 *    korur, imleci `progress` yapar. Çift-tık yine engellenir (guard).
 *    Çağıranın KENDİ `disabled`'ı (doğrulama vb.) native kalır — o gerçekten
 *    devre dışıdır.
 * 3. `pending` prop'u: useFormStatus olmadan (useTransition ile) çalışan
 *    çağıranlar da aynı bekleme diline bağlanabilsin diye.
 *
 * Yalnız bir <form> ALTINDA kullanılırsa useFormStatus dolar; dışarıda
 * `pending` prop'u ile kullanılabilir.
 */
export function SubmitButton({
  children,
  className,
  disabled,
  pending: pendingProp,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & { pending?: boolean }) {
  const { pending: formPending } = useFormStatus();
  const busy = formPending || pendingProp === true;

  return (
    <Button
      type="submit"
      // Yalnız çağıranın kendi disabled'ı native devre dışı bırakır.
      disabled={disabled}
      aria-disabled={busy || undefined}
      aria-busy={busy || undefined}
      className={cn("jg-busy", className)}
      onClick={(e) => {
        if (busy) {
          // Gönderim uçarken ikinci submit'i durdur (çift kayıt önlenir).
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick?.(e);
      }}
      {...props}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2",
          busy && "opacity-0",
        )}
      >
        {children}
      </span>
      {busy && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <Loader2 className="size-4 animate-spin" />
        </span>
      )}
      {/* Hareket kısıtlı kullanıcıda spinner donar; ilerleme sinyali metinde
          yaşamaya devam eder (ekran okuyucu + aria-busy ile birlikte). */}
      {busy && <span className="sr-only">İşleniyor…</span>}
    </Button>
  );
}
