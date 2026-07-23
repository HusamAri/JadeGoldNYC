"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { parseCsv } from "@/lib/csv/parse";
import {
  autoDetectAdsDailyColumns,
  mapEtsyAdsDaily,
  type AdsDailyColumnMap,
  type MappedAdsDailyRow,
} from "@/lib/csv/mappers/etsy-ads-daily";
import { commitAdsDailyImport } from "@/app/(dashboard)/reklamlar/ice-aktar/actions";
import { formatMoney } from "@/lib/money";
import { formatNumber, formatDate } from "@/lib/format";
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

/**
 * Mağaza geneli GÜNLÜK Etsy Reklam CSV içe aktarımı — listing kırılımı olmayan
 * "stats over time" dışa aktarımı. `ad_daily_stats`'e idempotent yazılır.
 */
export function AdsDailyImportWizard() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [cols, setCols] = useState<AdsDailyColumnMap>({});
  const [mapped, setMapped] = useState<MappedAdsDailyRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  function remap(next: AdsDailyColumnMap, rows: Record<string, string>[]) {
    const res = mapEtsyAdsDaily(rows, next);
    setMapped(res.rows);
    setWarnings(res.warnings);
  }

  async function onFile(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.errors.length) {
      toast.warning(`CSV ${parsed.errors.length} uyarı ile ayrıştırıldı.`);
    }
    const detected = autoDetectAdsDailyColumns(parsed.headers);
    setFilename(file.name);
    setHeaders(parsed.headers);
    setRawRows(parsed.rows);
    setCols(detected);
    remap(detected, parsed.rows);
  }

  function setCol(key: keyof AdsDailyColumnMap, value: string) {
    const next = { ...cols, [key]: value === NONE ? undefined : value };
    setCols(next);
    remap(next, rawRows);
  }

  function commit() {
    start(async () => {
      const r = await commitAdsDailyImport(mapped);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(`${r.imported} günlük satır içe aktarıldı.`);
      router.push("/reklamlar");
    });
  }

  const spendTotal = mapped.reduce((s, r) => s + r.spendCents, 0);
  const revenueTotal = mapped.reduce((s, r) => s + r.revenueCents, 0);

  const colSelect = (key: keyof AdsDailyColumnMap, label: string) => (
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
          <label className="nm-pressed border-border/60 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center transition-all">
            <UploadCloud aria-hidden className="text-muted-foreground size-8" />
            <span className="text-sm font-medium">
              Etsy Reklam · günlük (stats over time) CSV&apos;sini seç
            </span>
            <span className="text-muted-foreground text-xs">
              {filename ||
                "Tarih + görüntülenme/tık/sipariş/ciro/harcama/bütçe sütunları (gün başına bir satır)"}
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
              {colSelect("date", "Tarih sütunu")}
              {colSelect("views", "Görüntülenme — ops.")}
              {colSelect("clicks", "Tık — ops.")}
              {colSelect("orders", "Sipariş — ops.")}
              {colSelect("revenue", "Ciro — ops.")}
              {colSelect("spend", "Harcama — ops.")}
              {colSelect("budget", "Gün sonu bütçe — ops.")}
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
              {mapped.length} gün bulundu · toplam harcama{" "}
              <span className="text-foreground font-medium">
                {formatMoney(spendTotal)}
              </span>{" "}
              · ciro{" "}
              <span className="text-foreground font-medium">
                {formatMoney(revenueTotal)}
              </span>
              . İçe aktarınca mağaza geneli günlük seri olarak kaydedilir; aynı
              gün tekrar yüklenirse üzerine yazılır (satır çoğalmaz).
            </p>
            <div className="max-h-[420px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gün</TableHead>
                    <TableHead className="text-right">Görüntülenme</TableHead>
                    <TableHead className="text-right">Tık</TableHead>
                    <TableHead className="text-right">Sipariş</TableHead>
                    <TableHead className="text-right">Ciro</TableHead>
                    <TableHead className="text-right">Harcama</TableHead>
                    <TableHead className="text-right">Bütçe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapped.slice(0, 200).map((r) => (
                    <TableRow key={r.date}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {formatDate(r.date)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(r.views)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(r.clicks)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(r.orders)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.revenueCents > 0 ? formatMoney(r.revenueCents) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(r.spendCents)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {r.endingBudgetCents != null
                          ? formatMoney(r.endingBudgetCents)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end">
              <Button onClick={commit} disabled={pending}>
                {pending
                  ? "İçe aktarılıyor…"
                  : `${mapped.length} günü içe aktar`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
