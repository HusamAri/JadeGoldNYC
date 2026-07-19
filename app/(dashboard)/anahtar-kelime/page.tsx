import { requireMembership } from "@/lib/auth";
import {
  listSavedKeywords,
  listProductsLite,
} from "@/lib/db/queries/keyword-ideas";
import { isAIConfigured } from "@/lib/ai";
import { isDataForSeoConfigured } from "@/lib/keywords/dataforseo";
import { PageHeader } from "@/components/page-header";
import { KeywordWorkbench } from "@/components/keywords/keyword-workbench";

export const metadata = { title: "Anahtar Kelime Araştırma" };

/**
 * Anahtar kelime araştırma tezgahı — tohum/ürün'den aday anahtar kelimeler
 * üretir (kural motoru ücretsiz; Gemini + DataForSEO bağlıysa AI genişletme +
 * gerçek arama hacmi), beğenilenleri kaydeder. Platformdan bağımsız.
 * Eksik anahtar varsa sayfada adım adım nereden alınacağı gösterilir
 * (docs/seo-api-kurulum.md).
 */
export default async function AnahtarKelimePage() {
  const m = await requireMembership();
  const [saved, products] = await Promise.all([
    listSavedKeywords(m.org_id),
    listProductsLite(m.org_id),
  ]);

  return (
    <div className="page-stack pb-24">
      <PageHeader
        title="Anahtar Kelime Araştırma"
        eyebrow="SEO · talep"
        description="Tohum kelime veya listing'den aday anahtar kelimeler üretin; talep verisi bağlıysa gerçek arama hacmiyle sıralayın ve beğendiklerinizi kaydedin."
      />
      <KeywordWorkbench
        products={products}
        saved={saved}
        initialSources={{
          ai: isAIConfigured(),
          demand: isDataForSeoConfigured(),
        }}
      />
    </div>
  );
}
