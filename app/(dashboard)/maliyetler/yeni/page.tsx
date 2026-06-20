import { listCostCategories } from "@/lib/db/queries/costs";
import { PageHeader } from "@/components/page-header";
import { CostForm } from "@/components/cost-form";
import type { CostFormValues } from "@/lib/validations/cost";

export const metadata = { title: "Yeni Maliyet" };

export default async function YeniMaliyetPage() {
  const categories = await listCostCategories();
  const options = categories.map((c) => ({ value: c.id, label: c.label_tr }));
  const today = new Date().toISOString().slice(0, 10);

  const defaultValues: CostFormValues = {
    category_id: options[0]?.value ?? "",
    description: "",
    amount: "",
    currency: "USD",
    cost_date: today,
    vendor: "",
    notes: "",
  };

  return (
    <div>
      <PageHeader title="Yeni Maliyet" description="Gider kaydı ekleyin" />
      <CostForm
        mode="create"
        categories={options}
        defaultValues={defaultValues}
      />
    </div>
  );
}
