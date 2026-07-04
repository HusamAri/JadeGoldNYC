"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Save, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import {
  saveReviewResponse,
  generateReviewReply,
} from "@/app/(dashboard)/yorumlar/actions";
import { formatDateTime } from "@/lib/format";
import { RatingStars } from "@/components/rating-stars";
import { SectionGuide } from "@/components/section-guide";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Satıcının Etsy'de yorumları yanıtladığı sayfa. */
const ETSY_REVIEWS_URL = "https://www.etsy.com/your/shops/me/reviews";

export function ReviewResponsePanel({
  reviewId,
  rating,
  reviewText,
  buyerName,
  respondedAt,
  initialResponse,
}: {
  reviewId: string;
  rating: number | null;
  reviewText: string | null;
  buyerName: string | null;
  respondedAt: string | null;
  initialResponse: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialResponse ?? "");
  const [pending, startTransition] = useTransition();
  const [aiPending, setAiPending] = useState(false);

  async function suggest() {
    setAiPending(true);
    try {
      const res = await generateReviewReply(reviewId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.text) {
        setText(res.text);
        toast.success("Taslak önerildi — düzenleyip kaydedebilirsiniz.");
      }
    } finally {
      setAiPending(false);
    }
  }

  function saveDraft() {
    startTransition(async () => {
      const res = await saveReviewResponse(reviewId, text, false);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Taslak kaydedildi.");
      router.refresh();
    });
  }

  async function replyOnEtsy() {
    const t = text.trim();
    if (!t) {
      toast.error("Önce bir yanıt yazın veya AI ile öneri alın.");
      return;
    }
    let copied = false;
    try {
      await navigator.clipboard.writeText(t);
      copied = true;
    } catch {
      copied = false;
    }
    startTransition(async () => {
      const res = await saveReviewResponse(reviewId, t, true);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        copied
          ? "Yanıt panoya kopyalandı — Etsy'de yorumun altına yapıştırın."
          : "Yanıtlandı olarak işaretlendi. Metni kopyalayıp Etsy'de yapıştırın.",
      );
      window.open(ETSY_REVIEWS_URL, "_blank", "noopener,noreferrer");
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Yanıt
          {respondedAt && (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-normal">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Yanıtlandı · {formatDateTime(respondedAt, "d MMM HH:mm")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionGuide title="Yorum nasıl yanıtlanır?">
          <p>
            Etsy, yorum yanıtlarını API üzerinden göndermeye izin vermez; yanıt
            burada hazırlanır, gönderim Etsy sitesinde tek tıkla yapılır.
          </p>
          <ol>
            <li>
              İsterseniz <b>AI Taslak Öner</b> ile yorumun diline uygun bir
              taslak alın, sonra düzenleyin.
            </li>
            <li>
              <b>Taslağı Kaydet</b> ile panelde saklayın (durum değişmez).
            </li>
            <li>
              <b>Etsy&apos;de Yanıtla</b>: yanıt panoya kopyalanır, yorum
              &quot;yanıtlandı&quot; olarak işaretlenir ve Etsy yorum sayfası
              açılır — ilgili yorumun altına <b>yapıştırıp gönderin</b>.
            </li>
          </ol>
        </SectionGuide>

        {/* Yanıtlanan yorumun bağlamı */}
        <div className="bg-muted/50 rounded-lg border p-3 text-sm">
          <div className="mb-1 flex items-center gap-2">
            <RatingStars rating={rating} />
            <span className="text-muted-foreground text-xs">
              {buyerName ?? "Alıcı"}
            </span>
          </div>
          <p className="text-foreground/80">
            {reviewText?.trim() || "(Yazılı metin yok — yalnız puan)"}
          </p>
        </div>

        <div className="space-y-2">
          <Textarea
            aria-label="Yanıt metni"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Yanıtınızı yazın ya da AI ile taslak önerisi alın…"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={suggest}
              disabled={aiPending || pending}
            >
              <Sparkles className="size-4" />
              {aiPending ? "Öneriliyor…" : "AI Taslak Öner"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={saveDraft}
              disabled={pending || aiPending}
            >
              <Save className="size-4" />
              Taslağı Kaydet
            </Button>
            <Button
              type="button"
              onClick={replyOnEtsy}
              disabled={pending || aiPending}
              className="ml-auto"
            >
              <ExternalLink className="size-4" />
              Etsy&apos;de Yanıtla
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
