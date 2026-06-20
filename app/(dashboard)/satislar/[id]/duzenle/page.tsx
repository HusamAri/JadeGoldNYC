import { notFound } from "next/navigation";

import { getSaleWithItems } from "@/lib/db/queries/sales";
import { PageHeader } from "@/components/page-header";
import { SaleForm } from "@/components/sale-form";
import type { SaleFormValues } from "@/lib/validations/sale";

export const metadata = { title: "Satışı Düzenle" };

function dec(cents: number): string {
  return cents ? (cents / 100).toFixed(2) : "";
}

export default async function SatisDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getSaleWithItems(id);
  if (!data) notFound();
  const { sale } = data;

  const defaultValues: SaleFormValues = {
    order_no: sale.order_no ?? "",
    buyer_name: sale.buyer_name ?? "",
    buyer_email: sale.buyer_email ?? "",
    status: sale.status,
    order_date: sale.order_date.slice(0, 10),
    ship_country: sale.ship_country ?? "",
    item_total: dec(sale.item_total_cents),
    shipping: dec(sale.shipping_cents),
    tax: dec(sale.tax_cents),
    discount: dec(sale.discount_cents),
    etsy_fees: dec(sale.etsy_fees_cents),
    grand_total: dec(sale.grand_total_cents),
    currency: sale.currency,
    notes: sale.notes ?? "",
  };

  return (
    <div>
      <PageHeader
        title="Satışı Düzenle"
        description={sale.order_no ?? undefined}
      />
      <SaleForm mode="edit" saleId={sale.id} defaultValues={defaultValues} />
    </div>
  );
}
