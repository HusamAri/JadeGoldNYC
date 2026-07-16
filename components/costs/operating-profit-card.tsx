import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

import {
  getOperatingProfitSeries,
  type OperatingMonth,
} from "@/lib/db/queries/operating-profit";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

/**
 * İşletme kârı (EBITDA) kartı — /maliyetler.
 *
 * Fiyat motoru sipariş-başı katkıyı korur; bu kart İŞLETME seviyesini anlatır:
 * ay bazında Gelir − Değişken = Katkı; Katkı − Sabit = EBITDA; ve sabit
 * gideri karşılamak için gereken sipariş adedi (başa-baş). Sınıflandırma
 * kategoride (`is_fixed`); kategorisiz tutar ayrı sütunda dürüstçe görünür,
 * USD-dışı kayıt varsa toplama girmediği açıkça söylenir.
 */
export async function OperatingProfitCard({ orgId }: { orgId: string }) {
  const s = await getOperatingProfitSeries(orgId, 6);
  if (!s.available) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-5 text-sm">
          İşletme kârı görünümü için 0097 migration&apos;ı
          (operating_profit_monthly) henüz uygulanmamış.
        </CardContent>
      </Card>
    );
  }
  const rows = [...s.months].reverse(); // en yeni ay üstte
  const current = rows[0];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-carved text-xs font-semibold tracking-wider uppercase">
              İşletme kârı (EBITDA)
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Gelir − değişken = katkı · katkı − sabit = işletme kârı ·
              başa-baş = sabiti karşılayan sipariş adedi
            </p>
          </div>
          {current ? <MonthBadge m={current} /> : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left text-xs">
                <th className="py-1.5 pr-3 font-medium">Ay</th>
                <th className="py-1.5 pr-3 text-right font-medium">Gelir</th>
                <th className="py-1.5 pr-3 text-right font-medium">Değişken</th>
                <th className="py-1.5 pr-3 text-right font-medium">Katkı</th>
                <th className="py-1.5 pr-3 text-right font-medium">Sabit</th>
                <th className="py-1.5 pr-3 text-right font-medium">EBITDA</th>
                <th className="py-1.5 text-right font-medium">Başa-baş</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m, i) => (
                <tr
                  key={m.month}
                  className={cn(
                    "border-b border-dashed last:border-0",
                    i === 0 && "font-medium",
                  )}
                >
                  <td className="py-1.5 pr-3 whitespace-nowrap">
                    {m.month}
                    {i === 0 ? (
                      <span className="text-muted-foreground ml-1 text-[10px]">
                        (bu ay)
                      </span>
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatMoney(m.revenue_cents, "USD")}
                    <span className="text-muted-foreground ml-1 text-[10px]">
                      {m.orders} sip.
                    </span>
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatMoney(m.variable_cents, "USD")}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatMoney(m.contribution_cents, "USD")}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {formatMoney(m.fixed_cents, "USD")}
                  </td>
                  <td
                    className={cn(
                      "py-1.5 pr-3 text-right tabular-nums",
                      m.ebitda_cents > 0 && "text-emerald-600 dark:text-emerald-400",
                      m.ebitda_cents < 0 && "text-red-600 dark:text-red-400",
                    )}
                  >
                    {formatMoney(m.ebitda_cents, "USD")}
                  </td>
                  <td className="text-muted-foreground py-1.5 text-right tabular-nums">
                    {m.breakeven_orders != null
                      ? `${m.breakeven_orders} sip.`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Warnings s={{ rows, salesNonUsd: s.salesNonUsd, costsNonUsd: s.costsNonUsd }} />
      </CardContent>
    </Card>
  );
}

function MonthBadge({ m }: { m: OperatingMonth }) {
  const positive = m.ebitda_cents >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
        positive
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "bg-red-500/10 text-red-700 dark:text-red-300",
      )}
    >
      <Icon className="size-4" />
      {formatMoney(m.ebitda_cents, "USD")}
      <span className="font-normal opacity-70">bu ay</span>
    </div>
  );
}

function Warnings({
  s,
}: {
  s: { rows: OperatingMonth[]; salesNonUsd: number; costsNonUsd: number };
}) {
  const uncategorized = s.rows.reduce((a, m) => a + m.uncategorized_cents, 0);
  const notes: string[] = [];
  if (uncategorized > 0)
    notes.push(
      `${formatMoney(uncategorized, "USD")} kategorisiz maliyet hesap DIŞI kaldı — kategorize et ki katkı/sabit doğru ayrışsın.`,
    );
  if (s.salesNonUsd > 0 || s.costsNonUsd > 0)
    notes.push(
      `USD dışı ${s.salesNonUsd + s.costsNonUsd} kayıt toplama girmedi (kurlar tek sayıya toplanmaz).`,
    );
  if (!notes.length) return null;
  return (
    <div className="text-muted-foreground mt-3 space-y-1 text-xs">
      {notes.map((n) => (
        <p key={n} className="flex items-start gap-1.5">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
          {n}
        </p>
      ))}
    </div>
  );
}
