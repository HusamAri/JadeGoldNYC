import { PageHeader } from "@/components/page-header";
import { CartRecoveryForm } from "@/components/cart-recovery-form";
import type { CartRecoveryFormValues } from "@/lib/validations/cart-recovery";

export const metadata = { title: "Yeni Sepet" };

export default function YeniSepetPage() {
  const today = new Date().toISOString().slice(0, 10);
  const defaultValues: CartRecoveryFormValues = {
    buyer_name: "",
    buyer_email: "",
    cart_value: "",
    item_summary: "",
    abandoned_at: today,
    status: "yeni",
    action_taken: "",
    incentive: "",
    recovered_value: "",
    notes: "",
  };

  return (
    <div>
      <PageHeader
        title="Yeni Sepet"
        description="Terk edilen bir sepeti ve kurtarma sürecini ekleyin"
      />
      <CartRecoveryForm mode="create" defaultValues={defaultValues} />
    </div>
  );
}
