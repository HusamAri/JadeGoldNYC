"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Loader2, Mail, Save, Send } from "lucide-react";

import {
  sendDigestNow,
  setDigestContentPrefs,
  setDigestEnabled,
  setDigestRecipients,
} from "@/app/(dashboard)/ayarlar/gunluk-ozet/actions";
import { formatDigestEmailList } from "@/lib/digest/emails";
import {
  DIGEST_ACTION_LEVEL_META,
  DIGEST_SECTION_KEYS,
  DIGEST_SECTION_META,
  type DigestActionLevel,
  type DigestContentPrefs,
  type DigestSectionKey,
} from "@/lib/digest/preferences";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const ACTION_LEVELS: DigestActionLevel[] = ["kritik", "onemli", "all"];

export function DigestSettingsCard({
  enabled,
  emails,
  contentPrefs,
  canManage,
  emailConfigured,
}: {
  enabled: boolean;
  emails: string[];
  contentPrefs: DigestContentPrefs;
  canManage: boolean;
  emailConfigured: boolean;
}) {
  const [on, setOn] = useState(enabled);
  const [listText, setListText] = useState(formatDigestEmailList(emails));
  const [sections, setSections] = useState(contentPrefs.sections);
  const [actionLevel, setActionLevel] = useState(contentPrefs.actionLevel);
  const [pending, start] = useTransition();
  const [savingList, startSaveList] = useTransition();
  const [savingContent, startSaveContent] = useTransition();
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

  function saveList() {
    if (!canManage) {
      toast.error("Yalnız owner/admin değiştirebilir.");
      return;
    }
    startSaveList(async () => {
      const res = await setDigestRecipients(listText);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setListText(formatDigestEmailList(res.emails ?? []));
      toast.success(
        (res.emails?.length ?? 0) > 0
          ? `Alıcı listesi kaydedildi (${res.emails!.length}).`
          : "Liste boş — org üyelerine gönderilir.",
      );
    });
  }

  function toggleSection(key: DigestSectionKey) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function saveContent() {
    if (!canManage) {
      toast.error("Yalnız owner/admin değiştirebilir.");
      return;
    }
    if (!DIGEST_SECTION_KEYS.some((k) => sections[k])) {
      toast.error("En az bir bölüm açık olmalı.");
      return;
    }
    startSaveContent(async () => {
      const res = await setDigestContentPrefs({ sections, actionLevel });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.sections) setSections(res.sections);
      if (res.actionLevel) setActionLevel(res.actionLevel);
      toast.success("İçerik tercihleri kaydedildi.");
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
            Satış, reklam, uyarılar, fiyat önerileri, ilgilenme skoru ve ekip
            paneli — marka renkleriyle HTML brifing.
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

      <div className="space-y-2">
        <Label htmlFor="digest-emails">Alıcı e-postaları</Label>
        <Textarea
          id="digest-emails"
          value={listText}
          onChange={(e) => setListText(e.target.value)}
          disabled={!canManage || savingList}
          rows={5}
          placeholder={"ornek@sirket.com\nbaska@sirket.com"}
          className="font-mono text-sm"
        />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Her satıra bir adres (veya virgülle ayır). Doluysa yalnız bu listeye
          gider; boş bırakırsan org üyelerine (e-postası olanlara) gider.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={!canManage || savingList}
          onClick={saveList}
        >
          {savingList ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Listeyi kaydet
        </Button>
      </div>

      <div className="space-y-4 rounded-2xl border p-4">
        <div className="space-y-1">
          <p className="text-base font-medium">Neler gelsin</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Raporda hangi blokların duracağını seç. Kapalı bölüm mailde hiç
            görünmez; bir sonraki cron veya “Şimdi gönder” ile uygulanır.
          </p>
        </div>

        <ul className="space-y-3">
          {DIGEST_SECTION_KEYS.map((key) => {
            const meta = DIGEST_SECTION_META[key];
            const checked = sections[key];
            return (
              <li key={key}>
                <label
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-xl border px-3 py-3 transition-colors",
                    checked
                      ? "border-primary/30 bg-primary/5"
                      : "border-transparent bg-muted/30 hover:bg-muted/50",
                    !canManage && "cursor-not-allowed opacity-70",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 accent-primary"
                    checked={checked}
                    disabled={!canManage || savingContent}
                    onChange={() => toggleSection(key)}
                  />
                  <span className="min-w-0 space-y-0.5">
                    <span className="block text-sm font-medium">
                      {meta.label}
                    </span>
                    <span className="text-muted-foreground block text-xs leading-relaxed">
                      {meta.description}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2">
          <Label>Aksiyon eşiği</Label>
          <p className="text-muted-foreground text-xs leading-relaxed">
            “Aksiyon bekleyenler” açıkken hangi önem seviyesinin listeleneceği.
          </p>
          <div className="flex flex-wrap gap-1 rounded-full border p-1">
            {ACTION_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                disabled={!canManage || savingContent || !sections.actions}
                onClick={() => setActionLevel(level)}
                title={DIGEST_ACTION_LEVEL_META[level].description}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  actionLevel === level
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                  !sections.actions && "opacity-50",
                )}
              >
                {DIGEST_ACTION_LEVEL_META[level].label}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            {DIGEST_ACTION_LEVEL_META[actionLevel].description}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!canManage || savingContent}
          onClick={saveContent}
        >
          {savingContent ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          İçeriği kaydet
        </Button>
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
          İçerik blokları yukarıdaki tercihlerle seçilir. “Neler oldu” yalnız
          kullanıcı işlemlerini gösterir; sistem/cron hariç.
        </li>
        <li>
          Panel süresi audit olaylarından yaklaşık hesaplanır (gerçek oturum
          sayacı değil).
        </li>
        <li className="flex items-center gap-1.5">
          <Mail className="size-3.5" />
          Konu satırı marka + gelir + kritik + ilgilenme skoru taşıyabilir.
        </li>
      </ul>
    </div>
  );
}
