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

                {snap.results.length > 0 && (
                  <ul className="space-y-1.5">
                    {snap.results.slice(0, 10).map((c) => (
                      <li
                        key={c.position}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="text-muted-foreground min-w-0 truncate">
                          <span className="font-mono text-xs">
                            {String(c.position).padStart(2, "0")}
                          </span>{" "}
                          {c.url ? (
                            <a
                              href={c.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="hover:text-foreground hover:underline"
                            >
                              {c.title}
                            </a>
                          ) : (
                            c.title
                          )}
                        </span>
                        <span className="font-mono tabular-nums">
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
