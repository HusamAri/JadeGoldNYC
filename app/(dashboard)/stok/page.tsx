import { getActivePlatform } from "@/lib/platform";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

import { requireMembership, isManager } from "@/lib/auth";
import { listStockProducts, type StockProduct } from "@/lib/db/queries/stock";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StockQuantityInput } from "@/components/stock-quantity-input";
import { StockSyncPanel } from "@/components/stock-sync-panel";
import { VariantSyncButton } from "@/components/variant-sync-button";
import { Bezel, Screen, FmDial } from "@/components/instruments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Stok" };
export const maxDuration = 60;

const CATEGORY_ORDER = [
  "Zincir / Kolye",
  "Bileklik",
  "Küpe",
  "Yüzük",
  "Kolye Ucu",
  "Diğer",
];

function categorize(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("earring")) return "Küpe";
  if (t.includes("bracelet")) return "Bileklik";
  if (t.includes("ring")) return "Yüzük";
  if (
    t.includes("pendant") ||
    t.includes("charm") ||
    t.includes("medallion") ||
    t.includes("crucifix")
  )
    return "Kolye Ucu";
  if (t.includes("chain") || t.includes("necklace")) return "Zincir / Kolye";
  return "Diğer";
}

export default async function StokPage() {
  const m = await requireMembership();
  const platform = await getActivePlatform();
  const canEdit = isManager(m.role);
  const [products, access] = await Promise.all([
    listStockProducts(m.org_id),
    getEtsyWriteAccess(m.org_id),
  ]);

  const groups = new Map<string, StockProduct[]>();
  for (const p of products) {
    const cat = categorize(p.title);
    const list = groups.get(cat) ?? [];
    list.push(p);
    groups.set(cat, list);
  }
  const cats = CATEGORY_ORDER.filter((c) => groups.has(c)).concat(
    [...groups.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  );

  const filled = products.filter((p) => p.target_quantity != null).length;
  const pending = products.filter(
    (p) => p.target_quantity != null && p.target_quantity !== p.quantity,
  ).length;

  return (
    <div className="flex flex-col gap-8 pb-24">
      <PageHeader
        eyebrow="08 · Stok & Fiyat"
        meta={`${formatNumber(products.length)} ürün`}
        title="Stok Senkronu"
        description={`Her ürün için elde/hedef adedi girin; hazır olunca tek tuşla ${platform.label} ile çift yönlü eşitleyin.`}
        secondary={
          <Link className="ghost-link" href="/stok/varyant">
            Varyant stok
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Ürün yok"
          description="Önce Ayarlar → Etsy'den mağazanızı bağlayıp senkronize edin; aktif listeler burada görünür."
        />
      ) : (
        /* Kumanda masası: solda durum ekranı + anahtarlar, sağda yoğun düz ızgara. */
        <section className="grid gap-x-12 gap-y-10 xl:grid-cols-[320px_1fr]">
          <aside className="flex min-w-0 flex-col gap-5 xl:sticky xl:top-20 xl:self-start">
            <div className="sec-h">
              <span className="num">A</span>
              <h2>Durum</h2>
            </div>
            <Bezel>
              <Screen>
                <div className="flex justify-between">
                  <span className="dim">Değişecek · hedef ≠ Etsy</span>
                  <span className="dim">● stok</span>
                </div>
                <div className="lcd mt-2 text-[44px] leading-none">{formatNumber(pending)}</div>
                <FmDial
                  pos={products.length > 0 ? filled / products.length : null}
                  labels={["0", `${formatNumber(products.length)}`]}
                  className="mt-2"
                />
                <div className="mt-1 flex justify-between">
                  <span className="dim">{formatNumber(filled)} doldurulan</span>
                  <span className="dim">{formatNumber(products.length)} ürün</span>
                </div>
              </Screen>
            </Bezel>
            <StockSyncPanel connected={access.connected} />
            <VariantSyncButton connected={access.connected} />
            {!access.writeEnabled && access.connected && (
              <p className="note">
                <span className="mark">†</span>
                <span>
                  Etsy bağlantısı şu an salt-okunur. Adetleri Etsy&apos;ye yazabilmek için{" "}
                  <Link href="/ayarlar/etsy" className="ghost-link">
                    Etsy&apos;yi yeniden bağlayın
                  </Link>{" "}
                  ve yazma iznini onaylayın. Doldurma ve önizleme yine çalışır.
                </span>
              </p>
            )}
          </aside>

          <div className="flex min-w-0 flex-col gap-8">
            {cats.map((cat, i) => {
              const rows = groups.get(cat)!;
              return (
                <section key={cat}>
                  <div className="sec-h">
                    <span className="num">{String.fromCharCode(66 + i)}</span>
                    <h2>{cat}</h2>
                    <span className="mono-label right">{formatNumber(rows.length)} ürün</span>
                  </div>
                  <Table well={false} className="ledger">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[52px]">Görsel</TableHead>
                        <TableHead>Ürün</TableHead>
                        <TableHead className="w-[130px]">SKU</TableHead>
                        <TableHead className="w-[90px] text-right">Etsy adet</TableHead>
                        <TableHead className="w-[120px] text-right">Hedef stok</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            {p.image_url ? (
                              <Image
                                src={p.image_url}
                                alt={p.title}
                                width={40}
                                height={40}
                                unoptimized
                                className="size-10 rounded-[8px] border border-[color:var(--rule-2)] object-cover"
                              />
                            ) : (
                              <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-[8px] font-mono text-[10px]">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[360px] font-medium">
                            <div className="scroll-x">
                              {p.title}
                              {p.has_variations && <span className="mono-label ml-2">varyantlı</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-xs">{p.sku ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground text-right tabular-nums">{p.quantity ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <StockQuantityInput
                              productId={p.id}
                              initial={p.target_quantity}
                              current={p.quantity}
                              canEdit={canEdit}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </section>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
