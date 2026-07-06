import { requireMembership } from "@/lib/auth";
import { PHOTO_KIT } from "@/lib/photo-kit/types";
import { listProducedListingIds } from "@/lib/db/queries/photo-production";
import { PageHeader } from "@/components/page-header";
import { PhotoKitConsole } from "@/components/photo-kit/photo-kit-console";

export const metadata = { title: "Görsel Üretim" };

export default async function GorselUretimPage() {
  const m = await requireMembership();
  const producedIds = await listProducedListingIds(m.org_id);

  const t1 = PHOTO_KIT.filter((p) => p.tier === 1).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Görsel Üretim Kiti"
        description={`${PHOTO_KIT.length} aktif listing için kimlik-kilitli (img2img) üretim promptları. Ürünün gerçek Etsy fotoğrafını referans ver, promptu kopyala, birebir aynı ürünle yeni sahneyi üret. Önce en çok satanlar (T1: ${t1}).`}
      />
      <PhotoKitConsole producedIds={producedIds} />
    </div>
  );
}
