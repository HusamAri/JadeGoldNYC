import { TrendingUp } from "@/components/icons/lux-art";

import {
  getLatestKeywordResearch,
  getProductResearchMeta,
} from "@/lib/db/queries/keyword-research";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { KeywordResearchControls } from "@/components/keyword-research-controls";

/**
 * Rekabet fiyat araştırması paneli — bir listing için, "araştırma kelimesi"nde
 * Etsy'de organik çıkan ilk 10 rakip ürünün fiyat bandı + bizim fiyatımızın
 * konumu. Reklam/analiz sayfasında listing bağlamında gösterilir. Veri günlük
 * cron (7-grup rotasyon) ile dolar; henüz yoksa zarif boş durum.
 */
export async function KeywordResearchPanel({
  productId,
}: {
  productId: string | null | undefined;
}) {
  if (!productId) return null;
  const [snap, meta] = await Promise.all([
    getLatestKeywordResearch(productId),
    getProductResearchMeta(productId),
  ]);
  const fallbackTag = meta?.tags?.find((t) => t && t.trim().length > 0) ?? null;

  const cur = snap?.currency ?? "USD";
  const band =
    snap && snap.result_count > 0
      ? ([
          { k: "En düşük", v: snap.min_cents },
          { k: "Medyan", v: snap.median_cents },
          { k: "Ortalama", v: snap.avg_cents },
          { k: "En yüksek", v: snap.max_cents },
        ] as const)
      : null;

  // Bizim konum: rakiplerin yüzde kaçından pahalıyız (0 = en ucuz).
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

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="idx">
          <span>Rekabet · fiyat araştırması</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
          {snap && (
            <span className="normal-case">{formatDate(snap.researched_at)}</span>
          )}
        </div>

        {/* Anahtar kelime editörü + "şimdi araştır" — cron'u beklemeden test. */}
        <KeywordResearchControls
          productId={productId}
          currentKeyword={meta?.research_keyword ?? null}
          fallback={fallbackTag}
        />

        {/* Gram-normalize pazar konumu + spesifik aksiyon önerisi */}
        {snap?.recommendation && snap.price_position && snap.price_position !== "belirsiz" && (
          <div
            className={`space-y-1.5 rounded-lg border-l-4 p-3 ${
              snap.price_position === "pahali"
                ? "border-red-500 bg-red-500/5"
                : snap.price_position === "ucuz"
                  ? "border-sky-500 bg-sky-500/5"
                  : "border-emerald-500 bg-emerald-500/5"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${
                  snap.price_position === "pahali"
                    ? "bg-red-500/15 text-red-600"
                    : snap.price_position === "ucuz"
                      ? "bg-sky-500/15 text-sky-600"
                      : "bg-emerald-500/15 text-emerald-600"
                }`}
              >
                {snap.price_position === "pahali"
                  ? "Pazara göre pahalı"
                  : snap.price_position === "ucuz"
                    ? "Pazara göre ucuz"
                    : "Bant içinde"}
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
              {snap.confidence && (
                <span className="text-muted-foreground ml-auto text-[10px] uppercase">
                  {snap.confidence} güven
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed">{snap.recommendation}</p>
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
                · {snap.result_count} organik rakip
              </span>
            </div>

            {band ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {band.map((b) => (
                    <div key={b.k} className="space-y-0.5">
                      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                        {b.k}
                      </p>
                      <p className="font-mono text-lg font-semibold tabular-nums">
                        {b.v != null ? formatMoney(b.v, cur) : "—"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-baseline justify-between gap-2 border-t pt-3">
                  <span className="text-sm">
                    <span className="text-muted-foreground">Bizim fiyat: </span>
                    <span className="font-mono font-semibold tabular-nums">
                      {snap.our_price_cents != null
                        ? formatMoney(snap.our_price_cents, cur)
                        : "—"}
                    </span>
                  </span>
                  {posLabel && (
                    <span className={`flex items-center gap-1.5 text-sm font-medium ${posTone}`}>
                      <TrendingUp className="size-4" />
                      {posLabel}
                    </span>
                  )}
                </div>

                {/* Aynı-varyant karşılaştırması (derin mod — "şimdi araştır"). */}
                {snap.variant_comparison && snap.variant_comparison.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                      Aynı varyant · rakip fiyat bandı
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground text-left text-xs">
                            <th className="py-1 pr-3 font-medium">Varyant</th>
                            <th className="py-1 pr-3 text-right font-medium">Bizim</th>
                            <th className="py-1 pr-3 text-right font-medium">Rakip medyan</th>
                            <th className="py-1 pr-3 text-right font-medium">Bant</th>
                            <th className="py-1 text-right font-medium">Konum</th>
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
                                  <span className="text-muted-foreground">—</span>
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
                    <p className="text-muted-foreground text-xs">
                      Konum = rakiplerin yüzde kaçından pahalıyız (aynı beden/ayar
                      eşleşen rakipler). &ldquo;eşleşme yok&rdquo; = o varyantta aynı
                      beden/ayarlı rakip bulunamadı.
                    </p>
                  </div>
                )}

                {snap.results.length > 0 && (
                  <ul className="space-y-2 border-t pt-3">
                    <li className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
                      Organik ilk 10 rakip · mağaza + link
                    </li>
                    {snap.results.slice(0, 10).map((c) => (
                      <li
                        key={c.position}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline gap-1.5">
                            <span className="text-muted-foreground font-mono text-xs">
                              {String(c.position).padStart(2, "0")}
                            </span>
                            {c.url ? (
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-primary min-w-0 truncate hover:underline"
                              >
                                {c.title}
                              </a>
                            ) : (
                              <span className="text-muted-foreground min-w-0 truncate">
                                {c.title}
                              </span>
                            )}
                          </span>
                          {c.shop_name && (
                            <span className="text-muted-foreground ml-[1.7rem] block truncate text-xs">
                              {c.shop_name}
                            </span>
                          )}
                        </span>
                        <span className="font-mono tabular-nums shrink-0">
                          {formatMoney(c.price_cents, c.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
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
      </CardContent>
    </Card>
  );
}
