import { requireMembership } from "@/lib/auth";
import { listVariantStock } from "@/lib/db/queries/variant-stock";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/data-table/search-input";
import { VariantStockForm } from "@/components/variant-stock-form";

export const metadata = { title: "Varyant Stok" };
export const maxDuration = 60;

export default async function VaryantStokPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const m = await requireMembership();
  const sp = await searchParams;
  const search = strParam(sp.search);

  const [groups, access] = await Promise.all([
    listVariantStock(m.org_id, { search }),
    getEtsyWriteAccess(m.org_id),
  ]);

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        title="Varyant Stok"
        description="Her varyant (SKU) için hedef adedi ayrı girin; Etsy'ye offering başına gönderin. Varyasyonlu listelerde stok böyle dağıtılır."
      />

      <div className="flex items-center justify-between gap-3">
        <SearchInput placeholder="SKU veya ad ara…" />
      </div>

      <VariantStockForm groups={groups} writeEnabled={access.writeEnabled} />
    </div>
  );
}
