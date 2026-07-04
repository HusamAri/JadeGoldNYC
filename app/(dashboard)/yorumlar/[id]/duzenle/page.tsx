import { notFound } from "next/navigation";

import { getReview } from "@/lib/db/queries/reviews";
import { PageHeader } from "@/components/page-header";
import { ReviewForm } from "@/components/review-form";
import { ReviewResponsePanel } from "@/components/review-response-panel";
import type { ReviewFormValues } from "@/lib/validations/review";

export const metadata = { title: "Yorumu Düzenle" };

export default async function YorumDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await getReview(id);
  if (!r) notFound();

  const defaultValues: ReviewFormValues = {
    buyer_name: r.buyer_name ?? "",
    rating: r.rating != null ? String(r.rating) : "",
    review_text: r.review_text ?? "",
    language: r.language ?? "",
    review_date: r.review_date ? r.review_date.slice(0, 10) : "",
    status: r.status,
    internal_note: r.internal_note ?? "",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yorumu Düzenle"
        description={r.buyer_name ?? undefined}
      />
      <ReviewResponsePanel
        reviewId={r.id}
        rating={r.rating}
        reviewText={r.review_text}
        buyerName={r.buyer_name}
        respondedAt={r.responded_at}
        initialResponse={r.response_text}
      />
      <ReviewForm mode="edit" reviewId={r.id} defaultValues={defaultValues} />
    </div>
  );
}
