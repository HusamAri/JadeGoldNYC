import { requireMembership } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { SeoHelperConsole } from "@/components/seo/seo-helper-console";

export const metadata = { title: "Listing SEO Yardımcısı" };

/**
 * Listing SEO Yardımcısı — ürün özelliklerinden Etsy'ye uygun başlık + 13
 * etiket + açıklama taslağı + SEO skoru üretir. Üretim tamamen istemcide, saf
 * motorla (lib/seo/keyword-engine) anlık çalışır; DB'ye yazmaz.
 */
export default async function SeoYardimcisiPage() {
  await requireMembership();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Listing SEO Yardımcısı"
        title="Listing SEO Yardımcısı"
        description="Ürün künyesini gir (tip, stil, malzeme, odak varyant, pazar) — Etsy'ye uygun başlık, 13 uzun-kuyruk etiket, açıklama taslağı ve dürüstlük-denetimli SEO skoru anında üretilir."
      />
      <SeoHelperConsole />
    </div>
  );
}
