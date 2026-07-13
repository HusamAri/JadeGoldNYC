import { requireMembership } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { VariantCalculator } from "@/components/listing/variant-calculator";

export const metadata = { title: "Otomatik Varyant" };

export default async function VaryantHesaplaPage() {
  await requireMembership();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Otomatik Varyant Hesapla"
        description="Yeni liste için varyant SKU'larını + birkaç bilinen ağırlık/fiyat noktasını gir; eksik ağırlıklar bedenden, eksik fiyatlar ağırlıktan otomatik dağıtılsın."
      />
      <VariantCalculator />
    </div>
  );
}
