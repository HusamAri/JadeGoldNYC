import Link from "next/link";
import { Images } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { PHOTO_KIT } from "@/lib/photo-kit/types";
import { listProducedListingIds } from "@/lib/db/queries/photo-production";
import { countGeneratedImages } from "@/lib/db/queries/generated-images";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PhotoKitConsole } from "@/components/photo-kit/photo-kit-console";

export const metadata = { title: "Görsel Üretim" };

export default async function GorselUretimPage() {
  const m = await requireMembership();
  const [producedIds, gallery] = await Promise.all([
    listProducedListingIds(m.org_id),
    countGeneratedImages(m.org_id),
  ]);

  const t1 = PHOTO_KIT.filter((p) => p.tier === 1).length;

  return (
    <div className="page-stack">
      <PageHeader
        title="AI Görsel Üretim Kiti"
        description={`${PHOTO_KIT.length} aktif listing için kimlik-kilitli (img2img) üretim promptları. Ürünün gerçek Etsy fotoğrafını referans ver, promptu kopyala, birebir aynı ürünle yeni sahneyi üret. Önce en çok satanlar (T1: ${t1}).`}
        action={
          <Button asChild variant="outline">
            <Link href="/gorsel-uretim/galeri">
              <Images />
              Üretilen Görseller
              {gallery.total > 0 && (
                <span className="text-muted-foreground ml-1 tabular-nums">
                  {gallery.total}
                </span>
              )}
            </Link>
          </Button>
        }
      />
      <PhotoKitConsole producedIds={producedIds} />
    </div>
  );
}
