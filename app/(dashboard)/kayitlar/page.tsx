import { ScrollText, Download } from "lucide-react";

import { listAudit } from "@/lib/db/queries/audit";
import { strParam, numParam, type RawSearchParams } from "@/lib/searchparams";
import { auditSummary } from "@/lib/audit-format";
import {
  AUDIT_ACTION_LABELS,
  ENTITY_TYPE_LABELS,
  AUDIT_SOURCE_LABELS,
} from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchInput } from "@/components/data-table/search-input";
import { FilterSelect } from "@/components/data-table/filter-select";
import { Pagination } from "@/components/data-table/pagination";

export const metadata = { title: "Kayıtlar" };

const ENTITY_OPTIONS = Object.entries(ENTITY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(
  ([value, label]) => ({ value, label }),
);

function actionVariant(
  action: string,
): "success" | "default" | "destructive" | "secondary" {
  if (action === "insert") return "success";
  if (action === "update") return "default";
  if (action === "delete") return "destructive";
  return "secondary";
}

export default async function KayitlarPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const entityType = strParam(sp.entity);
  const action = strParam(sp.action);
  const search = strParam(sp.search);
  const offset = numParam(sp.offset);
  const limit = 30;

  const { rows, count } = await listAudit({
    entityType,
    action,
    search,
    limit,
    offset,
  });

  const exportQs = new URLSearchParams();
  if (entityType) exportQs.set("entity", entityType);
  if (action) exportQs.set("action", action);
  if (search) exportQs.set("search", search);
  const exportHref = `/kayitlar/export${
    exportQs.toString() ? `?${exportQs.toString()}` : ""
  }`;

  return (
    <div>
      <PageHeader
        title="Kayıtlar"
        description="Şirket hafızası — her işlemin değişmez denetim logu"
        action={
          <Button asChild variant="outline">
            <a href={exportHref}>
              <Download className="size-4" />
              CSV indir
            </a>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Özet, kullanıcı…" />
            <FilterSelect
              paramKey="entity"
              placeholder="Varlık"
              options={ENTITY_OPTIONS}
            />
            <FilterSelect
              paramKey="action"
              placeholder="İşlem"
              options={ACTION_OPTIONS}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Kayıt yok"
              description="Bu filtrelerle eşleşen denetim kaydı bulunamadı."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>İşlem</TableHead>
                  <TableHead>Özet</TableHead>
                  <TableHead>Kaynak</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(a.created_at)}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {a.actor_label ?? "Sistem"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionVariant(a.action)}>
                        {AUDIT_ACTION_LABELS[a.action] ?? a.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{auditSummary(a)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {AUDIT_SOURCE_LABELS[a.source] ?? a.source}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Pagination count={count} limit={limit} offset={offset} />
        </CardContent>
      </Card>
    </div>
  );
}
