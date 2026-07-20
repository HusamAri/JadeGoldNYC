import Link from "next/link";

import { TrendingUp } from "@/components/icons/lux-art";

import {
  getLatestKeywordResearch,
  getProductResearchMeta,
  getProductDemandSignal,
  listCompetitorWatch,
  listCompetitorVariantMatches,
  listProductVariantOptions,
  diagnoseDemand,
} from "@/lib/db/queries/keyword-research";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KeywordResearchControls } from "@/components/keyword-research-controls";
import {
  AddCompetitorLinkForm,
  AddCompetitorToSetButton,
  CompetitorWatchList,
} from "@/components/listing/competitor-watch-card";
import { CompetitorProductRow } from "@/components/listing/competitor-product-row";
import { CompetitorSection } from "@/components/listing/competitor-section";
import { CompetitorMatchDialog } from "@/components/listing/competitor-match-dialog";

/**
 * Rekabet fiyat araştırması paneli — kompakt görselli rakip satırları,
 * başlıkla açılan bölümler (alttan kabarma), manuel varyant eşleştirme.
 */

/** Eski snapshot'larda listing_id yok — URL'den çöz (0091 sete ekleme). */
function listingIdFromUrl(url: string | null): number | null {
  if (!url) return null;
  const m = /\/listing\/(\d+)/.exec(url);
  return m ? Number(m[1]) : null;
}

const POSITION_LABELS: Record<string, string> = {
  pahali: "Pazara göre pahalı",
  ucuz: "Pazara göre ucuz",
  bantta: "Bant içinde",
};

export async function KeywordResearchPanel({
  productId,
  bare = false,
}: {
  productId: string | null | undefined;
  /** ListingPanel içindeyken true — çift Card çerçevesi olmasın. */
  bare?: boolean;
}) {
  if (!productId) return null;
  const [snap, meta, watchItems, matches, ourVariants] = await Promise.all([
    getLatestKeywordResearch(productId),
    getProductResearchMeta(productId),
    listCompetitorWatch(productId),
    listCompetitorVariantMatches(productId),
    listProductVariantOptions(productId),
  ]);
  const fallbackTag = meta?.tags?.find((t) => t && t.trim().length > 0) ?? null;

  const cur = snap?.currency ?? "USD";
  const bandCount = snap ? (snap.band_result_count ?? snap.result_count) : 0;
  const band =
    snap && bandCount > 0
      ? ([
          { k: "En düşük", v: snap.min_cents },
          { k: "Medyan", v: snap.median_cents },
          { k: "Ortalama", v: snap.avg_cents },
          { k: "En yüksek", v: snap.max_cents },
        ] as const)
      : null;

  const pct = snap?.our_rank_pct;
  const posLabel =
    pct == null
      ? null
      : pct <= 0.15
        ? "Bantta en ucuzlardan"
        : pct >= 0.85
          ? "Bantta en pahalılardan"
          : `Rakiplerin %${Math.round(pct * 100)}'inden pahalı`;
  const posTone =
    pct == null
      ? ""
      : pct >= 0.85
        ? "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]"
        : "text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]";

  const suspect = snap?.data_suspect === true;
  const showVerdict =
    !!snap &&
    (suspect || (snap.price_position && snap.price_position !== "belirsiz")) &&
    !!(snap.verdict_what ?? snap.recommendation);
  const bandSourceLabel =
    snap?.band_source === "rakip-seti" ? "Rakip seti" : "Organik arama";

  const demand =
    snap && (snap.price_position === "ucuz" || snap.price_position === "bantta")
      ? await getProductDemandSignal(productId)
      : null;
  const diagnosis = diagnoseDemand(demand);

  const verdictTone = suspect
    ? {
        block: "border-amber-500 bg-amber-500/5",
        badge: "bg-amber-500/15 text-amber-600",
        label: "Veri şüpheli",
      }
    : snap?.price_position === "pahali"
      ? {
          block: "border-red-500 bg-red-500/5",
          badge: "bg-red-500/15 text-red-600",
          label: POSITION_LABELS.pahali,
        }
      : snap?.price_position === "ucuz"
        ? {
            block: "border-sky-500 bg-sky-500/5",
            badge: "bg-sky-500/15 text-sky-600",
            label: POSITION_LABELS.ucuz,
          }
        : {
            block: "border-emerald-500 bg-emerald-500/5",
            badge: "bg-emerald-500/15 text-emerald-600",
            label: POSITION_LABELS.bantta,
          };

  const watchedIds = new Set(watchItems.map((w) => w.competitor_listing_id));
  const organicDefaultOpen =
    watchItems.length === 0 && (snap?.results?.length ?? 0) > 0;
  const variantDefaultOpen = false;

  const body = (
    <div className="space-y-3">
        <div className="idx">
          <span>Rekabet · fiyat araştırması</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
          {snap && (
            <span className="normal-case">{formatDate(snap.researched_at)}</span>
          )}
        </div>

        <KeywordResearchControls
          productId={productId}
          currentKeyword={meta?.research_keyword ?? null}
          fallback={fallbackTag}
        />

        {showVerdict && snap && (
          <div
            className={`space-y-2 rounded-xl border-l-4 p-3 shadow-[var(--lift-sm)] ${verdictTone.block}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${verdictTone.badge}`}
              >
                {verdictTone.label}
              </span>
              {snap.our_per_gram_cents != null && (
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  Biz ${(snap.our_per_gram_cents / 100).toFixed(0)}/g · pazar $
                  {snap.market_low_per_gram_cents != null
                    ? (snap.market_low_per_gram_cents / 100).toFixed(0)
                    : "—"}
                  –$
                  {snap.market_high_per_gram_cents != null
                    ? (snap.market_high_per_gram_cents / 100).toFixed(0)
                    : "—"}
                  /g
                </span>
              )}
              <span className="text-muted-foreground ml-auto flex items-center gap-2 text-[10px] uppercase">
                <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5">
                  {bandSourceLabel}
                </span>
                {snap.confidence && <span>{snap.confidence} güven</span>}
              </span>
            </div>

            <p className="text-sm leading-relaxed">
              <span className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                Neden ·{" "}
              </span>
              {snap.verdict_why ?? snap.recommendation}
            </p>
            <p className="text-muted-foreground text-xs">
              Veri: band {bandCount} rakiptan ({bandSourceLabel}) ·{" "}
              {snap.result_count} organik sonuç ·{" "}
              {formatDate(snap.researched_at)}
              {snap.basis_note ? ` · ${snap.basis_note}` : ""}
            </p>

            {(snap.verdict_action ?? snap.recommendation) && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
                <p className="min-w-0 flex-1 text-sm leading-relaxed">
                  <span className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                    Ne yap ·{" "}
                  </span>
                  {snap.verdict_action ?? snap.recommendation}
                </p>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={`/tasarimlar/listing/${productId}`}>
                    {suspect ? "Ağırlığı düzelt" : "Listing'i düzenle"}
                  </Link>
                </Button>
              </div>
            )}

            {diagnosis && (
              <p className="border-t pt-2 text-sm leading-relaxed">
                <span className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                  Teşhis ·{" "}
                </span>
                {diagnosis.text}
              </p>
            )}
          </div>
        )}

        {!snap ? (
          <p className="text-muted-foreground text-sm">
            Bu listing için henüz araştırma yok. Sistem tüm listingleri 7 gruba
            böler ve her gün bir grubu tarar — bu listing sıraya girdiğinde (en geç
            7 gün içinde) veya Etsy bağlıysa otomatik dolar. Araştırma kelimesi
            listing&apos;in birincil etiketinden alınır; farklı bir kelime için ürünün{" "}
            <span className="font-medium">araştırma kelimesi</span> alanını girin.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Anahtar kelime:</span>
              <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 font-mono text-xs tracking-wide uppercase">
                {snap.keyword}
              </span>
              <span className="text-muted-foreground">
                · band {bandCount} rakip ({bandSourceLabel}) ·{" "}
                {snap.result_count} organik ·{" "}
                {formatDate(snap.researched_at)}
              </span>
            </div>

            {band ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {band.map((b) => (
                    <div key={b.k} className="space-y-0.5">
                      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                        {b.k}
                      </p>
                      <p className="font-mono text-base font-semibold tabular-nums">
                        {b.v != null ? formatMoney(b.v, cur) : "—"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-2">
                  <span className="text-sm">
                    <span className="text-muted-foreground">Bizim fiyat: </span>
                    <span className="font-mono font-semibold tabular-nums">
                      {snap.our_price_cents != null
                        ? formatMoney(snap.our_price_cents, cur)
                        : "—"}
                    </span>
                  </span>
                  {posLabel && (
                    <span
                      className={`flex items-center gap-1.5 text-sm font-medium ${posTone}`}
                    >
                      <TrendingUp className="size-4" />
                      {posLabel}
                    </span>
                  )}
                </div>

                {snap.variant_comparison &&
                  snap.variant_comparison.length > 0 && (
                    <CompetitorSection
                      title="Aynı varyant · rakip bandı"
                      meta={`${snap.variant_comparison.length} satır`}
                      defaultOpen={variantDefaultOpen}
                    >
                      <div className="overflow-x-auto px-1">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-muted-foreground text-left text-xs">
                              <th className="py-1 pr-3 font-medium">Varyant</th>
                              <th className="py-1 pr-3 text-right font-medium">
                                Bizim
                              </th>
                              <th className="py-1 pr-3 text-right font-medium">
                                Rakip medyan
                              </th>
                              <th className="py-1 pr-3 text-right font-medium">
                                Bant
                              </th>
                              <th className="py-1 text-right font-medium">
                                Konum
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {snap.variant_comparison.map((v) => (
                              <tr key={v.sku} className="border-t">
                                <td className="py-1.5 pr-3">{v.label}</td>
                                <td className="py-1.5 pr-3 text-right font-mono tabular-nums">
                                  {v.our_price_cents != null
                                    ? formatMoney(v.our_price_cents, cur)
                                    : "—"}
                                </td>
                                <td className="py-1.5 pr-3 text-right font-mono tabular-nums">
                                  {v.median_cents != null
                                    ? formatMoney(v.median_cents, cur)
                                    : "—"}
                                </td>
                                <td className="text-muted-foreground py-1.5 pr-3 text-right font-mono text-xs tabular-nums">
                                  {v.basis === "variant" && v.min_cents != null
                                    ? `${formatMoney(v.min_cents, cur)}–${formatMoney(v.max_cents!, cur)} · ${v.competitor_count}`
                                    : "eşleşme yok"}
                                </td>
                                <td className="py-1.5 text-right">
                                  {v.our_rank_pct == null ? (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  ) : (
                                    <span
                                      className={
                                        v.our_rank_pct >= 0.85
                                          ? "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]"
                                          : "text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]"
                                      }
                                    >
                                      %{Math.round(v.our_rank_pct * 100)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-muted-foreground px-1 text-xs">
                        Manuel eşleştirme satırlardaki{" "}
                        <span className="font-medium">Eşleştir</span> ile yapılır;
                        sonraki derin araştırmada banda yansır.
                      </p>
                    </CompetitorSection>
                  )}

                {snap.results.length > 0 && (
                  <CompetitorSection
                    title="İlgili ürünler · organik"
                    meta={`${Math.min(10, snap.results.length)} rakip`}
                    defaultOpen={organicDefaultOpen}
                  >
                    <ul className="divide-y divide-[color-mix(in_oklab,var(--border)_40%,transparent)]">
                      {snap.results.slice(0, 10).map((c) => {
                        const listingId =
                          c.listing_id ?? listingIdFromUrl(c.url);
                        return (
                          <CompetitorProductRow
                            key={c.position}
                            imageUrl={c.image_url}
                            title={c.title}
                            href={c.url}
                            shop={c.shop_name}
                            rank={c.position}
                            price={formatMoney(c.price_cents, c.currency)}
                            actions={
                              listingId != null ? (
                                <>
                                  <CompetitorMatchDialog
                                    productId={productId}
                                    competitorListingId={listingId}
                                    competitorTitle={c.title}
                                    currency={c.currency}
                                    ourVariants={ourVariants}
                                    existingMatches={matches}
                                    fallbackPriceCents={c.price_cents}
                                  />
                                  <AddCompetitorToSetButton
                                    productId={productId}
                                    competitor={{
                                      listing_id: listingId,
                                      url: c.url,
                                      title: c.title,
                                      shop_name: c.shop_name,
                                      image_url: c.image_url,
                                    }}
                                    watched={watchedIds.has(listingId)}
                                  />
                                </>
                              ) : undefined
                            }
                          />
                        );
                      })}
                    </ul>
                  </CompetitorSection>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                &ldquo;{snap.keyword}&rdquo; için aynı para biriminde fiyatlı organik
                rakip bulunamadı (son tarama: {formatDate(snap.researched_at)}).
              </p>
            )}
          </>
        )}

        <CompetitorWatchList
          productId={productId}
          items={watchItems}
          ourVariants={ourVariants}
          matches={matches}
          currency={cur}
        />

        <div className="nm-pressed rounded-2xl px-3 py-2.5">
          <AddCompetitorLinkForm
            productId={productId}
            currentCount={watchItems.length}
          />
        </div>
    </div>
  );

  if (bare) return body;
  return (
    <Card>
      <CardContent className="space-y-3">{body}</CardContent>
    </Card>
  );
}
