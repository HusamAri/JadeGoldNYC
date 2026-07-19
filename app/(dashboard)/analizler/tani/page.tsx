import { requireMembership } from "@/lib/auth";
import { getSalesDiagnostics } from "@/lib/db/queries/diagnostics";
import { PageHeader } from "@/components/page-header";
import { DiagnosticBoard } from "@/components/diagnostics/diagnostic-board";

export const metadata = { title: "Aylık Tanı" };

/**
 * Aylık satış tanısı — takvim yılı Ocak'ından bugüne her ayı bir önceki
 * ayla karşılaştırır: ne oldu, ne yanlış gitti, ne düzeltilmeli.
 */
export default async function AylikTaniPage() {
  const m = await requireMembership();
  const data = await getSalesDiagnostics(m.org_id);

  return (
    <div className="page-stack pb-24">
      <PageHeader
        title="Aylık Tanı"
        eyebrow={`${data.fromLabel} → ${data.toLabel}`}
        description="Her ay bir önceki ayla karşılaştırılır. Ne oldu, ne yanlış gitti ve düzeltilmesi gerekenler burada."
      />
      <DiagnosticBoard data={data} />
    </div>
  );
}
