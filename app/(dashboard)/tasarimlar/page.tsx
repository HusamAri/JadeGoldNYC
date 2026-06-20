import { ImagePlus } from "lucide-react";

import { BRAND_GALLERY } from "@/lib/brand-assets";
import { PageHeader } from "@/components/page-header";
import { BrandTile } from "@/components/brand/brand-tile";

export const metadata = { title: "Marka Tasarımları" };

export default function TasarimlarPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Marka Görsel Kimliği"
        description="Jade Gold NYC marka çekimleri ve görsel öğeleri"
      />

      {BRAND_GALLERY.map((group) => (
        <section key={group.key} className="space-y-3">
          <div>
            <h3 className="text-base font-semibold">{group.title}</h3>
            <p className="text-muted-foreground text-sm">{group.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {group.assets.map((a) => (
              <BrandTile key={a.src} src={a.src} scrim className="aspect-[4/5]">
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-xs font-medium text-white">{a.caption}</p>
                </div>
              </BrandTile>
            ))}
          </div>
        </section>
      ))}

      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <ImagePlus className="size-4 shrink-0" />
        Görselleri <code className="font-mono">public/brand/gallery/</code>{" "}
        klasörüne ilgili dosya adıyla ekleyin; otomatik görünür. Dosya yoksa zarif
        degrade gösterilir.
      </p>
    </div>
  );
}
