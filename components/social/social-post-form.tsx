"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";

import type { SocialPost } from "@/lib/db/queries/social";
import { MediaGallery } from "@/components/social/media-preview";
import { parseMediaUrls } from "@/lib/validations/social";
import {
  createSocialPost,
  deleteSocialPost,
  updateSocialPost,
} from "@/app/(dashboard)/sosyal/actions";
import type { SocialPostInput } from "@/lib/validations/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SocialPostForm({
  post,
}: {
  /** Yoksa oluşturma modu. */
  post?: SocialPost | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState<SocialPostInput>({
    platform: post?.platform ?? "instagram",
    format: post?.format ?? "reel",
    status: post?.status ?? "planned",
    title: post?.title ?? "",
    week_number: post?.week_number != null ? String(post.week_number) : "",
    week_theme: post?.week_theme ?? "",
    series: post?.series ?? "",
    scheduled_at: toLocalInput(post?.scheduled_at ?? null),
    asset_note: post?.asset_note ?? "",
    overlay: post?.overlay ?? "",
    caption: post?.caption ?? "",
    hashtags: post?.hashtags ?? "",
    tags_note: post?.tags_note ?? "",
    permalink: post?.permalink ?? "",
    media_urls: (post?.media_urls ?? []).join("\n"),
  });

  function set<K extends keyof SocialPostInput>(key: K, value: SocialPostInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // GEÇMİŞ TARİH + OLUŞTURMA = yayınlanmış arşiv postu hızlı ekleme:
  // form linke indirgenir, durum otomatik "Yayında" gönderilir (sunucu da
  // aynı kuralı bağlayıcı uygular). İleri tarih = tam planlama formu.
  // "Şimdi" render'da değil mount'ta bir kez okunur (react-hooks/purity);
  // sunucu kuralı zaten gerçek gönderim anına göre karar verir.
  const [mountedAt] = useState(() => Date.now());
  const schedTime = form.scheduled_at?.trim()
    ? new Date(form.scheduled_at).getTime()
    : NaN;
  const quickPast = !post && Number.isFinite(schedTime) && schedTime < mountedAt;
  const quickHasLink =
    Boolean(form.permalink?.trim()) ||
    parseMediaUrls(form.media_urls).length > 0;

  function submit() {
    start(async () => {
      const payload: SocialPostInput = quickPast
        ? { ...form, status: "published" }
        : form;
      const r = post
        ? await updateSocialPost(post.id, payload)
        : await createSocialPost(payload);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(post ? "Güncellendi" : "İçerik eklendi");
      router.push("/sosyal");
      router.refresh();
    });
  }

  function remove() {
    if (!post) return;
    if (!confirm("Bu içeriği silmek istediğinize emin misiniz?")) return;
    start(async () => {
      const r = await deleteSocialPost(post.id);
      if (r.error) toast.error(r.error);
      else {
        toast.success("Silindi");
        router.push("/sosyal");
        router.refresh();
      }
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Platform">
          <select
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={form.platform}
            onChange={(e) =>
              set("platform", e.target.value as SocialPostInput["platform"])
            }
          >
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="pinterest">Pinterest</option>
            <option value="other">Diğer</option>
          </select>
        </Field>
        <Field label="Format">
          <select
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={form.format}
            onChange={(e) =>
              set("format", e.target.value as SocialPostInput["format"])
            }
          >
            <option value="reel">Reel</option>
            <option value="photo">Foto</option>
            <option value="carousel">Carousel</option>
            <option value="story">Story</option>
            <option value="post">Post</option>
          </select>
        </Field>
        {!quickPast && (
          <Field label="Durum">
            <select
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as SocialPostInput["status"])
              }
            >
              <option value="idea">Fikir</option>
              <option value="planned">Planlı</option>
              <option value="ready">Hazır</option>
              <option value="published">Yayında</option>
              <option value="skipped">Atlandı</option>
            </select>
          </Field>
        )}
      </div>

      <Field label="Planlanan zaman">
        <Input
          type="datetime-local"
          value={form.scheduled_at ?? ""}
          onChange={(e) => set("scheduled_at", e.target.value)}
        />
      </Field>

      {quickPast && (
        <p className="border-input bg-muted/40 text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs leading-relaxed">
          Geçmiş tarih seçtin — bu post <strong>otomatik “Yayında”</strong>{" "}
          olarak eklenir. Link yeter (post linki ya da medya linki); başlık boş
          kalırsa platform + tarihten üretilir.
        </p>
      )}

      <Field label={quickPast ? "Başlık (boş = otomatik)" : "Başlık"}>
        <Input
          value={form.title ?? ""}
          onChange={(e) => set("title", e.target.value)}
          required={!quickPast}
          maxLength={200}
          placeholder={quickPast ? "Instagram · 20 Tem 2026" : undefined}
        />
      </Field>

      {!quickPast && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Hafta no">
              <Input
                inputMode="numeric"
                value={form.week_number ?? ""}
                onChange={(e) => set("week_number", e.target.value)}
                placeholder="1"
              />
            </Field>
            <Field label="Hafta teması">
              <Input
                value={form.week_theme ?? ""}
                onChange={(e) => set("week_theme", e.target.value)}
                placeholder="The Omen"
              />
            </Field>
            <Field label="Seri">
              <Input
                value={form.series ?? ""}
                onChange={(e) => set("series", e.target.value)}
                placeholder="The Long Time"
              />
            </Field>
          </div>

          <Field label="Asset notu">
            <Input
              value={form.asset_note ?? ""}
              onChange={(e) => set("asset_note", e.target.value)}
            />
          </Field>
          <Field label="On-screen overlay">
            <Input
              value={form.overlay ?? ""}
              onChange={(e) => set("overlay", e.target.value)}
            />
          </Field>
          <Field label="Caption">
            <Textarea
              value={form.caption ?? ""}
              onChange={(e) => set("caption", e.target.value)}
              rows={5}
            />
          </Field>
          <Field label="Hashtags (ilk yorum)">
            <Textarea
              value={form.hashtags ?? ""}
              onChange={(e) => set("hashtags", e.target.value)}
              rows={2}
            />
          </Field>
        </>
      )}
      <Field label="Medya linkleri (her satıra bir URL)">
        <Textarea
          value={form.media_urls ?? ""}
          onChange={(e) => set("media_urls", e.target.value)}
          rows={3}
          placeholder={
            "https://drive.google.com/file/d/…\nhttps://…/gorsel.jpg · https://…/video.mp4"
          }
        />
        {/* Canlı önizleme: kaydetmeden linkin doğru olduğunu gör. */}
        <MediaGallery urls={parseMediaUrls(form.media_urls)} />
      </Field>
      <Field
        label={
          quickPast ? "Post linki (ya da yukarıya medya linki)" : "Permalink (yayın sonrası)"
        }
      >
        <Input
          value={form.permalink ?? ""}
          onChange={(e) => set("permalink", e.target.value)}
          placeholder="https://www.instagram.com/p/..."
        />
      </Field>

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" disabled={pending || (quickPast && !quickHasLink)}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {quickPast ? "Yayında olarak ekle" : "Kaydet"}
        </Button>
        {post && (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={remove}
          >
            <Trash2 className="size-4" />
            Sil
          </Button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}
