"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { parseCsv } from "@/lib/csv/parse";
import {
  detectTemplate,
  mapEtsyOrders,
  mapEtsySoldOrderItems,
  MAPPING_TEMPLATES,
} from "@/lib/csv/mappers";
import type { MappedSale, MappingTemplateId } from "@/lib/csv/types";
import { commitSalesImport } from "@/app/(dashboard)/satislar/ice-aktar/actions";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SALES_TEMPLATES = MAPPING_TEMPLATES.filter((t) => t.module === "sales");

function runMap(templateId: MappingTemplateId, rows: Record<string, string>[]) {
  if (templateId === "etsy_orders") return mapEtsyOrders(rows);
  return mapEtsySoldOrderItems(rows);
}

export function SalesImportWizard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [templateId, setTemplateId] = useState<MappingTemplateId>(
    "etsy_sold_order_items",
  );
  const [sales, setSales] = useState<MappedSale[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  function remap(tid: MappingTemplateId, parsedRows: Record<string, string>[]) {
    const res = runMap(tid, parsedRows);
    setSales(res.sales);
    setWarnings(res.warnings);
  }

  async function onFile(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.errors.length) {
      toast.warning(`CSV ${parsed.errors.length} uyarı ile ayrıştırıldı.`);
    }
    setFilename(file.name);
    setRows(parsed.rows);
    const detected =
      detectTemplate(parsed.headers, "sales") ?? "etsy_sold_order_items";
    setTemplateId(detected);
    remap(detected, parsed.rows);
  }

  function onTemplateChange(tid: string) {
    const id = tid as MappingTemplateId;
    setTemplateId(id);
    remap(id, rows);
  }

  function onCommit() {
    startTransition(async () => {
      const res = await commitSalesImport({ filename, template: templateId, sales });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `İçe aktarıldı: ${res.imported} satış${
          res.skipped ? `, ${res.skipped} atlandı` : ""
        }`,
      );
      router.push("/satislar");
      router.refresh();
    });
  }

  const preview = sales.slice(0, 10);

  return (
    <div className="max-w-4xl space-y-6">
      <Card>
        <CardContent>
          <label className="border-input hover:bg-muted/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center transition-colors">
            <UploadCloud className="text-muted-foreground size-8" />
            <span className="text-sm font-medium">
              CSV dosyasını seçmek için tıklayın
            </span>
            <span className="text-muted-foreground text-xs">
              Etsy → Shop Manager → Settings → Options → Download Data
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
              }}
            />
          </label>

          {filename && (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <FileSpreadsheet className="size-4" />
                {filename} · {rows.length} satır
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl">Eşleme şablonu</Label>
                <Select value={templateId} onValueChange={onTemplateChange}>
                  <SelectTrigger id="tpl" className="w-[260px]" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALES_TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {filename && (
        <Card>
          <CardHeader>
            <CardTitle>Önizleme · {sales.length} sipariş</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {warnings.length > 0 && (
              <div className="bg-accent/40 text-accent-foreground flex items-start gap-2 rounded-md p-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  {warnings.length} uyarı.{" "}
                  {warnings.slice(0, 3).join(" ")}
                  {warnings.length > 3 ? " …" : ""}
                </div>
              </div>
            )}

            {sales.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Bu şablonla eşleşen sipariş bulunamadı. Farklı bir şablon deneyin.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sipariş No</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Alıcı</TableHead>
                    <TableHead className="text-right">Kalem</TableHead>
                    <TableHead className="text-right">Genel Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((s, i) => (
                    <TableRow key={`${s.order_no}-${i}`}>
                      <TableCell className="font-medium">
                        {s.order_no ?? "—"}
                      </TableCell>
                      <TableCell>{formatDate(s.order_date)}</TableCell>
                      <TableCell>{s.buyer_name ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {s.items.length}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(s.grand_total_cents, s.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {sales.length > preview.length && (
              <p className="text-muted-foreground text-xs">
                İlk {preview.length} sipariş gösteriliyor. Toplam {sales.length}{" "}
                sipariş aktarılacak.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/satislar")}
              >
                Vazgeç
              </Button>
              <Button
                onClick={onCommit}
                disabled={pending || sales.length === 0}
              >
                {pending
                  ? "İçe aktarılıyor…"
                  : `${sales.length} siparişi içe aktar`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
