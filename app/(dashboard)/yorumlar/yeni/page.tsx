import { PageHeader } from "@/components/page-header";
import { ReviewForm } from "@/components/review-form";
import type { ReviewFormValues } from "@/lib/validations/review";

export const metadata = { title: "Yeni Yorum" };

export default function YeniYorumPage() {
  const today = new Date().toISOString().slice(0, 10);
  const defaultValues: ReviewFormValues = {
    buyer_name: "",
    rating: "",
    review_text: "",
    language: "",
    review_date: today,
    status: "yeni",
    internal_note: "",
  };

  return (
    <div>
      <PageHeader
        title="Yeni Yorum"
        description="Bir müşteri yorumunu elle ekleyin"
      />
      <ReviewForm mode="create" defaultValues={defaultValues} />
    </div>
  );
}
