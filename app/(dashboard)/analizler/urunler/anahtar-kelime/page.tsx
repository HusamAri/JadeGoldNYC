import { requireMembership } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { KeywordImportWizard } from "@/components/csv-import/keyword-import-wizard";

export const metadata = { title: "Anahtar Kelime CSV" };

export default async function AnahtarKelimeCsvPage() {
  await requireMembership();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Anahtar Kelime CSV"
        description="Etsy Stats arama-terimi dışa aktarımından her listing'in en çok tıklanan kelimesini içe aktar — rekabet fiyat araştırması bu kelimeyi kullanır."
      />
      <KeywordImportWizard />
    </div>
  );
}
