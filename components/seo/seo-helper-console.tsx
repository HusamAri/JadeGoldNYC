"use client";

import { useMemo, useState } from "react";
import { Check, Copy, TextSearch, X } from "lucide-react";
import { toast } from "sonner";

import {
  generateSeo,
  tagsToLine,
  BUCKET_LABELS,
  ETSY_TAG_MAX,
  ETSY_TITLE_MAX,
  SEO_AUDIENCES,
  SEO_CHAIN_STYLES,
  SEO_FOCUS,
  SEO_MARKETS,
  SEO_MATERIALS,
  SEO_PRODUCT_TYPES,
  type Audience,
  type ChainStyle,
  type Focus,
  type Market,
  type Material,
  type ProductType,
  type SeoInput,
} from "@/lib/seo/keyword-engine";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Küçük bölüm indeks başlığı — panelin idx dili. */
function Idx({ children }: { children: React.ReactNode }) {
  return (
    <div aria-hidden className="idx">
      <span>{children}</span>
      <span className="idx-bar" />
      <span className="idx-ln" />
    </div>
  );
}

/** Pill-toggle seçici grubu (segmented). */
function PillGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3.5 py-1.5 font-mono text-[11px] tracking-[0.08em] uppercase transition-colors duration-300",
                active
                  ? "border-transparent bg-foreground text-background"
                  : "border-[color:var(--glass-border)] text-muted-foreground hover:text-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const BUCKET_VARIANT: Record<
  string,
  "success" | "secondary" | "outline" | "default"
> = {
  ne: "default",
  nasil: "secondary",
  kim: "outline",
  stil: "success",
  neden: "secondary",
};

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} kopyalandı`);
  } catch {
    toast.error("Kopyalanamadı — elle seçip kopyalayın.");
  }
}

/**
 * Listing SEO Yardımcısı konsolu — ürün özelliklerini gir, anlık olarak
 * Etsy'ye uygun başlık + 13 etiket + açıklama + SEO skoru üret. Üretim saf
 * (lib/seo/keyword-engine); değişiklikte useMemo ile yeniden hesaplar.
 *
 * `initial` verilirse (listing detay gömmesi — inferSeoInput çıktısı)
 * seçiciler o değerlerle açılır; verilmezse genel varsayılanlar.
 */
export function SeoHelperConsole({
  initial,
}: {
  initial?: Partial<SeoInput>;
} = {}) {
  const [productType, setProductType] = useState<ProductType>(
    initial?.productType ?? "necklace",
  );
  const [chainStyle, setChainStyle] = useState<ChainStyle>(
    initial?.chainStyle ?? "herringbone",
  );
  const [material, setMaterial] = useState<Material>(
    initial?.material ?? "10k-solid",
  );
  const [focus, setFocus] = useState<Focus>(initial?.focus ?? "dainty");
  const [market, setMarket] = useState<Market>(initial?.market ?? "US");
  const [audience, setAudience] = useState<Audience>(
    initial?.audience ?? "women",
  );
  const [widthMm, setWidthMm] = useState(initial?.widthMm ?? "");
  const [occasion, setOccasion] = useState(initial?.occasion ?? "");

  const input: SeoInput = useMemo(
    () => ({
      productType,
      chainStyle,
      material,
      focus,
      market,
      audience,
      widthMm,
      occasion,
    }),
    [productType, chainStyle, material, focus, market, audience, widthMm, occasion],
  );

  const result = useMemo(() => generateSeo(input), [input]);
  const scorePct = Math.round((result.score.value / result.score.max) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* SOL — Girdi */}
      <Card>
        <CardContent className="space-y-5">
          <Idx>01 · Ürün künyesi</Idx>

          <PillGroup
            label="Ürün tipi"
            value={productType}
            options={SEO_PRODUCT_TYPES}
            onChange={setProductType}
          />
          <PillGroup
            label="Zincir stili"
            value={chainStyle}
            options={SEO_CHAIN_STYLES}
            onChange={setChainStyle}
          />
          <PillGroup
            label="Malzeme"
            value={material}
            options={SEO_MATERIALS}
            onChange={setMaterial}
          />
          <PillGroup
            label="Odak varyant"
            value={focus}
            options={SEO_FOCUS}
            onChange={setFocus}
          />
          <PillGroup
            label="Kitle"
            value={audience}
            options={SEO_AUDIENCES}
            onChange={setAudience}
          />
          <PillGroup
            label="Hedef pazar"
            value={market}
            options={SEO_MARKETS}
            onChange={setMarket}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="seo-width">Genişlik (mm) — ops.</Label>
              <Input
                id="seo-width"
                inputMode="decimal"
                value={widthMm}
                onChange={(e) => setWidthMm(e.target.value)}
                placeholder="ör. 2"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seo-occasion">Durum / hediye — ops.</Label>
              <Input
                id="seo-occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="ör. valentines"
              />
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Malzeme dürüstlüğü gömülü: kaplama/filled üründe &quot;solid/real&quot;
            iddiası üretilmez. Etiketler ≤{ETSY_TAG_MAX} karakter, 5 arama kovasına
            dengeli dağıtılır.
          </p>
        </CardContent>
      </Card>

      {/* SAĞ — Çıktı */}
      <div className="space-y-6">
        {/* Başlık */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Idx>02 · Başlık</Idx>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(result.title, "Başlık")}
              >
                <Copy className="size-3.5" />
                Kopyala
              </Button>
            </div>
            <p className="text-sm leading-relaxed">{result.title}</p>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <Badge variant={result.titleChars <= ETSY_TITLE_MAX ? "success" : "destructive"}>
                {result.titleChars}/{ETSY_TITLE_MAX} kr
              </Badge>
              <span>
                İlk 40:{" "}
                <span className="text-foreground">
                  {result.titleFirst40}
                  {result.titleChars > 40 ? "…" : ""}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Etiketler */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Idx>03 · 13 Etiket</Idx>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(tagsToLine(result.tags), "Etiketler")}
              >
                <Copy className="size-3.5" />
                Kopyala
              </Button>
            </div>
            <div className="space-y-1.5">
              {result.tags.map((t, i) => (
                <div
                  key={t.text}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-muted-foreground w-5 shrink-0 text-right font-mono text-[11px] tabular-nums">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-mono">{t.text}</span>
                  <Badge variant={BUCKET_VARIANT[t.bucket] ?? "outline"}>
                    {BUCKET_LABELS[t.bucket]}
                  </Badge>
                  <span className="text-muted-foreground w-10 shrink-0 text-right font-mono text-[11px] tabular-nums">
                    {t.chars}/{ETSY_TAG_MAX}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Açıklama */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Idx>04 · Açıklama taslağı</Idx>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(result.description, "Açıklama")}
              >
                <Copy className="size-3.5" />
                Kopyala
              </Button>
            </div>
            <pre className="text-muted-foreground bg-muted/40 max-h-72 overflow-auto rounded-xl p-4 font-sans text-xs leading-relaxed whitespace-pre-wrap">
              {result.description}
            </pre>
          </CardContent>
        </Card>

        {/* Skor */}
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Idx>05 · SEO skoru</Idx>
              <Badge
                variant={
                  scorePct >= 100 ? "success" : scorePct >= 70 ? "secondary" : "warning"
                }
              >
                {result.score.value}/{result.score.max} · %{scorePct}
              </Badge>
            </div>
            <ul className="space-y-1.5">
              {result.score.checks.map((c) => (
                <li key={c.key} className="flex items-start gap-2 text-sm">
                  {c.passed ? (
                    <Check className="text-primary mt-0.5 size-4 shrink-0" />
                  ) : (
                    <X className="text-destructive mt-0.5 size-4 shrink-0" />
                  )}
                  <span className={c.passed ? "" : "text-muted-foreground"}>
                    {c.label}
                    {!c.passed && c.hint ? (
                      <span className="text-muted-foreground block text-xs">
                        {c.hint}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <TextSearch className="size-3.5 shrink-0" />
              Son adım (bu ortamdan yapılamaz): Etsy arama çubuğu otomatik-tamamlama
              + eRank ile canlı hacim doğrulaması.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
