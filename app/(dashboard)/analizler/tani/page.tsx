import { requireMembership } from "@/lib/auth";
import { getSalesDiagnostics } from "@/lib/db/queries/diagnostics";
import { PageHeader } from "@/components/page-header";
import { DiagnosticBoard } from "@/components/diagnostics/diagnostic-board";

export const metadata = { title: "Satış Tanısı" };

/**
 * "Satış durdu" tanı ekranı — mağazanın kendi verisinden (ek API/bütçe yok)
 * neden satmadığını trafik vs dönüşüm ekseninde ayırır ve öncelikli aksiyonlar
 * çıkarır. Aktif markaya göre farklı sinyaller üretir (genç mağaza vs yerleşik).
 */
export default async function SatisTaniPage() {
  const m = await requireMembership();
  const data = await getSalesDiagnostics(m.org_id);

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Satış Tanısı"
        eyebrow="Neden satmıyor?"
        description="Mağazanızın kendi verisinden satışın neden durduğunu ayrıştırır ve öncelikli, ücretsiz aksiyonlar önerir."
      />
      <DiagnosticBoard data={data} />
    </div>
  );
}
