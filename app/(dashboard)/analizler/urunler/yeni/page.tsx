import { listProducts } from "@/lib/db/queries/products";
import { PageHeader } from "@/components/page-header";
import { ProductMetricForm } from "@/components/product-metric-form";
import type { ProductMetricFormValues } from "@/lib/validations/product-metric";

export const metadata = { title: "Yeni Ürün Kaydı" };

const EMPTY: ProductMetricFormValues = {
  period_label: "",
  product_title: "",
  product_id: "",
  sku: "",
  views: "",
  orders: "",
  revenue: "",
  ads_clicks: "",
  ads_spend: "",
  ads_revenue: "",
  notes: "",
};

export default async function YeniUrunPage() {
  const products = await listProducts();
  return (
    <div>
      <PageHeader
        title="Yeni Ürün Kaydı"
        description="Ürün başına dönemsel performans (rapor §07/§08)"
      />
      <ProductMetricForm
        mode="create"
        defaultValues={EMPTY}
        products={products.map((p) => ({ id: p.id, title: p.title }))}
      />
    </div>
  );
}
