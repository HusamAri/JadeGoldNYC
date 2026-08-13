"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdsImportWizard } from "@/components/csv-import/ads-import-wizard";
import { AdsDailyImportWizard } from "@/components/csv-import/ads-daily-import-wizard";

/**
 * İki Etsy Reklam CSV biçimi arasında geçiş: (1) LISTING bazlı ("son 30"
 * ürün metriği) ve (2) GÜNLÜK mağaza geneli ("stats over time" → ad_daily_stats).
 * Etsy iki ayrı dışa aktarım sunar; şekilleri uyuşmadığından ayrı sihirbaz.
 */
export function AdsImportTabs() {
  return (
    <Tabs defaultValue="listing" className="mt-4 gap-4">
      <TabsList>
        <TabsTrigger value="listing">Listing bazlı</TabsTrigger>
        <TabsTrigger value="daily">Günlük (mağaza geneli)</TabsTrigger>
      </TabsList>
      <TabsContent value="listing">
        <p className="text-muted-foreground mb-3 max-w-[75ch] text-sm">
          Etsy Reklam panosunun <span className="font-medium">listing bazlı</span>{" "}
          dışa aktarımı — her satır bir ilan. İçe aktarınca &quot;son 30&quot;
          etiketli ürün metriği olarak kaydedilir; başlığı tutan ürünler
          otomatik bağlanır.
        </p>
        <AdsImportWizard />
      </TabsContent>
      <TabsContent value="daily">
        <p className="text-muted-foreground mb-3 max-w-[75ch] text-sm">
          Etsy Reklam panosunun <span className="font-medium">günlük</span>{" "}
          (&quot;stats over time&quot;) dışa aktarımı — her satır bir gün, mağaza
          geneli (görüntülenme/tık/sipariş/ciro/harcama/ROAS + gün-sonu bütçe).
          Listing kırılımı yoktur; günlük seri olarak kaydedilir ve Reklamlar
          panosunda &quot;Etsy Reklam · günlük&quot; bölümünde görünür.
        </p>
        <AdsDailyImportWizard />
      </TabsContent>
    </Tabs>
  );
}
