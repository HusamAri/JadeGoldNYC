import { PageHeader } from "@/components/page-header";
import { MetricForm } from "@/components/metric-form";
import type { MetricFormValues } from "@/lib/validations/metric";

export const metadata = { title: "Yeni Performans Kaydı" };

const EMPTY: MetricFormValues = {
  period_label: "",
  period_start: "",
  period_end: "",
  visits: "",
  orders: "",
  revenue: "",
  cart_abandon_amount: "",
  cart_abandon_count: "",
  rating: "",
  ads_spend: "",
  ads_revenue: "",
  src_etsy_app: "",
  src_etsy_marketing: "",
  src_etsy_ads: "",
  src_direct: "",
  src_etsy_search: "",
  src_social: "",
  notes: "",
};

export default function YeniPerformansPage() {
  return (
    <div>
      <PageHeader
        title="Yeni Performans Kaydı"
        description="Etsy Stats dönemini girin (rapordan veya canlı panelden)"
      />
      <MetricForm mode="create" defaultValues={EMPTY} />
    </div>
  );
}
