import Image from "next/image";
import Link from "next/link";
import { Package, Info, Layers } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { listStockProducts, type StockProduct } from "@/lib/db/queries/stock";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StockQuantityInput } from "@/components/stock-quantity-input";
import { StockSyncPanel } from "@/components/stock-sync-panel";
import { VariantSyncButton } from "@/components/variant-sync-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-6">
      <PageHeader
        title="Stok Senkronizasyonu"
        description="Her ürün için elde/hedef adedi girin; hazır olunca tek tuşla Etsy ile çift yönlü eşitleyin."
        action={
          <Button asChild variant="outline">
            <Link href="/stok/varyant">
              <Layers />
              Varyant Stok
            </Link>
          </Button>
        }
      />

      <StockSyncPanel connected={access.connected} />

      <VariantSyncButton connected={access.connected} />

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Ürün yok"
          description="Önce Ayarlar → Etsy'den mağazanızı bağlayıp senkronize edin; aktif listeler burada görünür."
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <StatChip label="Ürün" value={products.length} />
            <StatChip label="Doldurulan" value={filled} />
            <StatChip label="Değişecek" value={pending} accent />
          </div>

          {!access.writeEnabled && access.connected && (
            <Card>
              <CardContent className="text-muted-foreground flex items-start gap-2 py-3 text-sm">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>
                  Etsy bağlantısı şu an salt-okunur. Adetleri Etsy&apos;ye
                  yazabilmek için{" "}
                  <Link
                    href="/ayarlar/etsy"
                    className="text-[color:var(--gold-deep,#9A7A34)] font-medium hover:underline"
                  >
                    Etsy&apos;yi yeniden bağlayın
                  </Link>{" "}
                  ve yazma iznini onaylayın. Doldurma ve önizleme yine çalışır.
                </span>
              </CardContent>
            </Card>
          )}

          {cats.map((cat) => {
            const rows = groups.get(cat)!;
            return (
              <section key={cat} className="space-y-2">
                <div className="flex items-baseline gap-3 border-b-2 border-[color:var(--gold,#B89347)] pb-2">
                  <h2 className="text-lg font-semibold">{cat}</h2>
                  <span className="text-muted-foreground ml-auto text-xs font-medium tabular-nums">
                    {formatNumber(rows.length)} ürün
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[52px]">Görsel</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="w-[110px]">SKU</TableHead>
                      <TableHead className="w-[80px] text-right">
                        Etsy Adet
                      </TableHead>
                      <TableHead className="w-[110px] text-right">
                        Hedef Stok
                      </TableHead>
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
                              className="size-10 rounded-md border border-[color:var(--line,#DED9CB)] object-cover"
                            />
                          ) : (
                            <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md text-[10px] font-semibold">
                              JG
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[320px] truncate font-medium">
                          {p.title}
                          {p.has_variations && (
                            <span className="text-muted-foreground ml-2 text-xs font-normal">
                              varyantlı
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {p.sku ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right tabular-nums">
                          {p.quantity ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <StockQuantityInput
                            productId={p.id}
                            initial={p.target_quantity}
                            current={p.quantity}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="inline-flex items-baseline gap-2 rounded-full border border-[color:var(--line,#DED9CB)] px-3.5 py-1.5">
      <b
        className={
          accent
            ? "text-[color:var(--gold-deep,#9A7A34)] tabular-nums"
            : "tabular-nums"
        }
      >
        {formatNumber(value)}
      </b>
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
