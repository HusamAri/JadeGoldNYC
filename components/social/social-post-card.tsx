"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";

import type { SocialPost } from "@/lib/db/queries/social";
import { setSocialPostStatus } from "@/app/(dashboard)/sosyal/actions";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  idea: "Fikir",
  planned: "Planlı",
  ready: "Hazır",
  published: "Yayında",
  skipped: "Atlandı",
};

const FORMAT_LABEL: Record<string, string> = {
  reel: "Reel",
  photo: "Foto",
  carousel: "Carousel",
  story: "Story",
  post: "Post",
};

export function SocialPostCard({ post }: { post: SocialPost }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function copy(text: string | null, label: string) {
    if (!text?.trim()) {
      toast.message(`${label} boş`);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} kopyalandı`);
    } catch {
      toast.error("Kopyalanamadı");
    }
  }

  return (
    <article className="nm-raised-sm flex h-full flex-col gap-3 rounded-[1.25rem] p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{FORMAT_LABEL[post.format] ?? post.format}</Badge>
            <Badge variant="secondary">
              {STATUS_LABEL[post.status] ?? post.status}
            </Badge>
            {post.week_number != null && (
              <span className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
                W{post.week_number}
                {post.week_theme ? ` · ${post.week_theme}` : ""}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold leading-snug">{post.title}</h3>
          {post.series && (
            <p className="text-muted-foreground text-xs">{post.series}</p>
          )}
        </div>
        <time className="text-muted-foreground font-mono text-[10px] tabular-nums">
          {post.scheduled_at ? formatDateTime(post.scheduled_at) : "tarihsiz"}
        </time>
      </header>

      {post.caption && (
        <p className="text-muted-foreground line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed">
          {post.caption}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px]"
          onClick={() => copy(post.caption, "Caption")}
        >
          <Copy className="size-3" />
          Caption
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[10px]"
          onClick={() => copy(post.hashtags, "Hashtag")}
        >
          <Copy className="size-3" />
          Tags
        </Button>
        <Button asChild size="sm" variant="outline" className="h-7 px-2 text-[10px]">
          <Link href={`/sosyal/${post.id}`}>Düzenle</Link>
        </Button>
        {post.status !== "published" && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={cn("h-7 px-2 text-[10px]")}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await setSocialPostStatus(post.id, "published");
                if (r.error) toast.error(r.error);
                else {
                  toast.success("Yayında işaretlendi");
                  router.refresh();
                }
              })
            }
          >
            <Check className="size-3" />
            Yayınlandı
          </Button>
        )}
      </div>
    </article>
  );
}
