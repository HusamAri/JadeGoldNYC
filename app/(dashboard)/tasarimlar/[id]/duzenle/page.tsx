import { notFound } from "next/navigation";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDesign } from "@/lib/db/queries/designs";
import {
  listCollections,
  getBoardByDesign,
} from "@/lib/db/queries/design-boards";
import { PageHeader } from "@/components/page-header";
import { DesignForm } from "@/components/design-form";
import { NewBoardForm } from "@/components/design-board/new-board-form";
import { BoardCanvas } from "@/components/design-board/board-canvas";
import type { DesignFormValues } from "@/lib/validations/design";

export const metadata = { title: "Tasarımı Düzenle" };

export default async function TasarimDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const m = await requireMembership();
  const [design, collections, board, products] = await Promise.all([
    getDesign(id),
    listCollections(m.org_id),
    getBoardByDesign(id),
    (async () => {
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("id, title")
        .eq("org_id", m.org_id)
        .eq("status", "active")
        .order("title", { ascending: true })
        .limit(500);
      return (data ?? []) as { id: string; title: string }[];
    })(),
  ]);
  if (!design) notFound();

  const productOptions = products.map((p) => ({ value: p.id, label: p.title }));
  const collectionOptions = collections.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const defaultValues: DesignFormValues = {
    name: design.name,
    description: design.description ?? "",
    status: design.status as DesignFormValues["status"],
    product_id: design.product_id ?? "",
    collection_id: (design as { collection_id?: string | null }).collection_id ?? "",
    tags: design.tags?.join(", ") ?? "",
    version: String(design.version ?? 1),
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Tasarımı Düzenle" description={design.name} />
      <DesignForm
        mode="edit"
        designId={design.id}
        defaultValues={defaultValues}
        products={productOptions}
        collections={collectionOptions}
      />

      <section className="space-y-3">
        <div>
          <h2 className="font-serif text-xl leading-tight">Görsel & Notlar</h2>
          <p className="text-muted-foreground text-sm">
            Mockup görselini yükleyin; bir noktaya tıklayıp not bırakın, ekip
            yanıtlasın
          </p>
        </div>
        {board && board.imageUrl ? (
          <BoardCanvas
            boardId={board.id}
            designId={design.id}
            imageUrl={board.imageUrl}
            pins={board.pins}
          />
        ) : (
          <NewBoardForm designId={design.id} />
        )}
      </section>
    </div>
  );
}
