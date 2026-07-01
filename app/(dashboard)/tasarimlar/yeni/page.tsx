import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { DesignForm } from "@/components/design-form";
import type { DesignFormValues } from "@/lib/validations/design";

export const metadata = { title: "Yeni Tasarım" };

export default async function YeniTasarimPage() {
  const m = await requireMembership();
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, title")
    .eq("org_id", m.org_id)
    .eq("status", "active")
    .order("title", { ascending: true })
    .limit(500);
  const options = ((products ?? []) as { id: string; title: string }[]).map(
    (p) => ({ value: p.id, label: p.title }),
  );

  const defaultValues: DesignFormValues = {
    name: "",
    description: "",
    status: "taslak",
    product_id: "",
    tags: "",
    version: "1",
  };

  return (
    <div>
      <PageHeader
        title="Yeni Tasarım"
        description="Yeni bir tasarım kaydı oluşturun"
      />
      <DesignForm mode="create" defaultValues={defaultValues} products={options} />
    </div>
  );
}
