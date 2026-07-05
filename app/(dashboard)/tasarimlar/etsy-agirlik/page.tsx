import { requireMembership } from "@/lib/auth";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { listingsWithVariantWeights } from "@/lib/db/queries/variant-weights";
import { PageHeader } from "@/components/page-header";
import { EtsyWeightPush } from "@/components/etsy-weight-push";

export const metadata = { title: "Etsy'ye Ağırlık" };

export default async function EtsyAgirlikPage() {
  const m = await requireMembership();
  const [previews, access] = await Promise.all([
    listingsWithVariantWeights(m.org_id),
    getEtsyWriteAccess(m.org_id),
  ]);

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Etsy'ye Ağırlık Gönder"
        description="Varyant gramajlarını listing açıklamalarına beden→gram tablosu olarak işleyin (idempotent)"
      />
      <EtsyWeightPush
        previews={previews}
        writeEnabled={access.writeEnabled}
        connected={access.connected}
      />
    </div>
  );
}
