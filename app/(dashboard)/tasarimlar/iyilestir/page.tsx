import { requireMembership, isManager } from "@/lib/auth";
import { isEonActive } from "@/lib/brand";
import { getListingAudit } from "@/lib/db/queries/listing-audit";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { PageHeader } from "@/components/page-header";
import { ListingAuditBoard } from "@/components/listing-audit-board";
import { ListingQualityScore } from "@/components/listing-quality-score";
import { EonPersonalizationSync } from "@/components/eon-personalization-sync";

export const metadata = { title: "Listing İyileştirme" };

/**
 * Alura Listing Helper karşılığı:
 * - Listing Quality Score (1–100) + kategori checklist
 * - Handbook bazlı actionable bulgular (ListingAuditBoard)
 * - EON: canlı kişiselleştirme tara → sapmaları Etsy'ye uygula
 */
export default async function IyilestirPage() {
  const m = await requireMembership();
  const [audit, write, eon] = await Promise.all([
    getListingAudit(m.org_id),
    getEtsyWriteAccess(m.org_id),
    isEonActive(),
  ]);
  const { groups, auditedCount, findingCount, shopScore, categoryPassCounts } =
    audit;

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
      <ListingQualityScore
        shopScore={shopScore}
        auditedCount={auditedCount}
        categoryPassCounts={categoryPassCounts}
      />
      {eon && (
        <EonPersonalizationSync
          writeEnabled={write.writeEnabled}
          isManager={isManager(m.role)}
        />
      )}
      <ListingAuditBoard groups={groups} />
    </div>
  );
}
