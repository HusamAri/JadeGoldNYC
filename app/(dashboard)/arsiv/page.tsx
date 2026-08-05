import { requireMembership, isManager } from "@/lib/auth";
import { getArchiveOverview } from "@/lib/db/queries/listing-archive";
import { PageHeader } from "@/components/page-header";
import { ArchiveConsole } from "@/components/archive/archive-console";

export const metadata = { title: "Listing Arşivi" };

export default async function ArsivPage() {
  const m = await requireMembership();
  const rows = await getArchiveOverview(m.org_id);
  const canArchive = isManager(m.role);

  return (
    <div className="page-stack">
      <PageHeader
        title="Listing Arşivi"
        description="Etsy listinglerinin görsel ve videolarını panele kalıcı çeker. Etsy'den listing silinse bile medya burada kalır — geriye dönük arşiv. Listing metni zaten panelde saklıdır."
      />
      <ArchiveConsole rows={rows} canArchive={canArchive} />
    </div>
  );
}
