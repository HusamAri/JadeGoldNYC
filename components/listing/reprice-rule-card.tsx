"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gauge, Loader2, Save, TriangleAlert } from "lucide-react";

import {
  getRepriceCardData,
  saveRepriceRule,
  type RepriceLogView,
  type RepriceRuleInput,
} from "@/app/(dashboard)/tasarimlar/listing/[id]/reprice-actions";
import { centsToDecimal, formatMoney } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Otomatik fiyat kuralı kartı — ürün detayında bağımsız yaşar: açılışta kendi
 * verisini server action'dan çeker (kural + son 5 günlük + Etsy yazma izni),
 * kaydetme de kendi action'ıyla yapılır. Kural: fiyat, son rakip araştırması
 * çapasının (ortalama/medyan) tolerans üstüne çıkınca hedefe çekilir; günlük
 * cron değerlendirir. 'Otomatik' mod CANLI Etsy fiyatını değiştirir — kart
 * bunu açıkça uyarır; varyantlı listing'lerde ilk sürümde yalnız öneri üretilir.
 */

const MODE_OPTIONS: { value: RepriceRuleInput["mode"]; label: string }[] = [
  { value: "kapali", label: "Kapalı" },
  { value: "oneri", label: "Yalnız öneri" },
  { value: "otomatik", label: "Otomatik uygula" },
];

const ANCHOR_OPTIONS = [
  { value: "ortalama", label: "Rakip ortalaması" },
  { value: "medyan", label: "Rakip medyanı" },
];

const CONFIDENCE_OPTIONS = [
  { value: "dusuk", label: "Düşük ve üstü" },
  { value: "orta", label: "Orta ve üstü" },
  { value: "yuksek", label: "Yalnız yüksek" },
];

const OUTCOME_META: Record<
  RepriceLogView["outcome"],
  { label: string; variant: "success" | "warning" | "outline" }
> = {
  uygulandi: { label: "Uygulandı", variant: "success" },
  oneri: { label: "Öneri", variant: "warning" },
  atlandi: { label: "Atlandı", variant: "outline" },
};

interface FormState {
  mode: string;
  anchor: string;
  triggerOver: string;
  targetOver: string;
  floor: string;
  floorMeltMult: string;
  maxChangePct: string;
  minConfidence: string;
  cooldownHours: string;
}

/** Varsayılanlar migration 0093 ile birebir ($10 tetik → $9 hedef). */
const DEFAULT_FORM: FormState = {
  mode: "oneri",
  anchor: "ortalama",
  triggerOver: "10,00",
  targetOver: "9,00",
  floor: "",
  floorMeltMult: "1,3",
  maxChangePct: "10",
  minConfidence: "orta",
  cooldownHours: "24",
};

function centsToText(cents: number | null): string {
  return cents != null ? centsToDecimal(cents).toFixed(2).replace(".", ",") : "";
}

export function RepriceRuleCard({
  productId,
  currency,
  hasVariations,
}: {
  productId: string;
  currency: string;
  hasVariations: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasRule, setHasRule] = useState(false);
  const [writeEnabled, setWriteEnabled] = useState(false);
  const [lastAppliedAt, setLastAppliedAt] = useState<string | null>(null);
  const [logs, setLogs] = useState<RepriceLogView[]>([]);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getRepriceCardData(productId);
      if (cancelled) return;
      if ("error" in data) {
        toast.error(data.error);
        setLoading(false);
        return;
      }
      if (data.rule) {
        setHasRule(true);
        setLastAppliedAt(data.rule.last_applied_at);
        setForm({
          mode: data.rule.mode,
          anchor: data.rule.anchor,
          triggerOver: centsToText(data.rule.trigger_over_cents),
          targetOver: centsToText(data.rule.target_over_cents),
          floor: centsToText(data.rule.floor_cents),
          floorMeltMult: String(data.rule.floor_melt_mult).replace(".", ","),
          maxChangePct: String(data.rule.max_change_pct).replace(".", ","),
          minConfidence: data.rule.min_confidence,
          cooldownHours: String(data.rule.cooldown_hours),
        });
      }
      setLogs(data.logs);
      setWriteEnabled(data.writeEnabled);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSave() {
    setSaving(true);
    const res = await saveRepriceRule(productId, form);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setHasRule(true);
    toast.success(
      form.mode === "kapali"
        ? "Kural kaydedildi (kapalı — değerlendirilmeyecek)."
        : "Kural kaydedildi — günlük cron'da değerlendirilecek.",
    );
  }

  if (loading) {
    return (
      <div className="nm-raised flex items-center gap-2.5 rounded-[1.5rem] p-5">
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
        <span className="text-muted-foreground text-sm">
          Fiyat kuralı yükleniyor…
        </span>
      </div>
    );
  }

  return (
    <div className="nm-raised space-y-4 rounded-[1.5rem] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="nm-pressed text-muted-foreground flex size-9 items-center justify-center rounded-[10px]">
            <Gauge className="size-4" />
          </span>
          <div>
            <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
              Otomatik fiyat kuralı
            </p>
            <p className="text-sm font-medium">
              {hasRule
                ? "Fiyat, rakip bandına sabitlenir"
                : "Kural yok — kurup kaydedin"}
            </p>
          </div>
        </div>
        {lastAppliedAt && (
          <span className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
            Son uygulama:{" "}
            {new Date(lastAppliedAt).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <p className="text-muted-foreground text-sm">
        Fiyat, seçilen çapanın (son rakip araştırması) tetik toleransı üstüne
        çıkınca <span className="text-foreground font-medium">çapa + hedef</span>{" "}
        fiyatına çekilir. Örn: ortalamanın $10 üstüne çıkınca ortalama + $9&apos;a
        indirilir.
      </p>

      {/* Kural alanları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`reprice-mode-${productId}`}>Mod</Label>
          <Select value={form.mode} onValueChange={set("mode")}>
            <SelectTrigger id={`reprice-mode-${productId}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reprice-anchor-${productId}`}>Çapa</Label>
          <Select value={form.anchor} onValueChange={set("anchor")}>
            <SelectTrigger id={`reprice-anchor-${productId}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANCHOR_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reprice-conf-${productId}`}>Asgari güven</Label>
          <Select value={form.minConfidence} onValueChange={set("minConfidence")}>
            <SelectTrigger id={`reprice-conf-${productId}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONFIDENCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reprice-trigger-${productId}`}>
            Tetik toleransı ({currency})
          </Label>
          <Input
            id={`reprice-trigger-${productId}`}
            inputMode="decimal"
            placeholder="10,00"
            value={form.triggerOver}
            onChange={(e) => set("triggerOver")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reprice-target-${productId}`}>
            Hedef offset ({currency})
          </Label>
          <Input
            id={`reprice-target-${productId}`}
            inputMode="decimal"
            placeholder="9,00"
            value={form.targetOver}
            onChange={(e) => set("targetOver")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reprice-floor-${productId}`}>
            Taban fiyat ({currency}, boş = melt)
          </Label>
          <Input
            id={`reprice-floor-${productId}`}
            inputMode="decimal"
            placeholder="ör. 89,00"
            value={form.floor}
            onChange={(e) => set("floor")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reprice-mult-${productId}`}>Melt taban çarpanı</Label>
          <Input
            id={`reprice-mult-${productId}`}
            inputMode="decimal"
            placeholder="1,3"
            value={form.floorMeltMult}
            onChange={(e) => set("floorMeltMult")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reprice-pct-${productId}`}>Azami değişim (%)</Label>
          <Input
            id={`reprice-pct-${productId}`}
            inputMode="decimal"
            placeholder="10"
            value={form.maxChangePct}
            onChange={(e) => set("maxChangePct")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`reprice-cd-${productId}`}>Cooldown (saat)</Label>
          <Input
            id={`reprice-cd-${productId}`}
            inputMode="numeric"
            placeholder="24"
            value={form.cooldownHours}
            onChange={(e) => set("cooldownHours")(e.target.value)}
          />
        </div>
      </div>

      {/* Otomatik mod uyarıları — canlı mağazaya dokunur, açıkça söylenir. */}
      {form.mode === "otomatik" && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <p>
              <span className="font-medium">Dikkat:</span> Otomatik mod, koşul
              sağlandığında <span className="font-medium">canlı Etsy fiyatını</span>{" "}
              sormadan değiştirir. Tetik/taban/azami değişim korumaları geçerlidir.
            </p>
            {hasVariations && (
              <p>
                Bu listing varyantlı — otomatik yazma ilk sürümde yalnız
                varyantsız listing&apos;lerde. Kural yine değerlendirilir ama yalnız
                öneri üretir.
              </p>
            )}
            {!writeEnabled && (
              <p>
                Etsy yazma izni (listings_w) şu an kapalı — kural öneri üretir,
                fiyat yazmaz. İzin için Etsy&apos;yi yeniden bağlayın.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Kuralı kaydet
        </Button>
      </div>

      {/* Son 5 değerlendirme — tarih, eski→yeni, sonuç, sebep. */}
      {logs.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-muted-foreground font-mono text-[10px] tracking-[0.14em] uppercase">
            Son değerlendirmeler
          </p>
          <ul className="space-y-2">
            {logs.map((log) => {
              const meta = OUTCOME_META[log.outcome];
              return (
                <li key={log.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="text-muted-foreground font-mono tabular-nums">
                    {new Date(log.created_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-mono font-medium tabular-nums">
                    {log.old_price_cents != null
                      ? formatMoney(log.old_price_cents, currency)
                      : "—"}
                    {" → "}
                    {log.new_price_cents != null
                      ? formatMoney(log.new_price_cents, currency)
                      : "—"}
                  </span>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  {log.reason && (
                    <span className="text-muted-foreground w-full sm:w-auto sm:flex-1">
                      {log.reason}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
