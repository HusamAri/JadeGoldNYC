"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Server-action <form> submit'i için pending-farkında buton. useFormStatus,
 * form gönderimi uçarken pending=true döndürür → butonu disable eder (çift-tık
 * önlenir) ve bir spinner gösterir (kullanıcıya "işleniyor" geri bildirimi).
 * Yalnız bir <form> ALTINDA kullanılmalı (useFormStatus sözleşmesi).
 */
export function SubmitButton({
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
