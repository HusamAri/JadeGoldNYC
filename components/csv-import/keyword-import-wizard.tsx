"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { parseCsv } from "@/lib/csv/parse";
import {
  autoDetectKeywordColumns,
  mapEtsyKeywords,
  type KeywordColumnMap,
  type MappedKeywordRow,
} from "@/lib/csv/mappers/etsy-keywords";
import { commitKeywordImport } from "@/app/(dashboard)/analizler/urunler/anahtar-kelime/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const NONE = "__none__";

export function KeywordImportWizard() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [cols, setCols] = useState<KeywordColumnMap>({});
  const [mapped, setMapped] = useState<MappedKeywordRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  function remap(next: KeywordColumnMap, rows: Record<string, string>[]) {
    const res = mapEtsyKeywords(rows, next);
    setMapped(res.rows);
    setWarnings(res.warnings);
  }

  async function onFile(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.errors.length) {
      toast.warning(`CSV ${parsed.errors.length} uyarı ile ayrıştırıldı.`);
    }
    const detected = autoDetectKeywordColumns(parsed.headers);
    setFilename(file.name);
    setHeaders(parsed.headers);
    setRawRows(parsed.rows);
    setCols(detected);
    remap(detected, parsed.rows);
  }

  function setCol(key: keyof KeywordColumnMap, value: string) {
    const next = { ...cols, [key]: value === NONE ? undefined : value };
    setCols(next);
    remap(next, rawRows);
  }

  function commit() {
    start(async () => {
      const r = await commitKeywordImport(mapped);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(
        `${r.matched} listing eşleşti, ${r.unmatched} eşleşmedi — anahtar kelimeler güncellendi.`,
      );
      router.push("/analizler/urunler");
    });
  }

  const colSelect = (key: keyof KeywordColumnMap, label: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={cols[key] ?? NONE} onValueChange={(v) => setCol(key, v)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sütun seç" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>—</SelectItem>
          {headers.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <label className="border-border hover:bg-accent/40 flex cursor-pointer flex-col items-center gap-2 rounded-[18px] border border-dashed px-6 py-10 text-center transition-colors">
            <UploadCloud aria-hidden className="text-muted-foreground size-8" />
            <span className="text-sm font-medium">
              Etsy Stats arama-terimi CSV&apos;sini seç
            </span>
            <span className="text-muted-foreground text-xs">
              {filename || "Listing + arama terimi (+ tıklama/ziyaret) sütunları içeren dışa aktarım"}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </label>

          {headers.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {colSelect("listing", "Listing sütunu (ID/URL/başlık)")}
              {colSelect("keyword", "Anahtar kelime sütunu")}
              {colSelect("metric", "Metrik (tıklama/ziyaret) — ops.")}
            </div>
          )}
        </CardContent>
      </Card>

      {warnings.length > 0 && (
        <div className="text-muted-foreground flex items-start gap-2 text-sm">
          <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--chart-4)]" />
          <ul className="space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {mapped.length > 0 && (
        <Card>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              {mapped.length} listing için en çok tıklanan kelime bulundu. İçe
              aktarınca eşleşen ürünlerin araştırma kelimesi güncellenir.
            </p>
            <div className="max-h-[420px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Anahtar kelime</TableHead>
                    <TableHead className="text-right">Metrik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapped.slice(0, 200).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">
                        {r.listingId ?? r.title ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium">{r.keyword}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.metric ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <Button onClick={commit} disabled={pending}>
                {pending ? "İçe aktarılıyor…" : `${mapped.length} kelimeyi içe aktar`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
