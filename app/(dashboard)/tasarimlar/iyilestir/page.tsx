import { requireMembership } from "@/lib/auth";
import { getListingAudit } from "@/lib/db/queries/listing-audit";
import { PageHeader } from "@/components/page-header";
import { ListingAuditBoard } from "@/components/listing-audit-board";

export const metadata = { title: "Listing İyileştirme" };

export default async function IyilestirPage() {
  const m = await requireMembership();
  const { groups, auditedCount, findingCount } = await getListingAudit(
    m.org_id,
  );

  return (
    <div className="page-stack pb-28">
      <PageHeader
        title="Listing İyileştirme"
        description={`${auditedCount} aktif listing, Etsy'nin belgeli arama sinyallerine göre tarandı — ${
          findingCount > 0
            ? `${findingCount} bulgu düzeltme bekliyor. Her kartta yalnız etkilenen listingler listelenir; Düzelt doğrudan ilgili alana götürür.`
            : "bulgu yok."
        }`}
      />
      <ListingAuditBoard groups={groups} />
    </div>
  );
}
