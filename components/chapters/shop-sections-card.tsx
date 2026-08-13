import { Store, AlertTriangle } from "lucide-react";

import type { ShopSectionRow } from "@/lib/db/queries/chapters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Etsy vitrin bölümleri — alıcının mağazada gördüğü GERÇEK yerleşim.
 *
 * Anlam bölümlerinden ayrı bir eksendir: Etsy tarafı biçim-temelli
 * (Bracelets / Earrings / Cuban Link), anlam bölümü hikâye-temelli. Bu kart
 * ikisini yan yana getirir ki panelde kurulan yapı ile vitrinde duran yapı
 * birbirinden habersiz kalmasın.
 */
export function ShopSectionsCard({
  filled,
  empty,
}: {
  filled: ShopSectionRow[];
  empty: ShopSectionRow[];
}) {
  if (filled.length === 0 && empty.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-2">
          <Store className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <h3 className="font-medium">Etsy vitrin bölümleri</h3>
            <p className="text-xs text-muted-foreground">
              Alıcının mağazada gördüğü canlı yerleşim — biçim ekseni. Anlam
              bölümleri buna dik çalışır: bir listing hem &laquo;Pendants &amp;
              Charms&raquo; vitrininde durur hem &laquo;Koruma &amp; Şans&raquo;
              hikâyesini anlatır. Vitrin değişikliği canlı yazımdır, ayrı onay ister.
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2">
          {filled.map((s) => (
            <li key={s.section_id}>
              <Badge variant="secondary" className="font-normal">
                {s.title}
                <span className="ml-1.5 tabular-nums opacity-70">
                  {s.active_listing_count}
                </span>
              </Badge>
            </li>
          ))}
        </ul>

        {empty.length > 0 ? (
          <div className="rounded-md border border-dashed p-3">
            <p className="flex items-start gap-2 text-xs">
              <AlertTriangle
                className="mt-0.5 size-3.5 shrink-0 text-amber-600"
                aria-hidden
              />
              <span>
                <strong>{empty.length} bölüm boş.</strong> İçi boş vitrin
                başlığı alıcıya &laquo;burada bir şey olacaktı&raquo; hissi
                verir ve mağazayı yarım gösterir; ayrıca hangi bölümün gerçekten
                kullanıldığı yönetimde belirsizleşir. Ya doldur ya kaldır —
                ikisi de Etsy tarafında elle yapılır.
              </span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {empty.map((s) => (
                <li key={s.section_id}>
                  <Badge variant="outline" className="font-normal opacity-70">
                    {s.title}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
