import { notFound } from "next/navigation";

import { getMetric } from "@/lib/db/queries/metrics";
import { PageHeader } from "@/components/page-header";
import { MetricForm } from "@/components/metric-form";
import type { MetricFormValues } from "@/lib/validations/metric";

export const metadata = { title: "Performans Kaydını Düzenle" };

function dec(cents: number | null): string {
  return cents != null ? (cents / 100).toFixed(2) : "";
}
function num(v: number | null): string {
  return v != null ? String(v) : "";
}

export default async function PerformansDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const metric = await getMetric(id);
  if (!metric) notFound();
  const ts = metric.traffic_sources ?? {};

  const defaultValues: MetricFormValues = {
    period_label: metric.period_label,
    period_start: metric.period_start ?? "",
    period_end: metric.period_end ?? "",
    visits: num(metric.visits),
    orders: num(metric.orders),
    revenue: dec(metric.revenue_cents),
    cart_abandon_amount: dec(metric.cart_abandon_amount_cents),
    cart_abandon_count: num(metric.cart_abandon_count),
    rating: metric.rating != null ? String(metric.rating) : "",
    ads_spend: dec(metric.ads_spend_cents),
    ads_revenue: dec(metric.ads_revenue_cents),
    src_etsy_app: num(ts.etsy_app ?? null),
    src_etsy_marketing: num(ts.etsy_marketing ?? null),
    src_etsy_ads: num(ts.etsy_ads ?? null),
    src_direct: num(ts.direct ?? null),
    src_etsy_search: num(ts.etsy_search ?? null),
    src_social: num(ts.social ?? null),
    notes: metric.notes ?? "",
  };

  return (
    <div>
      <PageHeader
        title="Performans Kaydını Düzenle"
        description={metric.period_label}
      />
      <MetricForm mode="edit" metricId={metric.id} defaultValues={defaultValues} />
    </div>
  );
}
