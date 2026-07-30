"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";

import type { SocialPost } from "@/lib/db/queries/social";
import { Button } from "@/components/ui/button";

/**
 * PAYLAŞIM PAKETİ — günü gelen içeriği platforma (IG/TikTok) aktarırken
 * caption / ilk-yorum hashtag'leri / overlay metni, olduğu gibi yapıştırılacak
 * hazır bloklar hâlinde durur. Blok içeriği birebir kopyalanır — panelde
 * görünen metin ile platforma giden metin aynıdır.
 */

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} kopyalandı`);
  } catch {
    toast.error("Kopyalanamadı");
  }
}

function CopyBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-input overflow-hidden rounded-xl border">
      <div className="bg-muted/60 flex items-center justify-between gap-2 px-3 py-1.5">
        <span className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
          {label}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-[10px]"
          onClick={() => copyText(text, label)}
        >
          <Copy className="size-3" />
          Kopyala
        </Button>
      </div>
      <pre className="max-h-56 overflow-auto px-3 py-2.5 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  );
}

export function PublishKit({ post }: { post: SocialPost }) {
  const caption = post.caption?.trim();
  const hashtags = post.hashtags?.trim();
  const overlay = post.overlay?.trim();
  if (!caption && !hashtags && !overlay) return null;

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
          Paylaşım paketi — kopyala &amp; yapıştır
        </h3>
        {caption && hashtags && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[10px]"
            onClick={() =>
              copyText(`${caption}\n\n${hashtags}`, "Caption + hashtag")
            }
          >
            <Copy className="size-3" />
            İkisini birlikte kopyala
          </Button>
        )}
      </div>
      {caption && <CopyBlock label="Caption" text={caption} />}
      {hashtags && <CopyBlock label="Hashtag (ilk yorum)" text={hashtags} />}
      {overlay && <CopyBlock label="On-screen overlay" text={overlay} />}
    </section>
  );
}
