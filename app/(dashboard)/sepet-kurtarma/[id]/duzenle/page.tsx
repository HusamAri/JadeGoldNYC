import { notFound } from "next/navigation";

import { getCartRecovery } from "@/lib/db/queries/cart-recoveries";
import { PageHeader } from "@/components/page-header";
import { CartRecoveryForm } from "@/components/cart-recovery-form";
import type { CartRecoveryFormValues } from "@/lib/validations/cart-recovery";

export const metadata = { title: "Sepeti Düzenle" };

function dec(cents: number | null): string {
  return cents != null ? (cents / 100).toFixed(2) : "";
}

export default async function SepetDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getCartRecovery(id);
  if (!c) notFound();

  const defaultValues: CartRecoveryFormValues = {
    buyer_name: c.buyer_name ?? "",
    buyer_email: c.buyer_email ?? "",
    cart_value: dec(c.cart_value_cents),
    item_summary: c.item_summary ?? "",
    abandoned_at: c.abandoned_at ?? "",
    status: c.status,
    action_taken: c.action_taken ?? "",
    incentive: c.incentive ?? "",
    recovered_value: dec(c.recovered_value_cents),
    notes: c.notes ?? "",
  };

  return (
    <div>
      <PageHeader
        title="Sepeti Düzenle"
        description={c.buyer_name ?? c.buyer_email ?? undefined}
      />
      <CartRecoveryForm
        mode="edit"
        recoveryId={c.id}
        defaultValues={defaultValues}
      />
    </div>
  );
}
