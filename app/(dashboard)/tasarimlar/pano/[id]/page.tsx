import { notFound } from "next/navigation";

import { getDesignBoard } from "@/lib/db/queries/design-boards";
import { PageHeader } from "@/components/page-header";
import { BoardCanvas } from "@/components/design-board/board-canvas";

export const metadata = { title: "Tasarım Panosu" };

export default async function PanoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const board = await getDesignBoard(id);
  if (!board || !board.imageUrl) notFound();

  return (
    <div className="space-y-5 pb-28">
      <PageHeader
        title={board.title}
        description="Görsele tıklayıp bir noktaya not bırakın; ekip yanıtlasın"
      />
      <BoardCanvas
        boardId={board.id}
        imageUrl={board.imageUrl}
        pins={board.pins}
      />
    </div>
  );
}
