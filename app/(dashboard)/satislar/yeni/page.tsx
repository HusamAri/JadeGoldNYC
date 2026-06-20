import { PageHeader } from "@/components/page-header";
import { SaleForm } from "@/components/sale-form";
import type { SaleFormValues } from "@/lib/validations/sale";

export const metadata = { title: "Yeni Satış" };

export default function YeniSatisPage() {
  const today = new Date().toISOString().slice(0, 10);
  const defaultValues: SaleFormValues = {
    order_no: "",
    buyer_name: "",
    buyer_email: "",
    status: "completed",
    order_date: today,
    ship_country: "",
    item_total: "",
    shipping: "",
    tax: "",
    discount: "",
    etsy_fees: "",
    grand_total: "",
    currency: "USD",
    notes: "",
  };

  return (
    <div>
      <PageHeader title="Yeni Satış" description="Manuel satış kaydı ekleyin" />
      <SaleForm mode="create" defaultValues={defaultValues} />
    </div>
  );
}
