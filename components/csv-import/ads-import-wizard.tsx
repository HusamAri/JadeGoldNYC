"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { parseCsv } from "@/lib/csv/parse";
import {
  autoDetectAdsColumns,
  mapEtsyAds,
  type AdsColumnMap,
  type MappedAdsRow,
} from "@/lib/csv/mappers/etsy-ads";
import { commitAdsImport } from "@/app/(dashboard)/reklamlar/ice-aktar/actions";
import { formatMoney } from "@/lib/money";
import { formatNumber } from "@/lib/format";
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

export function AdsImportWizard() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [cols, setCols] = useState<AdsColumnMap>({});
  const [mapped, setMapped] = useState<MappedAdsRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  function remap(next: AdsColumnMap, rows: Record<string, string>[]) {
    const res = mapEtsyAds(rows, next);
    setMapped(res.rows);
    setWarnings(res.warnings);
  }

  async function onFile(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.errors.length) {
      toast.warning(`CSV ${parsed.errors.length} uyarı ile ayrıştırıldı.`);
    }
    const detected = autoDetectAdsColumns(parsed.headers);
    setFilename(file.name);
    setHeaders(parsed.headers);
    setRawRows(parsed.rows);
    setCols(detected);
    remap(detected, parsed.rows);
  }

  function setCol(key: keyof AdsColumnMap, value: string) {
    const next = { ...cols, [key]: value === NONE ? undefined : value };
    setCols(next);
    remap(next, rawRows);
  }

  function commit() {
    start(async () => {
      const r = await commitAdsImport(mapped);
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(
        `${r.imported} satır içe aktarıldı — ${r.matched} ürün eşleşti, ${r.unmatched} eşleşmedi.`,
      );
      router.push("/reklamlar");
    });
  }

  const colSelect = (key: keyof AdsColumnMap, label: string) => (
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
              Etsy Ads (Reklam panosu) CSV&apos;sini seç
            </span>
            <span className="text-muted-foreground text-xs">
              {filename ||
                "Listing başlığı + görüntülenme/sipariş/tıklama/harcama/gelir sütunları içeren dışa aktarım"}
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
              {colSelect("title", "Listing başlığı sütunu")}
              {colSelect("views", "Görüntülenme — ops.")}
              {colSelect("orders", "Sipariş — ops.")}
              {colSelect("clicks", "Reklam tıklaması — ops.")}
              {colSelect("spend", "Reklam harcaması — ops.")}
              {colSelect("revenue", "Reklam geliri — ops.")}
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
              {mapped.length} listing bulundu. İçe aktarınca satırlar
              &quot;son 30&quot; etiketli ürün metriği olarak kaydedilir;
              başlığı tutan ürünler otomatik bağlanır.
            </p>
            <div className="max-h-[420px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead className="text-right">Görüntülenme</TableHead>
                    <TableHead className="text-right">Sipariş</TableHead>
                    <TableHead className="text-right">Tık</TableHead>
                    <TableHead className="text-right">Harcama</TableHead>
                    <TableHead className="text-right">Reklam Geliri</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mapped.slice(0, 200).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        <div className="scroll-x max-w-[280px]" title={r.title}>
                          {r.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.views != null ? formatNumber(r.views) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.orders != null ? formatNumber(r.orders) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.adsClicks != null ? formatNumber(r.adsClicks) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.adsSpendCents != null
                          ? formatMoney(r.adsSpendCents)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.adsRevenueCents != null
                          ? formatMoney(r.adsRevenueCents)
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
                  : `${mapped.length} satırı içe aktar`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
