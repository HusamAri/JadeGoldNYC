import { PageHeader } from "@/components/page-header";
import { SalesImportWizard } from "@/components/csv-import/sales-import-wizard";

export const metadata = { title: "CSV İçe Aktar" };

export default function IceAktarPage() {
  return (
    <div>
      <PageHeader
        title="CSV İçe Aktar"
        description="Etsy 'Sold Order Items' veya 'Orders' CSV dosyanızı yükleyin"
      />
      <SalesImportWizard />
    </div>
  );
}
