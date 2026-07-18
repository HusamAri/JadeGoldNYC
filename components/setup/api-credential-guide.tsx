"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, KeyRound } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ApiGuideStep {
  text: string;
  href?: string;
  hrefLabel?: string;
}

export interface ApiGuideItem {
  id: string;
  title: string;
  why: string;
  envVars: string[];
  steps: ApiGuideStep[];
  tip?: string;
}

/**
 * Eksik API / secret için adım adım kurulum rehberi.
 * Env ismi dump etmek yerine: nereye git, neyi kopyala, nereye yapıştır.
 */
export function ApiCredentialGuide({
  items,
  className,
}: {
  items: ApiGuideItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "border-border/70 bg-muted/30 space-y-2 rounded-xl border p-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <KeyRound className="size-4 shrink-0" />
        Bunları bağlamak için anahtar al (adım adım)
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <GuideAccordion key={item.id} item={item} />
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        Anahtarı sohbete yapıştırma. Yalnız `.env.local` (lokal) veya Vercel →
        Settings → Environment Variables (canlı), sonra Redeploy.
      </p>
    </div>
  );
}

function GuideAccordion({ item }: { item: ApiGuideItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-background rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-medium">{item.title}</p>
          <p className="text-muted-foreground text-xs">{item.why}</p>
        </div>
        <ChevronDown
          className={cn(
            "text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="border-t px-3 py-3 space-y-3">
          <p className="text-muted-foreground font-mono text-[11px]">
            Env: {item.envVars.join(" · ")}
          </p>
          <ol className="list-decimal space-y-2 pl-4 text-sm">
            {item.steps.map((step, i) => (
              <li key={i} className="leading-snug">
                <span>{step.text}</span>
                {step.href && (
                  <>
                    {" "}
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-0.5 font-medium underline-offset-2 hover:underline"
                    >
                      {step.hrefLabel ?? "Aç"}
                      <ExternalLink className="size-3" />
                    </a>
                  </>
                )}
              </li>
            ))}
          </ol>
          {item.tip && (
            <p className="text-muted-foreground text-xs">{item.tip}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Anahtar Kelime sayfası için hazır rehberler. */
export const KEYWORD_API_GUIDES = {
  ai: {
    id: "gemini",
    title: "1) Gemini API key (ücretsiz) — AI genişletme",
    why: "Tohum kelimeden daha zengin aday listesi üretir.",
    envVars: ["GOOGLE_GENERATIVE_AI_API_KEY"],
    steps: [
      {
        text: "Google AI Studio’yu aç:",
        href: "https://aistudio.google.com/apikey",
        hrefLabel: "aistudio.google.com/apikey",
      },
      { text: "Google hesabınla giriş yap." },
      { text: "Create API key / Get API key’e tıkla; proje seç veya yeni oluştur." },
      { text: "AIza… ile başlayan anahtarı kopyala." },
      {
        text: "Lokal: proje kökündeki .env.local dosyasına GOOGLE_GENERATIVE_AI_API_KEY=… satırını ekle, kaydet, npm run dev’i yeniden başlat. Canlı: Vercel → Project → Settings → Environment Variables → aynı isimle ekle → Save → Deployments’tan Redeploy.",
      },
      {
        text: "Bu sayfada Araştır’a bas; Kaynaklar’da AI açık görünmeli.",
      },
    ],
    tip: "Fatura bağlamadan Free tier yeter. Anahtarı sohbete yapıştırma.",
  } satisfies ApiGuideItem,
  demand: {
    id: "dataforseo",
    title: "2) DataForSEO — gerçek arama hacmi",
    why: "Adayların yanına Google Ads arama hacmi / rekabet / CPC yazar.",
    envVars: ["DATAFORSEO_LOGIN", "DATAFORSEO_PASSWORD"],
    steps: [
      {
        text: "Ücretsiz hesap aç:",
        href: "https://dataforseo.com/",
        hrefLabel: "dataforseo.com",
      },
      {
        text: "Giriş yapıp API Access sayfasını aç:",
        href: "https://app.dataforseo.com/api-access",
        hrefLabel: "app.dataforseo.com/api-access",
      },
      {
        text: "API login (= genelde e-postan) → DATAFORSEO_LOGIN olarak kaydet.",
      },
      {
        text: "API password (= sistemin ürettiği ayrı şifre; site giriş şifren değil) → DATAFORSEO_PASSWORD. 24 saatten sonra gizlenirse Send by e-mail ile tekrar al.",
      },
      {
        text: "İkisini .env.local veya Vercel Environment Variables’a ekle; lokalde dev’i yeniden başlat, canlıda Redeploy et.",
      },
      {
        text: "Araştır’a bas; talep bağlı rozeti yeşil ve Hacim sütunu dolu olmalı.",
      },
    ],
    tip: "API password ≠ dashboard şifresi. Karıştırırsan 401 alırsın.",
  } satisfies ApiGuideItem,
} as const;

/** SEO Etiketleri — Etsy yazma bağlantısı. */
export const ETSY_WRITE_GUIDE: ApiGuideItem = {
  id: "etsy-write",
  title: "Etsy yazma izni — etiketleri mağazaya gönder",
  why: "Öneriyi Etsy listing’e basmak için önce API app + OAuth gerekir.",
  envVars: ["ETSY_API_KEY", "ETSY_API_SECRET", "ETSY_OAUTH_REDIRECT_URI"],
  steps: [
    {
      text: "Etsy Developers’ta uygulama aç / mevcut app’i yönet:",
      href: "https://www.etsy.com/developers/",
      hrefLabel: "etsy.com/developers",
    },
    {
      text: "Redirect URI ekle: canlıda https://SENIN-DOMAIN/api/etsy/callback (lokal: http://localhost:3000/api/etsy/callback).",
    },
    {
      text: "Keystring → ETSY_API_KEY, Shared Secret → ETSY_API_SECRET olarak .env.local / Vercel’e koy; Redeploy.",
    },
    {
      text: "Panel → Ayarlar → Etsy → Bağlan (yazma izni / listings_w gelsin).",
    },
    {
      text: "Bu sayfaya dönüp öneriyi Gönder.",
    },
  ],
  tip: "Eski bağlantı sadece okuma izniyle kurulduysa Ayarlar’dan yeniden bağla.",
};
