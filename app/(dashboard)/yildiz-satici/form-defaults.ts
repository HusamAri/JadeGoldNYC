import type { StarSellerSnapshot } from "@/lib/types";
import type { StarSellerFormValues } from "@/lib/validations/star-seller";

const s = (v: number | string | null | undefined) =>
  v == null ? "" : String(v);

export const EMPTY_FORM: StarSellerFormValues = {
  period_label: "",
  period_start: "",
  period_end: "",
  next_chance_on: "",
  message_response_rate: "",
  on_time_shipping_rate: "",
  avg_review_rating: "",
  low_review_count: "",
  case_count: "",
  order_count: "",
  note: "",
};

export function StarSellerFormValuesFromRow(
  r: StarSellerSnapshot,
): StarSellerFormValues {
  return {
    period_label: r.period_label ?? "",
    period_start: r.period_start ? r.period_start.slice(0, 10) : "",
    period_end: r.period_end ? r.period_end.slice(0, 10) : "",
    next_chance_on: r.next_chance_on ? r.next_chance_on.slice(0, 10) : "",
    message_response_rate: s(r.message_response_rate),
    on_time_shipping_rate: s(r.on_time_shipping_rate),
    avg_review_rating: s(r.avg_review_rating),
    low_review_count: s(r.low_review_count),
    case_count: s(r.case_count),
    order_count: s(r.order_count),
    note: r.note ?? "",
  };
}
