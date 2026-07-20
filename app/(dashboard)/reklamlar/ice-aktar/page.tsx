import { PageHeader } from "@/components/page-header";
import { AdsImportWizard } from "@/components/csv-import/ads-import-wizard";

export const metadata = { title: "CSV İçe Aktar" };

export default function IceAktarPage() {
  return (
    <div>
      <PageHeader
        title="CSV İçe Aktar"
        description='Etsy Reklam panosundan indirilen listing bazlı CSV dosyanızı yükleyin — satırlar "son 30" etiketli ürün metriği olarak kaydedilir'
      />
      <AdsImportWizard />
    </div>
  );
}
