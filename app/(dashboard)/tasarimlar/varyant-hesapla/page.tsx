import { requireMembership } from "@/lib/auth";
import { listVariantListingOptions } from "@/lib/db/queries/variant-weights";
import { getGoldSettings } from "@/lib/db/queries/gold-settings";
import { PageHeader } from "@/components/page-header";
import { VariantCalculator } from "@/components/listing/variant-calculator";

export const metadata = { title: "Otomatik Varyant" };

export default async function VaryantHesaplaPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  const m = await requireMembership();
  const [{ listing }, listings, goldSettings] = await Promise.all([
    searchParams,
    listVariantListingOptions(m.org_id),
    getGoldSettings(),
  ]);
  // Geçersiz/başka org'a ait id ile derin bağlantı sessizce serbest moda düşer.
  const initialListingId = listings.some((l) => l.id === listing)
    ? listing
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Otomatik Varyant Hesapla"
        description="Önce listing seç (varyantları otomatik yüklenir) ya da serbest modda SKU'ları elle gir; eksik ağırlıklar bedenden, eksik fiyatlar ağırlıktan hesaplanır. Toplu fiyat çapa satırdan grama göre yeniden yazar; istersen listing'e kaydedilir."
      />
      <VariantCalculator
        listings={listings}
        initialListingId={initialListingId}
        purchasePrice14kCents={goldSettings.purchase_price_14k_cents}
        purchasePrice10kCents={goldSettings.purchase_price_10k_cents}
      />
    </div>
  );
}
