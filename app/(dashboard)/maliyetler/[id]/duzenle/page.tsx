import { notFound } from "next/navigation";

import { getCost, listCostCategories } from "@/lib/db/queries/costs";
import { PageHeader } from "@/components/page-header";
import { CostForm } from "@/components/cost-form";
import type { CostFormValues } from "@/lib/validations/cost";

export const metadata = { title: "Maliyeti Düzenle" };

function dec(cents: number): string {
  return cents ? (cents / 100).toFixed(2) : "";
}

export default async function MaliyetDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cost, categories] = await Promise.all([
    getCost(id),
    listCostCategories(),
  ]);
  if (!cost) notFound();
  const options = categories.map((c) => ({ value: c.id, label: c.label_tr }));

  const defaultValues: CostFormValues = {
    category_id: cost.category_id ?? "",
    description: cost.description,
    amount: dec(cost.amount_cents),
    currency: cost.currency,
    cost_date: cost.cost_date.slice(0, 10),
    vendor: cost.vendor ?? "",
    notes: cost.notes ?? "",
  };

  return (
    <div>
      <PageHeader title="Maliyeti Düzenle" description={cost.description} />
      <CostForm
        mode="edit"
        costId={cost.id}
        categories={options}
        defaultValues={defaultValues}
      />
    </div>
  );
}
