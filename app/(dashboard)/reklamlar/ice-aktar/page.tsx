import { PageHeader } from "@/components/page-header";
import { AdsImportTabs } from "@/components/csv-import/ads-import-tabs";

export const metadata = { title: "CSV İçe Aktar" };

export default function IceAktarPage() {
  return (
    <div>
      <PageHeader
        title="CSV İçe Aktar"
        description="Etsy Reklam panosundan indirilen CSV dosyanızı yükleyin — listing bazlı ya da mağaza geneli günlük"
      />
      <AdsImportTabs />
    </div>
  );
}
