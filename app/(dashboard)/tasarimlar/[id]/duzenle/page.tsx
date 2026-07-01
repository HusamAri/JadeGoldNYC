import { notFound } from "next/navigation";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDesign } from "@/lib/db/queries/designs";
import { PageHeader } from "@/components/page-header";
import { DesignForm } from "@/components/design-form";
import type { DesignFormValues } from "@/lib/validations/design";

export const metadata = { title: "Tasarımı Düzenle" };

export default async function TasarimDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await requireMembership();
  const [design, products] = await Promise.all([
    getDesign(id),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("id, title")
        .eq("org_id", m.org_id)
        .eq("status", "active")
        .order("title", { ascending: true })
        .limit(500);
      return (data ?? []) as { id: string; title: string }[];
    })(),
  ]);
  if (!design) notFound();

  const options = products.map((p) => ({ value: p.id, label: p.title }));

  const defaultValues: DesignFormValues = {
    name: design.name,
    description: design.description ?? "",
    status: design.status as DesignFormValues["status"],
    product_id: design.product_id ?? "",
    tags: design.tags?.join(", ") ?? "",
    version: String(design.version ?? 1),
  };

  return (
    <div>
      <PageHeader title="Tasarımı Düzenle" description={design.name} />
      <DesignForm
        mode="edit"
        designId={design.id}
        defaultValues={defaultValues}
        products={options}
      />
    </div>
  );
}
