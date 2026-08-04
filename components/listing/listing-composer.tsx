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
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [materials, setMaterials] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [karat, setKarat] = useState("14");
  const [goldSpot, setGoldSpot] = useState("");
  const [markup, setMarkup] = useState("2.5");
  const [axisName, setAxisName] = useState("");
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

  function onSave() {
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
        title,
        description,
        tags,
        materials,
        imageUrl,
        karat,
        goldSpot,
        markup,
        axisName,
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
                placeholder="14"
              />
            </div>
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
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground grid grid-cols-[1fr_8rem_7rem_7rem_2.5rem] gap-2 font-mono text-[11px] tracking-wide uppercase">
              <span>SKU (beden gömülü)</span>
              <span>{axisName.trim() || "Eksen değeri"}</span>
              <span>Ağırlık (g)</span>
              <span>Fiyat ($)</span>
              <span />
            </div>
            {rows.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_8rem_7rem_7rem_2.5rem] items-center gap-2"
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
