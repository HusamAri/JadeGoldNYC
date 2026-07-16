import type { CostBearer } from "@/lib/types";

/**
 * Maliyete katlanan taraf (EON ortaklık yapısı) — tek doğruluk kaynağı.
 * H ve Y ortak tarafları, I ise tarafların kâr paylaşımından ÖNCE doğrudan
 * kârdan düşülen ortak giderleri temsil eder. Etiket/rozet niteliği burada
 * taşınır; dışarıda string-key eşleme haritası kurulmaz (yeni anahtar sessizce
 * yanlış sınıfa düşmesin).
 */
export const COST_BEARERS: {
  value: CostBearer;
  label: string;
  /** Liste rozeti için kısa etiket. */
  short: string;
  variant: "default" | "secondary" | "outline";
}[] = [
  { value: "H", label: "H tarafı", short: "H", variant: "default" },
  { value: "Y", label: "Y tarafı", short: "Y", variant: "secondary" },
  {
    value: "I",
    label: "Doğrudan kârdan (I)",
    short: "I · kârdan",
    variant: "outline",
  },
];

export function bearerMeta(bearer: CostBearer | null | undefined) {
  return COST_BEARERS.find((b) => b.value === bearer) ?? null;
}
