import { notFound } from "next/navigation";

import { requireMembership, isManager } from "@/lib/auth";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { getRedesignBoard, summarizeRedesigns } from "@/lib/db/queries/listing-redesigns";
import { CHAPTERS, type Chapter } from "@/lib/collections/chapters";
import { RedesignBoard } from "@/components/chapters/redesign-board";

export default async function ChapterContentPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter } = await params;
  const meta = CHAPTERS[chapter as Chapter];
  if (!meta) notFound();

  const m = await requireMembership();
  const [rows, write] = await Promise.all([
    getRedesignBoard(m.org_id, chapter as Chapter),
    getEtsyWriteAccess(m.org_id),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">{meta.label} — içerik</h1>
        <p className="text-sm text-muted-foreground">{meta.meaning}</p>
      </div>
      <RedesignBoard
        chapter={chapter as Chapter}
        chapterLabel={meta.label}
        rows={rows}
        summary={summarizeRedesigns(rows)}
        writeEnabled={write.writeEnabled}
        isManager={isManager(m.role)}
      />
    </div>
  );
}
