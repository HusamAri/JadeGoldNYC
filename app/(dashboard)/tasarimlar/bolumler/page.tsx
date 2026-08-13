import Link from "next/link";

import { requireMembership } from "@/lib/auth";
import {
  getChapterBoard,
  getShopSections,
  listUnclassified,
} from "@/lib/db/queries/chapters";
import { PageHeader } from "@/components/page-header";
import { ChapterBoard } from "@/components/chapters/chapter-board";
import { ShopSectionsCard } from "@/components/chapters/shop-sections-card";
import { SectionPushCard } from "@/components/chapters/section-push-card";
import { getSectionPlan } from "./section-actions";

export const metadata = { title: "Anlam Bölümleri" };

export default async function BolumlerPage() {
  const m = await requireMembership();
  const [board, unclassified, sections, plan] = await Promise.all([
    getChapterBoard(m.org_id),
    listUnclassified(m.org_id),
    getShopSections(m.org_id),
    getSectionPlan(),
  ]);

  const withRedesign = board.chapters.reduce(
    (n, c) => n + c.redesign.pending + c.redesign.approved,
    0,
  );

  return (
    <div className="page-stack pb-28">
      <PageHeader
        title="Anlam Bölümleri"
        description={
          `${board.totalListings} canlı listing yedi anlam bölümüne ayrıldı — katalog artık ürün tipiyle değil, ` +
          `alıcının aradığı anlamla okunuyor. Çalışma bölüm bölüm ilerler: bir bölümün içeriği hazırlanır, ` +
          `kapıdan geçer, önce tek listing'de denenir.` +
          (withRedesign > 0
            ? ` Şu an ${withRedesign} listing için hazırlanmış içerik onay/gönderim bekliyor.`
            : "")
        }
      />

      <ChapterBoard
        chapters={board.chapters}
        unclassified={unclassified}
        unclassifiedCount={board.unclassified}
      />

      <SectionPushCard plan={plan} />

      <ShopSectionsCard filled={sections.filled} empty={sections.empty} />

      <p className="text-xs text-muted-foreground">
        Sınıflandırma motoru{" "}
        <code className="rounded bg-muted px-1 py-0.5">
          lib/collections/chapters.ts
        </code>{" "}
        · anlam biçimden önce gelir (Last Supper Ring → İnanç, yüzük değil).
        Kurallar ve koruma sözleşmesi:{" "}
        <Link href="/kayitlar" className="underline underline-offset-2">
          denetim kayıtları
        </Link>{" "}
        her değişikliği saklar.
      </p>
    </div>
  );
}
