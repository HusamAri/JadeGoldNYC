import { notFound } from "next/navigation";

import { getReport } from "@/lib/db/queries/reports";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { ReportDetail } from "@/components/reports/report-detail";
import { DeleteButton } from "@/components/data-table/delete-button";
import { Badge } from "@/components/ui/badge";
import { deleteReport } from "../actions";

export const metadata = { title: "Rapor" };

export default async function RaporDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const doneCount = report.tasks.filter((t) => t.status === "done").length;

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <PageHeader
        title={report.title}
        description={`${formatDate(report.report_date)} · ${report.category}`}
        action={
          <>
            {report.tasks.length > 0 && (
              <Badge variant="secondary" className="tabular-nums">
                {doneCount}/{report.tasks.length} görev tamam
              </Badge>
            )}
            <DeleteButton
              id={report.id}
              action={deleteReport}
              variant="button"
              title="Raporu sil"
              description="Rapor kalıcı olarak silinecek (denetim logunda iz kalır). Bağlı görevler silinmez, yalnız rapor bağlantısı düşer."
              redirectTo="/raporlar"
            />
          </>
        }
      />
      {report.summary && (
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          {report.summary}
        </p>
      )}
      <ReportDetail report={report} />
    </div>
  );
}
