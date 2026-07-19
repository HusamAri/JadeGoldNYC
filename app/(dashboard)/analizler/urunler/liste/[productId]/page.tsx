import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Money } from "@/components/money";
import { getListingHealth } from "@/lib/db/queries/listing-health";
import { getLatestDecision } from "@/app/(dashboard)/analizler/urunler/liste/actions";
import { PageHeader } from "@/components/page-header";
import { KeywordResearchPanel } from "@/components/keyword-research-panel";
import { ListingActionPanel } from "@/components/listing-action-panel";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Rakip & Pazar Analizi" };

interface ListingRow {
  id: string;
  title: string;
  price_cents: number | null;
  currency: string | null;
  url: string | null;
  status: string | null;
}

/**
 * Bir listing için rakip & pazar fiyat analizi sayfası. "Listeler"
 * (tasarımlar) sekmesindeki listing kartından açılır; anahtar kelime
 * düzenleme + günlük araştırma sonuçları (rakip mağaza/link, bant, konum)
 * KeywordResearchPanel içinde gösterilir.
 */
export default async function ListingAnalizPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, title, price_cents, currency, url, status")
    .eq("id", productId)
    .maybeSingle();
  const product = data as ListingRow | null;
  if (!product) notFound();

  const [health, decision] = await Promise.all([
    getListingHealth(product.id),
    getLatestDecision(product.id),
  ]);

  const decoded = product.title
    .replace(/&#(\d+);/g, (_, c: string) => String.fromCodePoint(Number(c)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");

  return (
    <div className="page-stack">
      <PageHeader
        title="Rakip & Pazar Analizi"
        description={decoded}
        action={
          <Link
            href="/tasarimlar"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← Listeler
          </Link>
        }
      />

      {/* Fiyat/durum özet şeridi — sayfa hero'su: berrak cam board (.glass-board) */}
      <Card className="glass-board">
        <CardContent className="flex flex-wrap items-center gap-4 text-sm">
          <span>
            <span className="text-muted-foreground">Bizim fiyat: </span>
            <span className="font-semibold tabular-nums">
              {product.price_cents != null ? (
                <Money
                  cents={product.price_cents}
                  currency={product.currency ?? "USD"}
                />
              ) : (
                "—"
              )}
            </span>
          </span>
          {product.status && (
            <span className="text-muted-foreground">Durum: {product.status}</span>
          )}
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary ml-auto inline-flex items-center gap-1 text-xs hover:underline"
            >
              Etsy&apos;de gör <ExternalLink className="size-3" />
            </a>
          )}
        </CardContent>
      </Card>

      {health && <ListingActionPanel health={health} decision={decision} />}

      <KeywordResearchPanel productId={product.id} />
    </div>
  );
}
