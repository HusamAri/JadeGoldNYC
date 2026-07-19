import Link from "next/link";
import { Lightbulb, Archive, Plus, ExternalLink, ImageOff } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { listListingsIndex } from "@/lib/db/queries/listings";
import { formatMoney } from "@/lib/money";
import { OrgMark } from "@/components/brand/org-mark";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListingLifecycleButton } from "@/components/listing/listing-lifecycle-button";
import { ReconcileEtsyButton } from "@/components/listing/reconcile-etsy-button";

export const metadata = { title: "Listing Önerileri" };

/**
 * Listing Önerileri — Etsy'de HENÜZ/ARTIK olmayan listing'ler.
 * Ana "Listeler" ekranı yalnız Etsy'de var olanları gösterir (Etsy-ayna kuralı);
 * bu ekran iki grubu barındırır:
 *   • Panel Taslakları — panelde hazırlanmış, Etsy'ye gönderilmemiş öneriler.
 *   • Arşiv — panelden gizlenmiş (archived_at) listing'ler.
 */
export default async function ListingOnerileriPage() {
  await requireMembership();
  const [drafts, archived] = await Promise.all([
    listListingsIndex({ scope: "suggestions" }),
    listListingsIndex({ scope: "archived" }),
  ]);

  return (
    <div className="relative z-0 space-y-8 pb-28">
      <GoldStream motif="ring" />
      <PageHeader
        title="Listing Önerileri"
        description="Etsy'de henüz olmayan panel taslakları ve arşivlenmiş listing'ler. Ana Listeler ekranı yalnız Etsy'de var olanları gösterir."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ReconcileEtsyButton />
            <Button asChild variant="outline">
              <Link href="/tasarimlar/listing/yeni">
                <Plus />
                Yeni Taslak
              </Link>
            </Button>
          </div>
        }
      />

      {/* 01 · Panel taslakları — Etsy'ye gönderilmeyi bekleyen öneriler. */}
      <section className="space-y-4">
        <div aria-hidden className="idx">
          <span>Öneriler / 01 · Panel Taslakları</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
          <span>
            <OrgMark />
          </span>
        </div>
        <Card>
          <CardContent className="space-y-4">
            {drafts.length === 0 ? (
              <EmptyState
                icon={Lightbulb}
                title="Panel taslağı yok"
                description="Etsy'ye gönderilmeyi bekleyen taslak yok. 'Yeni Taslak' ile öneri ekleyebilirsiniz."
              />
            ) : (
              <>
                <p className="text-muted-foreground text-xs">
                  {drafts.length} taslak · Etsy&apos;de değil — gönderilince ana
                  Listeler&apos;e taşınır.
                </p>
                <LifecycleTable rows={drafts} mode="archive" showEtsy={false} />
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 02 · Arşiv — panelden gizlenmiş listing'ler (Etsy'ye dokunulmaz). */}
      <section className="space-y-4">
        <div aria-hidden className="idx">
          <span>Öneriler / 02 · Arşiv</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
          <span>
            <OrgMark />
          </span>
        </div>
        <Card>
          <CardContent className="space-y-4">
            {archived.length === 0 ? (
              <EmptyState
                icon={Archive}
                title="Arşiv boş"
                description="Arşivlenmiş listing yok. Listeler ya da taslaklardan arşivlediğiniz kayıtlar burada toplanır."
              />
            ) : (
              <>
                <p className="text-muted-foreground text-xs">
                  {archived.length} arşivli · panel listelerinden gizli.
                  Arşivden çıkarınca yeniden görünür.
                </p>
                <LifecycleTable rows={archived} mode="restore" showEtsy />
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function LifecycleTable({
  rows,
  mode,
  showEtsy,
}: {
  rows: Awaited<ReturnType<typeof listListingsIndex>>;
  mode: "archive" | "restore";
  showEtsy: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">Görsel</TableHead>
          <TableHead>Başlık</TableHead>
          <TableHead className="text-right">Fiyat</TableHead>
          <TableHead className="text-right">Varyant</TableHead>
          {showEtsy && <TableHead className="w-1 text-right">Etsy</TableHead>}
          <TableHead className="w-1 text-right">İşlem</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>
              {r.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.image_url}
                  alt=""
                  className="size-10 rounded-md object-cover"
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
                  <ImageOff className="size-4" />
                </div>
              )}
            </TableCell>
            <TableCell className="font-medium">
              <Link
                href={`/tasarimlar/listing/${r.id}`}
                className="hover:underline"
              >
                <span className="scroll-x block max-w-[420px]" title={r.title}>
                  {r.title}
                </span>
              </Link>
              <div className="text-muted-foreground mt-0.5 font-mono text-[11px] tracking-wide">
                {r.sku}
              </div>
            </TableCell>
            <TableCell className="text-right whitespace-nowrap tabular-nums">
              {r.price_cents != null
                ? formatMoney(r.price_cents, r.currency)
                : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {r.variant_count > 0 ? (
                r.variant_count
              ) : (
                <Badge variant="outline" className="text-xs">
                  tek parça
                </Badge>
              )}
            </TableCell>
            {showEtsy && (
              <TableCell className="text-right">
                {r.etsy_listing_id ? (
                  <a
                    href={`https://www.etsy.com/listing/${r.etsy_listing_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground inline-flex hover:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
            )}
            <TableCell className="text-right">
              <ListingLifecycleButton id={r.id} mode={mode} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
