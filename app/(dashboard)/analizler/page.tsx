import { BarChart3 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Analizler" };

export default function AnalizlerPage() {
  return (
    <div>
      <PageHeader
        title="Analizler"
        description="Derinlemesine satış, dönüşüm ve sezonluk analizler"
      />
      <EmptyState
        icon={BarChart3}
        title="Yakında"
        description="Bu modül sonraki sürümde aktifleşecek. Panel'deki KPI ve grafikler şimdiden kullanılabilir; gelişmiş analizler buraya eklenecek."
      />
    </div>
  );
}
