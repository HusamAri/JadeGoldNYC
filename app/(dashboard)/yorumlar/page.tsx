import { MessageSquareText } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

export const metadata = { title: "Yorumlar" };

export default function YorumlarPage() {
  return (
    <div>
      <PageHeader
        title="Tüketici Yorumları"
        description="Etsy yorumları, puan trendleri ve tema analizi"
      />
      <EmptyState
        icon={MessageSquareText}
        title="Yakında"
        description="Yorum yönetimi sonraki sürümde aktifleşecek. Etsy senkronizasyonu yorumları çekecek altyapıya sahip."
      />
    </div>
  );
}
