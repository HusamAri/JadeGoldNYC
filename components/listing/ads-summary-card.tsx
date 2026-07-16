import Link from "next/link";
import { BarChart3 } from "lucide-react";

import type { ListingAds, ListingLifetimeSales } from "@/lib/db/queries/listings";
import { formatMoney } from "@/lib/money";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

function roas(revenueCents: number, spendCents: number): string {
  return spendCents > 0 ? `${(revenueCents / spendCents).toFixed(1)}x` : "—";
}

/**
 * Reklam & performans özeti — iki sütun: '"son 30" etiketli dönem'
 * (kullanıcı girişli dönem etiketi eşleşmesi — takvimsel pencere DEĞİL) ve
 * "Ömürlük" (tüm metrik dönemlerinin toplamı + panel satış kayıtlarından
 * gerçek sipariş/adet/ciro). Altında dönem mini tablosu.
 * Hiç metrik yoksa /analizler/urunler'e yönlendiren boş durum.
 */
export function AdsSummaryCard({
  ads,
  lifetimeSales,
  currency,
}: {
  ads: ListingAds;
  lifetimeSales: ListingLifetimeSales;
  currency: string;
}) {
  if (ads.periods.length === 0) {
    return (
      <div className="space-y-4">
        <div className="nm-pressed flex flex-col items-center justify-center gap-3 rounded-[1.5rem] p-10 text-center">
          <div className="text-muted-foreground flex size-12 items-center justify-center rounded-full shadow-[var(--shadow-raised-sm)] [background-image:var(--nm-convex)]">
            <BarChart3 className="size-6" />
          </div>
          <div>
            <p className="text-sm font-semibold">Bu listing için metrik kaydı yok</p>
            <p className="text-muted-foreground mt-1 max-w-sm text-sm">
              Görüntüleme, sipariş ve Etsy Ads verisi dönem kayıtlarından gelir —
              Ürün Performansı&rsquo;ndan ekleyin.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/analizler/urunler">Ürün Performansı&rsquo;na git</Link>
          </Button>
        </div>
        {lifetimeSales.orders > 0 && (
          <p className="text-muted-foreground text-sm">
            Panel kayıtları (gerçek satış):{" "}
            <span className="text-foreground font-mono font-semibold tabular-nums">
              {formatNumber(lifetimeSales.orders)}
            </span>{" "}
            sipariş ·{" "}
            <span className="text-foreground font-mono font-semibold tabular-nums">
              {formatNumber(lifetimeSales.units)}
            </span>{" "}
            adet ·{" "}
            <span className="text-foreground font-mono font-semibold tabular-nums">
              {formatMoney(lifetimeSales.revenue_cents, currency)}
            </span>{" "}
            ciro (iptaller hariç).
          </p>
        )}
      </div>
    );
  }

  const lt = ads.lifetime_metrics;

  // Dürüst etiket: "son 30" bloğu GERÇEK bir tarih penceresi değil —
  // kullanıcının "son 30" geçen dönem etiketiyle girdiği kayıtların özeti
  // (etiket başına en güncel kayıt). Hangi etiketlerin eşleştiğini göster.
  const son30Labels = [
    ...new Set(
      ads.periods
        .filter((p) => p.period_label.toLowerCase().includes("son 30"))
        .map((p) => p.period_label),
    ),
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-6 md:grid-cols-2">
        {/* "son 30" etiketli dönem kayıtları — takvimsel pencere değil. */}
        <div className="space-y-3">
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
            &ldquo;Son 30&rdquo; etiketli dönem
          </p>
          {ads.son30 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat
                  label="Harcama"
                  value={formatMoney(ads.son30.spend_cents, currency)}
                />
                <Stat
                  label="ROAS"
                  value={roas(ads.son30.revenue_cents, ads.son30.spend_cents)}
                  hint={`getiri ${formatMoney(ads.son30.revenue_cents, currency)}`}
                />
                <Stat label="Tıklama" value={formatNumber(ads.son30.clicks)} />
                <Stat label="Sipariş" value={formatNumber(ads.son30.orders)} />
              </div>
              <p className="text-muted-foreground text-xs">
                Kullanıcı girişli dönem etiketi eşleşmesi
                {son30Labels.length > 0 && <> ({son30Labels.join(", ")})</>} —
                gerçek tarih penceresi değildir; etiket başına en güncel kayıt
                sayılır.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Son 30 gün kaydı yok — &ldquo;Etsy Ads · son 30g&rdquo; etiketli
              dönem girildiğinde burada görünür.
            </p>
          )}
        </div>

        {/* Ömürlük — tüm dönem toplamları + panel satış kayıtları. */}
        <div className="space-y-3">
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.16em] uppercase">
            Ömürlük
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Reklam harcaması"
              value={formatMoney(lt.spend_cents, currency)}
              hint={`${formatNumber(lt.periods)} dönem kaydının toplamı`}
            />
            <Stat
              label="ROAS"
              value={roas(lt.revenue_cents, lt.spend_cents)}
              hint={`getiri ${formatMoney(lt.revenue_cents, currency)}`}
            />
            <Stat label="Tıklama" value={formatNumber(lt.clicks)} />
            <Stat label="Görüntüleme" value={formatNumber(lt.views)} />
          </div>
          <div className="border-t pt-3">
            <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
              Gerçek satış · panel kayıtları
            </p>
            <p className="mt-1 text-sm">
              <span className="font-mono font-semibold tabular-nums">
                {formatNumber(lifetimeSales.orders)}
              </span>{" "}
              sipariş ·{" "}
              <span className="font-mono font-semibold tabular-nums">
                {formatNumber(lifetimeSales.units)}
              </span>{" "}
              adet ·{" "}
              <span className="font-mono font-semibold tabular-nums">
                {formatMoney(lifetimeSales.revenue_cents, currency)}
              </span>{" "}
              ciro
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Satış modülündeki kalemlerden; iptal edilen siparişler hariç.
            </p>
          </div>
        </div>
      </div>

      {/* Dönem mini tablosu. */}
      <div className="space-y-2 border-t pt-4">
        <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
          Dönem kayıtları · etiket başına en güncel (
          {formatNumber(ads.periods.length)})
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-left text-xs">
                <th className="py-1 pr-3 font-medium">Dönem</th>
                <th className="py-1 pr-3 text-right font-medium">Görüntüleme</th>
                <th className="py-1 pr-3 text-right font-medium">Sipariş</th>
                <th className="py-1 pr-3 text-right font-medium">Ciro</th>
                <th className="py-1 pr-3 text-right font-medium">Reklam</th>
                <th className="py-1 text-right font-medium">Reklam getirisi</th>
              </tr>
            </thead>
            <tbody>
              {ads.periods.map((p, i) => (
                <tr key={`${p.period_label}-${i}`} className="border-t">
                  <td className="py-1.5 pr-3 whitespace-nowrap">
                    {p.period_label}
                  </td>
                  <td className="py-1.5 pr-3 text-right font-mono tabular-nums">
                    {p.views != null ? formatNumber(p.views) : "—"}
                  </td>
                  <td className="py-1.5 pr-3 text-right font-mono tabular-nums">
                    {p.orders != null ? formatNumber(p.orders) : "—"}
                  </td>
                  <td className="py-1.5 pr-3 text-right font-mono tabular-nums">
                    {p.revenue_cents != null
                      ? formatMoney(p.revenue_cents, currency)
                      : "—"}
                  </td>
                  <td className="py-1.5 pr-3 text-right font-mono tabular-nums">
                    {p.ads_spend_cents != null
                      ? formatMoney(p.ads_spend_cents, currency)
                      : "—"}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums">
                    {p.ads_revenue_cents != null
                      ? formatMoney(p.ads_revenue_cents, currency)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
