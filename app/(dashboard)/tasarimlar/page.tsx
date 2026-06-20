import { Palette } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Tasarımlar" };

export default function TasarimlarPage() {
  return (
    <div>
      <PageHeader
        title="Marka Tasarımları"
        description="Ürün ve marka tasarım varlıkları, sürümler ve durumlar"
      />
      <EmptyState
        icon={Palette}
        title="Yakında"
        description="Tasarım varlık kütüphanesi sonraki sürümde aktifleşecek. Veritabanı tablosu ve Storage altyapısı hazır."
      />
    </div>
  );
}
