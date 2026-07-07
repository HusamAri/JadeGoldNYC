import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireMembership, isManager } from "@/lib/auth";
import { listGeneratedImages } from "@/lib/db/queries/generated-images";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { GeneratedGallery } from "@/components/photo-kit/generated-gallery";

export const metadata = { title: "Üretilen Görseller" };

export default async function GaleriPage() {
  const m = await requireMembership();
  const images = await listGeneratedImages(m.org_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Üretilen Görseller"
        description="Higgsfield'da ürettiğin AI görselleri panelde toplanır; ekip beğendiğini seçer, isteyen indirir. Görseller Higgsfield'dan gösterilir — indirilene kadar siteye yük binmez."
        action={
          <Button asChild variant="outline">
            <Link href="/gorsel-uretim">
              <ArrowLeft />
              Üretim Kiti
            </Link>
          </Button>
        }
      />
      <GeneratedGallery images={images} canManage={isManager(m.role)} />
    </div>
  );
}
