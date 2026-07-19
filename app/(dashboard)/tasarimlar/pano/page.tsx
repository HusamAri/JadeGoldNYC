import Link from "next/link";
import { Plus, Pencil, Layers, ImageOff, MessageSquare } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { listDesigns } from "@/lib/db/queries/designs";
import {
  listCollections,
  getDesignThumbs,
} from "@/lib/db/queries/design-boards";
import type { Design } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { EmptyState } from "@/components/empty-state";
import { DesignStatusBadge } from "@/components/design-status-badge";
import { NewCollectionForm } from "@/components/design-board/new-collection-form";
import { PanoVideoBackground } from "@/components/brand/pano-video-background";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/data-table/delete-button";
import { deleteDesign } from "../actions";

export const metadata = { title: "Yeni Tasarım Panosu" };

type DesignRow = Design & { collection_id: string | null };

export default async function TasarimPanosuPage() {
  const m = await requireMembership();

  const [{ rows }, collections, thumbs] = await Promise.all([
    listDesigns(m.org_id, { limit: 500, withCount: false }),
    listCollections(m.org_id),
    getDesignThumbs(m.org_id),
  ]);

  const designs = rows as unknown as DesignRow[];

  // Koleksiyona göre grupla
  const byCollection = new Map<string | null, DesignRow[]>();
  for (const d of designs) {
    const key = d.collection_id ?? null;
    const list = byCollection.get(key) ?? [];
    list.push(d);
    byCollection.set(key, list);
  }
  const groups: { id: string | null; name: string; designs: DesignRow[] }[] = [
    ...collections.map((c) => ({
      id: c.id,
      name: c.name,
      designs: byCollection.get(c.id) ?? [],
    })),
  ];
  const uncategorized = byCollection.get(null) ?? [];
  if (uncategorized.length > 0) {
    groups.push({ id: null, name: "Koleksiyonsuz", designs: uncategorized });
  }

  return (
    <div className="page-stack relative z-0 pb-32">
      <PanoVideoBackground />
      <GoldStream motif="ring" />
      <PageHeader
        title="Yeni Tasarım Panosu"
        description="Tasarımları koleksiyon panolarında yönetin — her tasarıma mockup görseli ve pinli not ekleyebilirsiniz"
        action={
          <>
            <NewCollectionForm />
            <Button asChild>
              <Link href="/tasarimlar/yeni">
                <Plus />
                Yeni Tasarım
              </Link>
            </Button>
          </>
        }
      />

      <div className="idx">
        <span>Yeni Tasarım Panosu</span>
        <span className="idx-bar" />
        <span className="idx-ln" />
        <span className="normal-case">koleksiyon panoları</span>
      </div>

      {designs.length === 0 && collections.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Tasarım yok"
          description="Bir koleksiyon oluşturun ve 'Yeni Tasarım' ile ürün tasarımlarınızı ekleyin; her tasarıma mockup görseli + not ekleyebilirsiniz."
        />
      ) : (
        groups.map((g) => (
          <section key={g.id ?? "none"} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h3 className="font-serif text-xl leading-tight">{g.name}</h3>
              <span className="text-muted-foreground text-sm tabular-nums">
                {g.designs.length}
              </span>
            </div>
            {g.designs.length === 0 ? (
              <p className="text-muted-foreground rounded-2xl border border-dashed p-5 text-sm">
                Bu koleksiyonda tasarım yok. &quot;Yeni Tasarım&quot; eklerken bu
                koleksiyonu seçin.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {g.designs.map((d) => {
                  const thumb = thumbs.get(d.id);
                  return (
                    <Card key={d.id} className="gap-0 overflow-hidden p-0">
                      <Link
                        href={`/tasarimlar/${d.id}/duzenle`}
                        className="bg-muted block aspect-video w-full overflow-hidden"
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={d.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-muted-foreground/50 flex h-full items-center justify-center">
                            <ImageOff className="size-6" />
                          </span>
                        )}
                      </Link>
                      <div className="flex items-start justify-between gap-1 px-3 py-2.5">
                        <div className="min-w-0">
                          <Link
                            href={`/tasarimlar/${d.id}/duzenle`}
                            className="block truncate text-sm font-medium hover:underline"
                          >
                            {d.name}
                          </Link>
                          <div className="mt-1 flex items-center gap-1.5">
                            <DesignStatusBadge status={d.status} />
                            {thumb && (
                              <MessageSquare className="text-muted-foreground size-3" />
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0">
                          <Button asChild variant="ghost" size="icon" className="size-8">
                            <Link href={`/tasarimlar/${d.id}/duzenle`}>
                              <Pencil className="size-3.5" />
                              <span className="sr-only">Düzenle</span>
                            </Link>
                          </Button>
                          <DeleteButton action={deleteDesign} id={d.id} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}
