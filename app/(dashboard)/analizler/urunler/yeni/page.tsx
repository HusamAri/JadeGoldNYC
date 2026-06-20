import { PageHeader } from "@/components/page-header";
import { ProductMetricForm } from "@/components/product-metric-form";
import type { ProductMetricFormValues } from "@/lib/validations/product-metric";

export const metadata = { title: "Yeni Ürün Kaydı" };

const EMPTY: ProductMetricFormValues = {
  period_label: "",
  product_title: "",
  sku: "",
  views: "",
  orders: "",
  revenue: "",
  ads_clicks: "",
  ads_spend: "",
  ads_revenue: "",
  notes: "",
};

export default function YeniUrunPage() {
  return (
    <div>
      <PageHeader
        title="Yeni Ürün Kaydı"
        description="Ürün başına dönemsel performans (rapor §07/§08)"
      />
      <ProductMetricForm mode="create" defaultValues={EMPTY} />
    </div>
  );
}
