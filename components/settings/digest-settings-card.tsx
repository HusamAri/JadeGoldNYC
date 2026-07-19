"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Loader2, Mail, Send } from "lucide-react";

import {
  sendDigestNow,
  setDigestEnabled,
} from "@/app/(dashboard)/ayarlar/gunluk-ozet/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DigestSettingsCard({
  enabled,
  canManage,
  emailConfigured,
}: {
  enabled: boolean;
  canManage: boolean;
  emailConfigured: boolean;
}) {
  const [on, setOn] = useState(enabled);
  const [pending, start] = useTransition();
  const [sending, startSend] = useTransition();

  function toggle(next: boolean) {
    if (!canManage) {
      toast.error("Yalnız owner/admin değiştirebilir.");
      return;
    }
    const prev = on;
    setOn(next);
    start(async () => {
      const res = await setDigestEnabled(next);
      if (res.error) {
        setOn(prev);
        toast.error(res.error);
        return;
      }
      toast.success(next ? "Günlük özet açık." : "Günlük özet kapalı.");
    });
  }

  function sendTest() {
    startSend(async () => {
      const res = await sendDigestNow();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Özet gönderildi (${res.recipients ?? 0} alıcı). Gelen kutusunu kontrol et.`,
      );
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-base font-medium">Her sabah e-posta özeti</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Son 24 saatin satışları, aksiyon bekleyenler, öneriler, olan/biten
            olaylar ve 7 günlük gidişat — marka renkleriyle HTML mail. Alıcılar:
            org’daki tüm üyeler (e-postası olanlar).
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-full border p-1">
          <button
            type="button"
            disabled={!canManage || pending}
            onClick={() => toggle(true)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              on
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Açık
          </button>
          <button
            type="button"
            disabled={!canManage || pending}
            onClick={() => toggle(false)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              !on
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Kapalı
          </button>
        </div>
      </div>

      {!emailConfigured && (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Gönderim için Gmail SMTP (
          <code className="font-mono text-xs">SMTP_USER</code> +{" "}
          <code className="font-mono text-xs">SMTP_PASS</code> App Password) veya
          Resend gerekir. Yokken cron inert kalır.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/api/digest/preview" target="_blank">
            <ExternalLink className="size-4" />
            HTML önizleme
          </Link>
        </Button>
        <Button
          type="button"
          disabled={!canManage || !emailConfigured || sending || !on}
          onClick={sendTest}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Şimdi gönder
        </Button>
      </div>

      <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
        <li>
          Zamanlama: her gün 11:00 UTC (New York sabahı civarı), senkron
          cron’larından sonra.
        </li>
        <li>
          İçerik: gelir/sipariş (24s + önceki 24s), 7 günlük trend, kritik
          aksiyonlar, reklam önerileri, denetim + biten görevler.
        </li>
        <li className="flex items-center gap-1.5">
          <Mail className="size-3.5" />
          Konu satırı marka adı + gelir + kritik sayısı taşır.
        </li>
      </ul>
    </div>
  );
}
