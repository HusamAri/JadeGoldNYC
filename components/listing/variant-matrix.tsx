import {
  getProductVariantMatrix,
  type VariantMatrixCell,
} from "@/lib/db/queries/variants";
import { formatMoney } from "@/lib/money";
import { clampDiscountPct, discountedCents } from "@/lib/discount";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Varyant matrisi (genişlik × beden) — EON alyanslarında her varyantın fiyat +
 * gramajını tek bakışta 2-D tabloda gösterir. Satır = Width (mm artan),
 * sütun = beden bandı (sabit sıra). Boş hücre "—". İlk sütun (genişlik)
 * yapışkan; yatay kaydırma sarıcısı sayfayı bozmaz. Server component —
 * getProductVariantMatrix RLS ile org'a kilitli.
 *
 * İsteğe bağlı rakip örtüsü: aynı (Width, band) hücresi için varyant-seviyesi
 * rakip fiyatı VARSA renkli nokta + fiyat + fark işareti gösterilir. Şu an
 * rakip verisi listing-seviyesidir (varyant kırılımı yok) — bu yüzden örtü
 * verilmezse hücre yalnız EON fiyatını temiz gösterir; rakip hücresi UYDURULMAZ.
 */

/** Rakip örtü hücresi — sağlanırsa eşleşen (width, band) hücresinde gösterilir. */
export interface VariantCompetitorCell {
  width: string;
  band: string;
  color: string;
  price_cents: number;
  currency: string;
}

/** Gramı 1–2 ondalıkla gösterir (7.876 → "7.88"). */
function formatGrams(g: number): string {
  return g.toFixed(2).replace(/\.?0+$/, (m) => (m === ".00" ? "" : m));
}

function Cell({
  cell,
  overlay,
  discountPct,
}: {
  cell: VariantMatrixCell | null;
  overlay: VariantCompetitorCell | null;
  /** Aktif indirim (0..90). >0 ise hücrede indirimli fiyat gösterilir. */
  discountPct: number;
}) {
  if (!cell || cell.price_cents == null) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  const delta =
    overlay && overlay.currency === cell.currency && cell.price_cents != null
      ? cell.price_cents - overlay.price_cents
      : null;
  // İndirimli fiyat (yalnız panelde; taban Etsy fiyatı değişmez).
  const disc =
    discountPct > 0 ? discountedCents(cell.price_cents, discountPct) : null;
  const discounted = disc != null && disc !== cell.price_cents;
  return (
    <div className="space-y-0.5">
      {discounted ? (
        <>
          <p className="font-mono text-sm font-semibold tabular-nums text-[color:var(--tl-doing)]">
            {formatMoney(disc as number, cell.currency)}
          </p>
          <p className="text-muted-foreground/80 font-mono text-[10px] tabular-nums line-through">
            {formatMoney(cell.price_cents, cell.currency)}
          </p>
        </>
      ) : (
        <p className="font-mono text-sm font-semibold tabular-nums">
          {formatMoney(cell.price_cents, cell.currency)}
        </p>
      )}
      {cell.weight_grams != null && cell.weight_grams > 0 && (
        <p className="text-muted-foreground font-mono text-[11px] tabular-nums">
          {formatGrams(cell.weight_grams)} g
        </p>
      )}
      {overlay && (
        <p className="flex items-center justify-end gap-1 font-mono text-[11px] tabular-nums">
          <span
            aria-hidden
            className="inline-block size-2 shrink-0 rounded-full"
            style={{ backgroundColor: overlay.color }}
          />
          <span className="text-muted-foreground">
            {formatMoney(overlay.price_cents, overlay.currency)}
          </span>
          {delta != null && delta !== 0 && (
            <span
              className={
                delta > 0
                  ? "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]"
                  : "text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]"
              }
            >
              {delta > 0 ? "+" : ""}
              {formatMoney(delta, cell.currency)}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export async function VariantMatrix({
  productId,
  competitors,
  discountPct = 0,
}: {
  productId: string;
  /** İsteğe bağlı varyant-seviyesi rakip örtüsü (şu an veri yok → temiz matris). */
  competitors?: VariantCompetitorCell[];
  /** Manuel indirim yüzdesi (products.discount_pct). >0 → indirimli fiyat. */
  discountPct?: number;
}) {
  const matrix = await getProductVariantMatrix(productId);
  if (matrix.rows.length === 0) return null;
  const pct = clampDiscountPct(discountPct);

  // (width|band) → rakip örtüsü; verilmezse boş harita (hücreler temiz kalır).
  const overlayByCell = new Map<string, VariantCompetitorCell>();
  for (const c of competitors ?? [])
    overlayByCell.set(`${c.width}|${c.band}`, c);

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="idx">
          <span>Varyant matrisi · genişlik × beden</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
          <span className="normal-case">
            {matrix.rows.length} genişlik · {matrix.bands.length} band
          </span>
        </div>

        <p className="text-muted-foreground text-sm">
          Her hücrede üstte fiyat, altında gram. Genişlik sütunu yatay
          kaydırmada sabit kalır.
          {pct > 0 && (
            <>
              {" "}
              <span className="text-[color:var(--tl-doing)] font-medium">
                %{pct} indirim uygulandı
              </span>{" "}
              — indirimli fiyat üstte, üstü çizili taban altında (yalnız panel;
              Etsy fiyatı değişmez).
            </>
          )}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-muted-foreground text-left text-xs">
                <th className="bg-card sticky left-0 z-10 py-2 pr-3 font-mono text-[10px] tracking-[0.12em] uppercase">
                  Genişlik
                </th>
                {matrix.bands.map((b) => (
                  <th
                    key={b}
                    className="py-2 pr-3 text-right font-mono text-[10px] tracking-[0.12em] whitespace-nowrap uppercase"
                  >
                    {b}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row) => (
                <tr key={row.width}>
                  <td className="bg-card sticky left-0 z-10 border-t py-2.5 pr-3 font-mono text-sm font-semibold whitespace-nowrap tabular-nums">
                    {row.width}
                  </td>
                  {row.cells.map((cell, i) => (
                    <td
                      key={matrix.bands[i]}
                      className="border-t py-2.5 pr-3 text-right align-top"
                    >
                      <Cell
                        cell={cell}
                        discountPct={pct}
                        overlay={
                          overlayByCell.get(
                            `${row.width}|${matrix.bands[i]}`,
                          ) ?? null
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
