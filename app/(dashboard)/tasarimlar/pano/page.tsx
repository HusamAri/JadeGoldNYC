import Link from "next/link";
import { LayoutGrid, MessageSquare } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { listDesignBoards } from "@/lib/db/queries/design-boards";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { EmptyState } from "@/components/empty-state";
import { NewBoardForm } from "@/components/design-board/new-board-form";
import { DeleteButton } from "@/components/data-table/delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteBoard } from "./actions";

export const metadata = { title: "Tasarım Panoları" };

export default async function PanoListPage() {
  const m = await requireMembership();
  const boards = await listDesignBoards(m.org_id);

  return (
    <div className="relative z-0 space-y-6 pb-28">
      <GoldStream motif="ring" />
      <PageHeader
        title="Tasarım Panoları"
        description="Görsel yükleyin; üzerine pin bırakıp yorumlayın, ekip yanıtlasın"
      />

      <Card>
        <CardContent>
          <NewBoardForm />
        </CardContent>
      </Card>

      {boards.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Pano yok"
          description="İlk panonu oluşturmak için yukarıdan bir görsel yükle."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <Card key={b.id} className="gap-0 overflow-hidden p-0">
              <Link href={`/tasarimlar/pano/${b.id}`} className="block">
                <div className="bg-muted aspect-video w-full overflow-hidden">
                  {b.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/tasarimlar/pano/${b.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {b.title}
                  </Link>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      {b.pin_count} not
                    </span>
                    <span>{formatDate(b.created_at)}</span>
                  </div>
                </div>
                <DeleteButton action={deleteBoard} id={b.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
