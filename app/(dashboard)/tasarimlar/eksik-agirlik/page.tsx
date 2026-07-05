import { requireMembership } from "@/lib/auth";
import { listVariantsMissingWeight } from "@/lib/db/queries/missing-weights";
import { strParam, type RawSearchParams } from "@/lib/searchparams";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/data-table/search-input";
import { Pagination } from "@/components/data-table/pagination";
import { MissingWeightsForm } from "@/components/missing-weights-form";

export const metadata = { title: "Eksik Ağırlıklar" };

const LIMIT = 50;

export default async function EksikAgirlikPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const m = await requireMembership();
  const sp = await searchParams;
  const search = strParam(sp.search);
  const offset = Math.max(0, Number(strParam(sp.offset) ?? 0) || 0);

  const { rows, count } = await listVariantsMissingWeight(m.org_id, {
    search,
    limit: LIMIT,
    offset,
  });

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        title="Eksik Ağırlıklar"
        description="Ağırlığı (gram) girilmemiş varyantlar — altın maliyeti ve kâr analizleri için doldurun"
      />

      <div className="flex items-center justify-between gap-3">
        <SearchInput placeholder="SKU veya ad ara…" />
        <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
          {count} eksik
        </span>
      </div>

      <MissingWeightsForm rows={rows} />

      <Pagination count={count} limit={LIMIT} offset={offset} />
    </div>
  );
}
