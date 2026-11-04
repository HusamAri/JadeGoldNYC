import { notFound } from "next/navigation";
import { Coins, Receipt, TrendingUp, Wallet } from "lucide-react";

import type { MembershipWithOrg } from "@/lib/auth";
import type { SectionTone } from "@/components/layout/nav-items";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SaleStatusBadge } from "@/components/sale-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendChart, OrdersBarChart } from "@/components/charts/dashboard-charts";

export const metadata = { title: "Tema laboratuvarı" };

const TONES: SectionTone[] = ["olive", "moss", "lichen", "forest", "slate"];

const MEMBERSHIPS: MembershipWithOrg[] = [
  { id: "m1", org_id: "o1", user_id: "u1", role: "owner", orgName: "Jade Gold NYC" },
];

const TREND = Array.from({ length: 14 }, (_, i) => ({
  label: `${i + 1} Kas`,
  revenue: 420 + Math.round(Math.sin(i / 2) * 160) + i * 18,
  cost: 210 + Math.round(Math.cos(i / 3) * 60) + i * 7,
  prevRevenue: 380 + Math.round(Math.sin(i / 2 + 1) * 120) + i * 12,
}));
const ORDERS = Array.from({ length: 10 }, (_, i) => ({
  label: `${i + 1}`,
  orders: 2 + ((i * 7) % 5),
  prevOrders: 1 + ((i * 3) % 4),
}));

const ROWS = [
  { urun: "Heart Nugget Ring 14K", tarih: "03 Kas", adet: 1, gelir: 41200, altin: 18650, iscilik: 7400, kar: 10250, marj: 0.249, durum: "shipped" },
  { urun: "Cuban Link Chain 10K 20in", tarih: "02 Kas", adet: 1, gelir: 128900, altin: 71200, iscilik: 13000, kar: 28400, marj: 0.22, durum: "paid" },
  { urun: "Twin Seeds Band 18K", tarih: "01 Kas", adet: 2, gelir: 96400, altin: 51800, iscilik: 15000, kar: 15200, marj: 0.158, durum: "completed" },
  { urun: "Evil Eye Pendant 14K", tarih: "31 Eki", adet: 1, gelir: 23900, altin: 9100, iscilik: 6000, kar: -1800, marj: -0.075, durum: "refunded" },
] as const;

const money = (c: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);

/**
 * Tema laboratuvarı — yalnız geliştirmede (prod'da 404). Amuletta 2.0 soft UI
 * token'larını her bölüm tonunda, veri bağımlılığı olmadan gösterir;
 * Playwright ekran görüntüsü ve computed-contrast ölçümü buradan alınır.
 * `?tone=moss` ile ton seçilir.
 */
export default async function ThemeLabPage({
  searchParams,
}: {
  searchParams: Promise<{ tone?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const tone = (TONES.includes(sp.tone as SectionTone) ? sp.tone : "moss") as SectionTone;

  return (
    <div
      data-tone={tone}
      className="bg-background text-foreground relative isolate flex min-h-svh overflow-x-clip"
    >
      <Sidebar
        memberships={MEMBERSHIPS}
        activeOrgId="o1"
        showJadeGoldNav
        showBrandBookNav
        platformCapabilities={{}}
      />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-14 lg:py-14">
        <div className="page-stack">
          <PageHeader
            title="Satış & Maliyet"
            description={`Bölüm tonu: ${tone}. Soft UI kabuk, düz inset tablo kuyusu, altın vurgu.`}
            action={
              <>
                <Button variant="outline">CSV</Button>
                <Button>Etsy&apos;den satışları çek</Button>
              </>
            }
          />

          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <a
                key={t}
                href={`?tone=${t}`}
                data-testid={`tone-${t}`}
                className={
                  "nm-raised-sm rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.12em] uppercase " +
                  (t === tone ? "text-[color:var(--gold-deep)]" : "text-muted-foreground")
                }
              >
                {t}
              </a>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Net gelir" cents={290400} icon={Receipt} comparisons={[{ change: 0.12, label: "geçen ay" }]} />
            <KpiCard label="Altın maliyeti" cents={150750} icon={Coins} comparisons={[{ change: -0.04, label: "geçen ay" }]} />
            <KpiCard label="Net kâr" cents={52050} icon={TrendingUp} holo comparisons={[{ change: 0.21, label: "geçen ay" }]} />
            <KpiCard label="Marj" value="%17,9" icon={Wallet} accent="positive" hint="Etsy ücreti ve etiket düşülmüş" />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Gelir ve maliyet</CardTitle>
                <CardDescription>Son 14 gün, önceki dönem kesikli.</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart data={TREND} compareLabel="Önceki dönem" />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Günlük sipariş</CardTitle>
                <CardDescription>Vurgu sütunu en yüksek gün.</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersBarChart data={ORDERS} compareLabel="Önceki dönem" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Satılan kalemler</CardTitle>
              <CardDescription>Sayılar sağda, ilk kolon sabit, tek ince ayraç.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Input placeholder="Ürün, SKU veya sipariş ara" className="max-w-xs" />
                <Badge>Maliyeti eksik · 3</Badge>
                <Badge variant="outline">İade · 1</Badge>
              </div>
              <div className="table-well">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">Adet</TableHead>
                      <TableHead className="text-right">Net gelir</TableHead>
                      <TableHead className="text-right">Altın</TableHead>
                      <TableHead className="text-right">İşçilik</TableHead>
                      <TableHead className="text-right">Net kâr</TableHead>
                      <TableHead className="text-right">Marj</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ROWS.map((r) => (
                      <TableRow key={r.urun}>
                        <TableCell className="font-medium">{r.urun}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{r.tarih}</TableCell>
                        <TableCell className="text-right">{r.adet}</TableCell>
                        <TableCell className="text-right">{money(r.gelir)}</TableCell>
                        <TableCell className="text-right">{money(r.altin)}</TableCell>
                        <TableCell className="text-right">
                          <span className="nm-pressed inline-block rounded-lg px-2 py-0.5">{money(r.iscilik)}</span>
                        </TableCell>
                        <TableCell className={"text-right font-semibold " + (r.kar < 0 ? "text-[var(--negative)]" : "text-[var(--positive)]")}>
                          {money(r.kar)}
                        </TableCell>
                        <TableCell className="text-right">{(r.marj * 100).toFixed(1).replace(".", ",")}%</TableCell>
                        <TableCell><SaleStatusBadge status={r.durum} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
