"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Sparkles, Save } from "lucide-react";
import { toast } from "sonner";

import {
  inferWeightsBySize,
  distributePriceByWeight,
  parseSkuParts,
  type DistVariant,
} from "@/lib/etsy/distribute";
import { formatMoney, parseMoneyToCents } from "@/lib/money";
import { parseBulkDraftVariants } from "@/lib/listing-draft-variants";
import {
  createDraftListing,
  type DraftVariantInput,
} from "@/app/(dashboard)/tasarimlar/listing/yeni/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const EMPTY_ROW: DraftVariantInput = {
  sku: "",
  weight: "",
  price: "",
  axisValue: "",
  axisValue2: "",
  axisValue3: "",
};

const CONFIDENCE_TR: Record<string, string> = {
  high: "yüksek",
  medium: "orta",
  low: "düşük",
};

interface PreviewRow {
  sku: string;
  size: number | null;
  weightGrams: number | null;
  weightSource: "girildi" | "çıkarım" | null;
  priceCents: number | null;
  priceSource: "girildi" | "dağıtım" | null;
  confidence: string | null;
}

function gramOrNull(s: string): number | null {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function centsOrNull(s: string): number | null {
  if (!s.trim()) return null;
  const cents = parseMoneyToCents(s);
  return cents > 0 ? cents : null;
}

function numOrUndefined(s: string): number | undefined {
  const v = s.trim().replace(",", ".");
  if (!v) return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * Yeni listing composer — künye + varyant satırları. Eksik gram/fiyat,
 * distribute.ts motoruyla (ağırlık ← beden, fiyat ← ağırlık) canlı önizlemede
 * kaynak rozetleriyle gösterilir; "Taslak olarak kaydet" ham girdileri
 * createDraftListing action'ına gönderir (sunucu aynı motorla yeniden hesaplar)
 * ve başarıda listing detayına yönlendirir.
 */
export function ListingComposer() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [listingProtocol, setListingProtocol] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [materials, setMaterials] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [karat, setKarat] = useState("");
  const [goldSpot, setGoldSpot] = useState("");
  const [markup, setMarkup] = useState("2.5");
  const [axisName, setAxisName] = useState("");
  const [axisName2, setAxisName2] = useState("");
  const [axisName3, setAxisName3] = useState("");
  const [stagingJson, setStagingJson] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [rows, setRows] = useState<DraftVariantInput[]>([
    { ...EMPTY_ROW },
    { ...EMPTY_ROW },
    { ...EMPTY_ROW },
  ]);

  // Canlı önizleme — kayıtla birebir aynı motor + aynı ayrıştırma kuralları.
  const preview = useMemo<PreviewRow[]>(() => {
    const base: DistVariant[] = rows
      .filter((r) => r.sku.trim())
      .map((r) => ({
        sku: r.sku.trim(),
        weightGrams: gramOrNull(r.weight),
        priceCents: centsOrNull(r.price),
      }));
    if (base.length === 0) return [];

    const wPred = new Map(inferWeightsBySize(base).map((p) => [p.sku, p]));
    const withWeights: DistVariant[] = base.map((v) => ({
      ...v,
      weightGrams: v.weightGrams ?? wPred.get(v.sku)?.weightGrams ?? null,
    }));
    const pPred = new Map(
      distributePriceByWeight(withWeights, {
        karat: numOrUndefined(karat),
        goldSpotPerGramUsd: numOrUndefined(goldSpot),
        markup: numOrUndefined(markup),
      }).map((p) => [p.sku, p]),
    );

    return base.map((v) => {
      const wp = wPred.get(v.sku);
      const pp = pPred.get(v.sku);
      const conf = wp?.confidence ?? pp?.confidence ?? null;
      return {
        sku: v.sku,
        size: parseSkuParts(v.sku).size,
        weightGrams: v.weightGrams ?? wp?.weightGrams ?? null,
        weightSource:
          v.weightGrams != null ? "girildi" : wp ? "çıkarım" : null,
        priceCents: v.priceCents ?? pp?.priceCents ?? null,
        priceSource: v.priceCents != null ? "girildi" : pp ? "dağıtım" : null,
        confidence: conf ? (CONFIDENCE_TR[conf] ?? conf) : null,
      };
    });
  }, [rows, karat, goldSpot, markup]);

  function setRow(i: number, key: keyof DraftVariantInput, value: string) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [key]: value } : r)));
  }

  async function importTextFile(file: File, maxBytes: number, update: (text: string) => void) {
    if (file.size > maxBytes) {
      toast.error(`Dosya ${maxBytes / 1024} KB'ı aşamaz.`);
      return;
    }
    try {
      update(await file.text());
      toast.success("Dosya forma alındı; henüz kaydedilmedi.");
    } catch {
      toast.error("Dosya okunamadı. Yeniden seçin veya metni alana yapıştırın.");
    }
  }

  function importBulkRows() {
    const parsed = parseBulkDraftVariants(bulkText);
    if (parsed.error !== undefined) {
      toast.error(parsed.error);
      return;
    }
    setRows(parsed.rows);
    toast.success(`${parsed.rows.length} varyant satırı içe aktarıldı.`);
  }

  function onSave() {
    if (!listingProtocol) {
      toast.error("Ürün tipini seçin; yeni taslaklar alyans varsayılmaz.");
      return;
    }
    if (!title.trim()) {
      toast.error("Başlık boş olamaz.");
      return;
    }
    const skus = rows.map((r) => r.sku.trim()).filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      toast.error("Varyant SKU'ları benzersiz olmalı.");
      return;
    }
    startTransition(async () => {
      const res = await createDraftListing({
        listingProtocol,
        title,
        description,
        tags,
        materials,
        imageUrl,
        karat,
        goldSpot,
        markup,
        axisName,
        axisName2,
        axisName3,
        stagingJson,
        variants: rows,
      });
      if (res.error || !res.id) {
        toast.error(res.error ?? "Taslak kaydedilemedi.");
        return;
      }
      toast.success("Taslak kaydedildi");
      router.push(`/tasarimlar/listing/${res.id}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* 01 · Künye */}
      <Card>
        <CardContent className="space-y-4">
          <div aria-hidden className="idx">
            <span>01 · Künye</span>
            <span className="idx-bar" />
            <span className="idx-ln" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lc-protocol">Ürün tipi *</Label>
              <Select
                value={listingProtocol}
                onValueChange={(value) => {
                  setListingProtocol(value);
                  if ((value === "signet_ring" || value === "monogram_signet_ring") && !axisName.trim()) {
                    setAxisName("Ring Size");
                  }
                  if (value === "sculptural_ring") {
                    setAxisName("Ring Size");
                    setAxisName2("Metal Color");
                  }
                }}
              >
                <SelectTrigger id="lc-protocol" className="w-full">
                  <SelectValue placeholder="Ürün tipini seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signet_ring">Initial signet ring · tek harf</SelectItem>
                  <SelectItem value="monogram_signet_ring">Monogram signet ring · opsiyonel 4 karakter gravür</SelectItem>
                  <SelectItem value="sculptural_ring">Sculptural ring · açık işçilikli yüzük</SelectItem>
                  <SelectItem value="wedding_band">Wedding band · alyans</SelectItem>
                  <SelectItem value="pendant_necklace">Pendant necklace · kolye</SelectItem>
                  <SelectItem value="chain_bracelet">Chain bracelet · bileklik</SelectItem>
                  <SelectItem value="cuff_bracelet">Cuff bracelet · kelepçe</SelectItem>
                </SelectContent>
              </Select>
              {listingProtocol === "signet_ring" && (
                <p className="text-muted-foreground text-xs">
                  Etsy kişiselleştirmesinde müşteri yüzüğün yüzüne basılacak tek bir A–Z harfi seçer.
                  Çok bedenli taslaklarda eksen Ring Size olmalıdır.
                </p>
              )}
              {listingProtocol === "sculptural_ring" && (
                <p className="text-muted-foreground text-xs">
                  Alyans veya signet değildir; kişiselleştirme eklenmez. Çok varyantlı taslakta Ring Size ve Metal Color birlikte kaydedilir.
                </p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lc-title">Başlık *</Label>
              <Input
                id="lc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ör. 14K Solid Gold Curb Chain Necklace"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lc-description">Açıklama</Label>
              <Textarea
                id="lc-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Listing açıklaması…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lc-tags">Etiketler (virgüllü)</Label>
              <Input
                id="lc-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="gold chain, curb necklace, 14k gold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lc-materials">Malzemeler (virgüllü)</Label>
              <Input
                id="lc-materials"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="14k solid gold"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lc-image">Kapak görseli URL&apos;i</Label>
              <Input
                id="lc-image"
                type="url"
                inputMode="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…/kapak.jpg"
              />
              <p className="text-muted-foreground text-xs">
                Panelde üretilen taslağın kapağını yazabileceğin TEK yer burası
                (Etsy senkronu yalnız canlı listing&apos;in görselini aynalar).
                Adres herkese açık olmalı — &quot;Etsy&apos;e gönder&quot;
                adımında kapak baytı buradan indirilir.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lc-karat">Ayar</Label>
              <Input
                id="lc-karat"
                inputMode="numeric"
                value={karat}
                onChange={(e) => setKarat(e.target.value)}
                placeholder="ör. 14 (doğrulandıysa)"
              />
            </div>
            <details className="space-y-2 sm:col-span-2">
              <summary className="cursor-pointer text-sm">İsteğe bağlı yapılandırılmış taslak bilgileri</summary>
              <Label htmlFor="lc-staging-file">Taslak JSON dosyası (en fazla 256 KB)</Label>
              <Input
                id="lc-staging-file"
                type="file"
                accept=".json,application/json,text/plain"
                disabled={pending}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (file) void importTextFile(file, 256 * 1024, setStagingJson);
                }}
              />
              <Label htmlFor="lc-staging-json">Taslak JSON&apos;u</Label>
              <Textarea
                id="lc-staging-json"
                rows={5}
                value={stagingJson}
                onChange={(e) => setStagingJson(e.target.value)}
                placeholder={'{"sku":"MODEL-Y","quantity":20,"weightSource":"estimated","metadata":{}}'}
              />
              <p className="text-muted-foreground text-xs">
                Üst SKU, adet, ağırlık kaynağı ve kaynak kayıtlarını korur. Çeviriler, ölçüler ve üretim bilgileri metadata içinde saklanır. Bilinmeyen fiyat/gram boş kalabilir. Yalnız yeni panel taslağı oluşturur; Etsy&apos;ye göndermez.
              </p>
            </details>
          </div>
        </CardContent>
      </Card>

      {/* 02 · Varyantlar */}
      <Card>
        <CardContent className="space-y-4">
          <div aria-hidden className="idx">
            <span>02 · Varyantlar</span>
            <span className="idx-bar" />
            <span className="idx-ln" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lc-spot">Altın gram fiyatı (USD/g) — ops.</Label>
              <Input
                id="lc-spot"
                inputMode="decimal"
                value={goldSpot}
                onChange={(e) => setGoldSpot(e.target.value)}
                placeholder="Tek fiyat noktası yoksa gerekli"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lc-markup">Markup (işçilik/kâr çarpanı)</Label>
              <Input
                id="lc-markup"
                inputMode="decimal"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                placeholder="2.5"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lc-axis">Varyasyon ekseni (Etsy seçenek adı)</Label>
              <Input
                id="lc-axis"
                value={axisName}
                onChange={(e) => setAxisName(e.target.value)}
                placeholder="ör. Ring Size / Width"
              />
              <p className="text-muted-foreground text-xs">
                Varyantları Etsy&apos;de AYRI seçenek olarak göstermenin tek
                yolu budur. Boş bırakırsan taslak panele düşer ama
                &quot;Etsy&apos;e gönder&quot; adımı durur — eksensiz varyantlar
                Etsy&apos;de tek seçeneğe iner.
              </p>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lc-axis2">İkinci varyasyon ekseni (Etsy seçenek adı)</Label>
              <Input
                id="lc-axis2"
                value={axisName2}
                onChange={(e) => setAxisName2(e.target.value)}
                placeholder="ör. Metal Color"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="lc-axis3">Üçüncü varyasyon ekseni (panel taslağı)</Label>
              <Input
                id="lc-axis3"
                value={axisName3}
                onChange={(e) => setAxisName3(e.target.value)}
                placeholder="ör. Karat"
              />
              <p className="text-muted-foreground text-xs">
                Üç eksen panele kaydedilir. Etsy&apos;ye üç eksenli gönderim ayrı doğrulama gerektirir; bu kayıt Etsy&apos;ye göndermez.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lc-bulk-file">Varyant CSV/TSV dosyası (en fazla 1 MB)</Label>
            <Input
              id="lc-bulk-file"
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              disabled={pending}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (file) void importTextFile(file, 1024 * 1024, setBulkText);
              }}
            />
            <Label htmlFor="lc-bulk">Toplu varyant girişi (TAB veya CSV)</Label>
            <Textarea
              id="lc-bulk"
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={axisName3.trim() ? "SKU, 1. eksen, 2. eksen, 3. eksen, gram, fiyat" : "SKU, 1. eksen, 2. eksen, gram, fiyat"}
            />
            <Button type="button" variant="outline" size="sm" onClick={importBulkRows}>
              Toplu satırları içe aktar
            </Button>
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground grid min-w-[980px] grid-cols-[minmax(14rem,1fr)_8rem_8rem_8rem_7rem_7rem_2.5rem] gap-2 font-mono text-[11px] tracking-wide uppercase">
              <span>SKU (beden gömülü)</span>
              <span>{axisName.trim() || "Eksen değeri"}</span>
              <span>{axisName2.trim() || "2. eksen"}</span>
              <span>{axisName3.trim() || "3. eksen"}</span>
              <span>Ağırlık (g)</span>
              <span>Fiyat ($)</span>
              <span />
            </div>
            {rows.map((r, i) => (
              <div
                key={i}
                className="grid min-w-[980px] grid-cols-[minmax(14rem,1fr)_8rem_8rem_8rem_7rem_7rem_2.5rem] items-center gap-2"
              >
                <Input
                  value={r.sku}
                  onChange={(e) => setRow(i, "sku", e.target.value)}
                  placeholder="ör. C14-22"
                  className="font-mono"
                />
                <Input
                  value={r.axisValue ?? ""}
                  onChange={(e) => setRow(i, "axisValue", e.target.value)}
                  placeholder={axisName.trim() ? "ör. US 7" : "—"}
                  disabled={!axisName.trim()}
                />
                <Input
                  value={r.axisValue2 ?? ""}
                  onChange={(e) => setRow(i, "axisValue2", e.target.value)}
                  placeholder={axisName2.trim() ? "ör. Yellow Gold" : "—"}
                  disabled={!axisName2.trim()}
                />
                <Input
                  value={r.axisValue3 ?? ""}
                  onChange={(e) => setRow(i, "axisValue3", e.target.value)}
                  placeholder={axisName3.trim() ? "ör. 14K" : "—"}
                  disabled={!axisName3.trim()}
                />
                <Input
                  inputMode="decimal"
                  value={r.weight}
                  onChange={(e) => setRow(i, "weight", e.target.value)}
                  placeholder="—"
                />
                <Input
                  inputMode="decimal"
                  value={r.price}
                  onChange={(e) => setRow(i, "price", e.target.value)}
                  placeholder="—"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setRows((rs) =>
                      rs.length > 1 ? rs.filter((_, j) => j !== i) : rs,
                    )
                  }
                  aria-label="Satırı sil"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((rs) => [...rs, { ...EMPTY_ROW }])}
            >
              <Plus className="size-4" />
              Varyant ekle
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            En az bir varyanta ağırlık gir → kalan ağırlıklar bedenden çıkarılır.
            En az bir fiyat gir (veya altın gram fiyatı + ayar) → kalan fiyatlar
            ağırlıktan dağıtılır. Hesap anlıktır; kayıt öncesi önizlemeyi kontrol et.
          </p>
        </CardContent>
      </Card>

      {/* 03 · Önizleme */}
      {preview.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <div aria-hidden className="idx">
              <Sparkles className="size-4" />
              <span>03 · Önizleme — kaydedilecek varyantlar</span>
              <span className="idx-bar" />
              <span className="idx-ln" />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Beden</TableHead>
                    <TableHead className="text-right">Ağırlık (g)</TableHead>
                    <TableHead className="text-right">Fiyat</TableHead>
                    <TableHead>Kaynak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((p) => (
                    <TableRow key={p.sku}>
                      <TableCell className="font-mono">{p.sku}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.size ?? "—"}
                      </TableCell>
                      <TableCell
                        className={
                          p.weightSource === "çıkarım"
                            ? "text-primary text-right tabular-nums"
                            : "text-right tabular-nums"
                        }
                      >
                        {p.weightGrams != null ? p.weightGrams.toFixed(2) : "—"}
                      </TableCell>
                      <TableCell
                        className={
                          p.priceSource === "dağıtım"
                            ? "text-primary text-right font-mono tabular-nums"
                            : "text-right font-mono tabular-nums"
                        }
                      >
                        {p.priceCents != null
                          ? formatMoney(p.priceCents, "USD")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {p.weightSource && (
                            <Badge
                              variant={
                                p.weightSource === "girildi"
                                  ? "secondary"
                                  : "success"
                              }
                            >
                              gram · {p.weightSource}
                            </Badge>
                          )}
                          {p.priceSource && (
                            <Badge
                              variant={
                                p.priceSource === "girildi"
                                  ? "secondary"
                                  : "success"
                              }
                            >
                              fiyat · {p.priceSource}
                            </Badge>
                          )}
                          {p.confidence && (
                            <span className="text-muted-foreground font-mono text-[10px]">
                              ({p.confidence})
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
        <Button type="button" onClick={onSave} disabled={pending}>
          <Save className="size-4" />
          {pending ? "Kaydediliyor…" : "Taslak olarak kaydet"}
        </Button>
      </div>
    </div>
  );
}
