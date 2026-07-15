"use client";

import { ArrowDownRight, CheckCircle2 } from "lucide-react";

import type { ListingGaps } from "@/lib/db/queries/listings";
import { LISTING_FIELD_IDS } from "@/components/listing/listing-fields-form";
import { Card, CardContent } from "@/components/ui/card";

/** Varyant bölümünün sayfa çapası (detay sayfasındaki section id'si). */
const VARIANTS_ANCHOR = "varyantlar";

function scrollToId(id: string, focus: boolean) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  if (focus) {
    // Kaydırma animasyonu bitmeden odaklanmak sıçratır — kısa gecikme.
    window.setTimeout(() => el.focus({ preventScroll: true }), 380);
  }
}

interface GapItem {
  key: string;
  label: string;
  count?: number;
  targetId: string;
  focus: boolean;
}

/**
 * Boşluk özeti kartı — künyede/varyantlarda eksik ne varsa tek listede;
 * her madde ilgili alana kaydırır ve odaklar (gram → varyant bölümü çapası,
 * kelime/açıklama/etiket/malzeme/fiyat → form alanı).
 */
export function ListingGapsCard({ gaps }: { gaps: ListingGaps }) {
  const items: GapItem[] = [];
  if (gaps.missing_weights > 0) {
    items.push({
      key: "weights",
      label: `${gaps.missing_weights}/${gaps.total_variants} varyantta gram eksik`,
      count: gaps.missing_weights,
      targetId: VARIANTS_ANCHOR,
      focus: false,
    });
  }
  if (gaps.no_weight) {
    items.push({
      key: "weight",
      label: "Gram (ağırlık) yok",
      targetId: VARIANTS_ANCHOR,
      focus: false,
    });
  }
  if (gaps.unpriced_variants > 0) {
    items.push({
      key: "unpriced",
      label: `${gaps.unpriced_variants} varyantta fiyat eksik`,
      count: gaps.unpriced_variants,
      targetId: VARIANTS_ANCHOR,
      focus: false,
    });
  }
  if (gaps.no_research_keyword) {
    items.push({
      key: "keyword",
      label: "Araştırma kelimesi yok",
      targetId: LISTING_FIELD_IDS.research_keyword,
      focus: true,
    });
  }
  if (gaps.no_description) {
    items.push({
      key: "description",
      label: "Açıklama boş",
      targetId: LISTING_FIELD_IDS.description,
      focus: true,
    });
  }
  if (gaps.no_tags) {
    items.push({
      key: "tags",
      label: "Etiket yok",
      targetId: LISTING_FIELD_IDS.tags,
      focus: true,
    });
  }
  if (gaps.no_materials) {
    items.push({
      key: "materials",
      label: "Malzeme yok",
      targetId: LISTING_FIELD_IDS.materials,
      focus: true,
    });
  }
  if (gaps.no_image) {
    items.push({
      key: "image",
      label: "Kapak görseli yok",
      targetId: "gorseller",
      focus: false,
    });
  }

  return (
    <Card className="h-fit">
      <CardContent className="space-y-3">
        <div className="idx">
          <span>Boşluklar</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
          <span className="tabular-nums">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <div className="flex items-center gap-2 text-sm font-medium text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]">
            <CheckCircle2 className="size-4" />
            Boşluk yok — künye tam.
          </div>
        ) : (
          <ul className="space-y-1">
            {items.map((it) => (
              <li key={it.key}>
                <button
                  type="button"
                  onClick={() => scrollToId(it.targetId, it.focus)}
                  className="hover:bg-accent/60 group flex w-full items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-left text-sm transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-amber-600 uppercase tabular-nums shadow-[var(--shadow-raised-sm)] dark:text-amber-400">
                      {it.count ?? "!"}
                    </span>
                    {it.label}
                  </span>
                  <ArrowDownRight className="text-muted-foreground size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <p className="text-muted-foreground text-xs">
            Maddeye tıklayın — ilgili alana götürür.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
