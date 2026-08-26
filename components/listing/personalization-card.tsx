"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PencilRuler, CopyCheck, ListOrdered } from "lucide-react";

import {
  readListingPersonalization,
  copyPersonalizationToAllListings,
  applyIntaglio1010Personalization,
  applyNumberedEonPersonalizationToAllListings,
} from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import type { PersonalizationQuestion } from "@/lib/etsy/personalization";
import { Button } from "@/components/ui/button";

/** Domino turu üst sınırı — imleç ilerlemezse sonsuz döngüye girmeyelim. */
const MAX_TUR = 20;

/**
 * KİŞİSELLEŞTİRME ("custom options") KARTI.
 *
 * Panel bu alanı aynalamıyor; tek doğruluk kaynağı Etsy. Bu yüzden kart
 * SAYFA AÇILIŞINDA istek atmaz — kullanıcı "Etsy'den oku" der, canlı hâli
 * görür, sonra isterse aynısını diğer tüm listing'lere yayar.
 *
 * Yayma yönü bilinçli olarak "bu listing → diğerleri": referans, kullanıcının
 * Etsy editöründe elle kurduğu listing'dir (hammered'da gravür metni + yazı
 * tipi seçimi). Soruları kodda sabitlemek onun düzenlemesini bir sonraki
 * gönderimde ezerdi.
 */
export function PersonalizationCard({
  productId,
  sku,
}: {
  productId: string;
  sku: string;
}) {
  const router = useRouter();
  const [okuyor, setOkuyor] = useState(false);
  const [yaziyor, setYaziyor] = useState(false);
  const [standartliyor, setStandartliyor] = useState(false);
  const [intaglioYaziyor, setIntaglioYaziyor] = useState(false);
  const [questions, setQuestions] = useState<PersonalizationQuestion[] | null>(
    null,
  );
  const intaglio1010 = /^(GLD|WHG|RSG)-R-(10|14|18)10$/.test(sku);

  async function oku() {
    setOkuyor(true);
    try {
      const res = await readListingPersonalization(productId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setQuestions(res.questions ?? []);
      if ((res.questions ?? []).length === 0) {
        toast.info("Bu listing'de kişiselleştirme sorusu yok.");
      }
    } finally {
      setOkuyor(false);
    }
  }

  async function yay() {
    if (!questions || questions.length === 0) return;
    if (
      !confirm(
        `Bu listing'in ${questions.length} kişiselleştirme sorusu TÜM canlı listing'lere yazılacak. ` +
          "Etsy bu işlemde hedefteki mevcut kişiselleştirmeyi TAMAMEN DEĞİŞTİRİR. " +
          "Zaten aynı olanlar atlanır. Listing başına ~2 sn sürer. Devam?",
      )
    ) {
      return;
    }
    setYaziyor(true);
    try {
      let index = 0;
      let applied = 0;
      let skipped = 0;
      const failed: { listingId: number; error: string }[] = [];
      for (let tur = 0; tur < MAX_TUR; tur++) {
        const res = await copyPersonalizationToAllListings(productId, index);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        applied += res.applied ?? 0;
        skipped += res.skipped ?? 0;
        failed.push(...(res.failed ?? []));
        const ilerledi = (res.nextIndex ?? 0) > index;
        if (!res.devam || !ilerledi) break;
        index = res.nextIndex ?? index;
        toast.info(
          `${applied} listing'e yazıldı · ${res.kalan} kaldı — devam ediliyor…`,
        );
      }

      if (failed.length > 0) {
        toast.warning(
          `${applied} yazıldı · ${skipped} zaten aynıydı · ${failed.length} hata: ` +
            failed
              .slice(0, 3)
              .map((f) => `${f.listingId} (${f.error})`)
              .join(" · ") +
            (failed.length > 3 ? " …" : ""),
          { duration: 12000 },
        );
      } else {
        toast.success(
          `${applied} listing'e yazıldı ve doğrulandı · ${skipped} zaten aynıydı.`,
        );
      }
      router.refresh();
    } catch (e) {
      toast.error(
        `Kopyalama yarıda kaldı: ${e instanceof Error ? e.message : String(e)}. ` +
          "Kısmi yazım Şirket Hafızası'na (audit) düştü; tekrar deneyebilirsiniz.",
        { duration: 12000 },
      );
      router.refresh();
    } finally {
      setYaziyor(false);
    }
  }

  async function numaraliFontlariYay() {
    if (
      !confirm(
        "Numaralı EON gravür seti tüm aktif, taslak, süresi dolmuş, pasif ve tükenmiş listing'lere yazılacak. " +
          "Hedeflerdeki mevcut kişiselleştirme soruları tamamen değiştirilecek. Devam?",
      )
    ) {
      return;
    }

    setStandartliyor(true);
    try {
      let index = 0;
      let applied = 0;
      let skipped = 0;
      const failed: { listingId: number; error: string }[] = [];
      for (let tur = 0; tur < MAX_TUR; tur++) {
        const res = await applyNumberedEonPersonalizationToAllListings(index);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        applied += res.applied ?? 0;
        skipped += res.skipped ?? 0;
        failed.push(...(res.failed ?? []));
        const ilerledi = (res.nextIndex ?? 0) > index;
        if (!res.devam || !ilerledi) break;
        index = res.nextIndex ?? index;
        toast.info(
          `${applied} listing numaralı font setine çekildi · ${res.kalan} kaldı`,
        );
      }

      if (failed.length > 0) {
        toast.warning(
          `${applied} listing doğrulandı · ${skipped} zaten aynıydı · ${failed.length} hata: ` +
            failed
              .slice(0, 3)
              .map((f) => `${f.listingId} (${f.error})`)
              .join(" · "),
          { duration: 12000 },
        );
      } else {
        toast.success(
          `${applied} listing numaralı gravür fontlarına çekildi ve Etsy'den geri okunarak doğrulandı · ${skipped} zaten aynıydı.`,
          { duration: 10000 },
        );
      }
      await oku();
      router.refresh();
    } catch (e) {
      toast.error(
        `Numaralı font senkronu yarıda kaldı: ${e instanceof Error ? e.message : String(e)}`,
        { duration: 12000 },
      );
      router.refresh();
    } finally {
      setStandartliyor(false);
    }
  }

  async function intaglioEngravingUygula() {
    if (
      !confirm(
        "Yalnız 9 Intaglio 1010 listingine Engraving Placement, Engraving Text ve numaralı Engraving Font alanları yazılacak. " +
          "Mevcut kişiselleştirme soruları bu 9 listingde tamamen değiştirilecek. Devam?",
      )
    ) {
      return;
    }

    setIntaglioYaziyor(true);
    try {
      let index = 0;
      let applied = 0;
      let skipped = 0;
      let total = 9;
      const failed: { listingId: number; error: string }[] = [];
      for (let tur = 0; tur < MAX_TUR; tur++) {
        const res = await applyIntaglio1010Personalization(productId, index);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        applied += res.applied ?? 0;
        skipped += res.skipped ?? 0;
        total = res.total ?? total;
        failed.push(...(res.failed ?? []));
        const ilerledi = (res.nextIndex ?? 0) > index;
        if (!res.devam || !ilerledi) break;
        index = res.nextIndex ?? index;
        toast.info(
          `${applied} Intaglio listingi doğrulandı · ${res.kalan} kaldı`,
        );
      }

      const verified = applied + skipped;
      const pending = Math.max(0, total - verified - failed.length);
      if (failed.length > 0 || pending > 0) {
        toast.warning(
          `${applied} yazıldı · ${skipped} zaten aynıydı · ${failed.length} hata: ` +
            failed
              .slice(0, 3)
              .map((item) => `${item.listingId} (${item.error})`)
              .join(" · ") +
            `${pending ? ` · ${pending} listing bekliyor` : ""}`,
          { duration: 12000 },
        );
      } else {
        toast.success(
          `${verified} Intaglio listingi Etsy'den geri okunarak doğrulandı · ${applied} güncellendi · ${skipped} zaten aynıydı.`,
          { duration: 10000 },
        );
      }
      await oku();
      router.refresh();
    } catch (e) {
      toast.error(
        `Intaglio engraving senkronu yarıda kaldı: ${
          e instanceof Error ? e.message : String(e)
        }`,
        { duration: 12000 },
      );
      router.refresh();
    } finally {
      setIntaglioYaziyor(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={oku}
          disabled={okuyor || yaziyor || standartliyor || intaglioYaziyor}
        >
          {okuyor ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <PencilRuler className="size-4" />
          )}
          {okuyor ? "Okunuyor…" : "Etsy'den oku"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={numaraliFontlariYay}
          disabled={okuyor || yaziyor || standartliyor || intaglioYaziyor}
        >
          {standartliyor ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ListOrdered className="size-4" />
          )}
          {standartliyor
            ? "Tüm listing'ler güncelleniyor…"
            : "Numaralı EON fontlarını tümüne uygula"}
        </Button>
        {intaglio1010 ? (
          <Button
            type="button"
            size="sm"
            onClick={intaglioEngravingUygula}
            disabled={okuyor || yaziyor || standartliyor || intaglioYaziyor}
          >
            {intaglioYaziyor ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PencilRuler className="size-4" />
            )}
            {intaglioYaziyor
              ? "9 listing doğrulanıyor…"
              : "Intaglio engraving'i 9 listinge uygula"}
          </Button>
        ) : null}
        {questions && questions.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={yay}
            disabled={okuyor || yaziyor || standartliyor || intaglioYaziyor}
          >
            {yaziyor ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CopyCheck className="size-4" />
            )}
            {yaziyor ? "Yazılıyor…" : "Tüm listing'lere uygula"}
          </Button>
        ) : null}
      </div>

      {questions === null ? (
        <p className="text-sm text-muted-foreground">
          Kişiselleştirme alanları panelde tutulmuyor — canlı hâli Etsy&apos;den
          okunur.
        </p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Bu listing&apos;de kişiselleştirme sorusu yok.
        </p>
      ) : (
        <ol className="space-y-2 text-sm">
          {questions.map((q, i) => (
            <li key={i} className="rounded-md border border-border/60 p-3">
              <div className="font-medium text-foreground">{q.question_text}</div>
              <div className="text-xs text-muted-foreground">
                {q.question_type === "dropdown"
                  ? "çoktan seçmeli"
                  : q.question_type === "text_input"
                    ? `metin${q.max_allowed_characters ? ` · ${q.max_allowed_characters} karakter` : ""}`
                    : q.question_type}
                {q.required ? " · zorunlu" : " · opsiyonel"}
              </div>
              {q.instructions ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {q.instructions}
                </p>
              ) : null}
              {q.options?.length ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {q.options.map((o) => o.label).join(" · ")}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
