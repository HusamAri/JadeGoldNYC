import { requireMembership, isManager } from "@/lib/auth";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import {
  getSeoOptimizations,
  summarizeSeo,
} from "@/lib/db/queries/seo-tags";
import { PageHeader } from "@/components/page-header";
import { SeoTagBoard } from "@/components/seo/seo-tag-board";

export const metadata = { title: "SEO Etiket Optimizasyonu" };

/**
 * SEO Etiket Optimizasyonu — 115 aktif listing için değer-öncelikli optimize
 * 13-tag önerileri. Öneri → (elle düzenle) → Etsy'ye gönder → push anında
 * baseline (views/favs) yakalanır → sonradan etki ölçülür (measure loop).
 * Push CANLI Etsy'ye yazar; yalnız yönetici + Etsy yazma izni açıkken.
 */
export default async function SeoEtiketleriPage() {
  const m = await requireMembership();
  const [rows, write] = await Promise.all([
    getSeoOptimizations(m.org_id),
    getEtsyWriteAccess(m.org_id),
  ]);
  const summary = summarizeSeo(rows);

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        eyebrow="SEO Etiket Optimizasyonu"
        title="SEO Etiket Optimizasyonu"
        description="Aktif listing'lerin 13 etiketi değer-öncelikli optimize edildi (leak > bestseller > converter > standart). İncele, gerekirse düzenle, Etsy'ye gönder — gönderim anındaki görüntülenme/favori baz alınır, etki sonradan ölçülür."
      />
      <SeoTagBoard
        rows={rows}
        summary={summary}
        writeEnabled={write.writeEnabled}
        isManager={isManager(m.role)}
      />
    </div>
  );
}
