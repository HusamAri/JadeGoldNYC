import { notFound } from "next/navigation";

import { getProductMetric } from "@/lib/db/queries/product-metrics";
import { PageHeader } from "@/components/page-header";
import { ProductMetricForm } from "@/components/product-metric-form";
import type { ProductMetricFormValues } from "@/lib/validations/product-metric";

export const metadata = { title: "Ürün Kaydını Düzenle" };

function dec(cents: number | null): string {
  return cents != null ? (cents / 100).toFixed(2) : "";
}
function num(v: number | null): string {
  return v != null ? String(v) : "";
}

export default async function UrunDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await getProductMetric(id);
  if (!m) notFound();

  const defaultValues: ProductMetricFormValues = {
    period_label: m.period_label,
    product_title: m.product_title,
    sku: m.sku ?? "",
    views: num(m.views),
    orders: num(m.orders),
    revenue: dec(m.revenue_cents),
    ads_clicks: num(m.ads_clicks),
    ads_spend: dec(m.ads_spend_cents),
    ads_revenue: dec(m.ads_revenue_cents),
    notes: m.notes ?? "",
  };

  return (
    <div>
      <PageHeader title="Ürün Kaydını Düzenle" description={m.product_title} />
      <ProductMetricForm
        mode="edit"
        metricId={m.id}
        defaultValues={defaultValues}
      />
    </div>
  );
}
