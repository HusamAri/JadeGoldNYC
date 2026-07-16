"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  ShieldAlert,
  Tag,
  Megaphone,
  Trash2,
  Search,
  Sparkles,
} from "lucide-react";

import type { ListingHealth, ListingActionKind } from "@/lib/db/queries/listing-health";
import {
  applyMarketPrice,
  rejectMarketPrice,
  type RejectReason,
} from "@/app/(dashboard)/analizler/urunler/liste/actions";
import { Card, CardContent } from "@/components/ui/card";

const ACTION_META: Record<
  ListingActionKind,
  { icon: typeof Tag; tone: string; ring: string }
> = {
  koru: { icon: Check, tone: "text-emerald-600", ring: "border-emerald-500 bg-emerald-500/5" },
  fiyat: { icon: Tag, tone: "text-amber-600", ring: "border-amber-500 bg-amber-500/5" },
  tanit: { icon: Megaphone, tone: "text-sky-600", ring: "border-sky-500 bg-sky-500/5" },
  tedarik: { icon: ShieldAlert, tone: "text-red-600", ring: "border-red-500 bg-red-500/5" },
  kapat: { icon: Trash2, tone: "text-red-600", ring: "border-red-500 bg-red-500/5" },
  incele: { icon: Search, tone: "text-muted-foreground", ring: "border-border bg-muted/30" },
};

const REJECT_OPTIONS: { value: RejectReason; label: string }[] = [
  { value: "tedarik", label: "Tedarik / stok problemi" },
  { value: "maliyet_alti", label: "Önerilen fiyat maliyetin altında" },
  { value: "marka_primi", label: "Meşru pahalılık (marka/kalite/kargo primi)" },
  { value: "yanlis_rakip", label: "Rakipler bire bir aynı ürün değil" },
  { value: "gecici", label: "Şimdilik izle (geçici)" },
  { value: "diger", label: "Diğer" },
];

const DECISION_LABEL: Record<string, string> = {
  applied: "Uygulandı",
  rejected: "Reddedildi",
};

interface Props {
  health: ListingHealth;
  decision: {
    decision: "applied" | "rejected";
    reject_reason: string | null;
    next_action: string | null;
    applied_price_cents: number | null;
    created_at: string;
  } | null;
}

export function ListingActionPanel({ health, decision }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState<RejectReason>("tedarik");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const a = health.action;
  const meta = ACTION_META[a.kind];
  const Icon = meta.icon;
  const market = health.market;
  const suggested = market?.suggested_price_cents ?? null;
  const researchId = null as string | null; // araştırma id'si sayfadan geçmiyor; zaman-bazlı bağ
  const fmt = (c: number | null) => (c == null ? "—" : `$${(c / 100).toFixed(0)}`);

  function onApply() {
    if (suggested == null) return;
    setErr(null);
    startTransition(async () => {
      const r = await applyMarketPrice({
        productId: health.product_id,
        researchId,
        suggestedPriceCents: suggested,
      });
      if (r.error) setErr(r.error);
      else router.refresh();
    });
  }

  function onReject() {
    setErr(null);
    startTransition(async () => {
      const r = await rejectMarketPrice({
        productId: health.product_id,
        researchId,
        suggestedPriceCents: suggested,
        reason,
        note,
      });
      if (r.error) setErr(r.error);
      else {
        setRejectOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="idx">
          <span>Önerilen aksiyon · tüm veri</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
        </div>

        {/* Holistik aksiyon (satış + dönüşüm + tedarik + pazar birlikte) */}
        <div className={`space-y-1.5 rounded-xl border-l-4 p-3.5 shadow-[var(--lift-sm)] ${meta.ring}`}>
          <div className="flex items-center gap-2">
            <Icon aria-hidden className={`size-4 ${meta.tone}`} />
            <span className={`font-semibold ${meta.tone}`}>{a.title}</span>
          </div>
          <p className="text-sm leading-relaxed">{a.reasoning}</p>
        </div>

        {/* Sinyal özeti */}
        <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
          <span>Ömür sipariş: <b className="text-foreground">{health.orders_lifetime}</b></span>
          <span>30g sipariş: <b className="text-foreground">{health.orders_30d}</b></span>
          <span>Görüntülenme: <b className="text-foreground">{health.views.toLocaleString("tr-TR")}</b></span>
          <span>Favori: <b className="text-foreground">{health.favorers}</b></span>
          {health.cancel_rate != null && (
            <span>
              İptal oranı:{" "}
              <b className={health.cancel_rate >= 0.4 ? "text-destructive" : "text-foreground"}>
                %{Math.round(health.cancel_rate * 100)}
              </b>
            </span>
          )}
          {health.conversion != null && (
            <span>Dönüşüm: <b className="text-foreground">%{(health.conversion * 100).toFixed(2)}</b></span>
          )}
          {market?.price_position && market.price_position !== "belirsiz" && (
            <span>
              Pazar:{" "}
              <b className="text-foreground">
                {market.price_position === "pahali" ? "pahalı" : market.price_position === "ucuz" ? "ucuz" : "bantta"}
              </b>
            </span>
          )}
        </div>

        {/* Karar verilmişse: durum + sonraki aksiyon */}
        {decision ? (
          <div className="bg-secondary/40 space-y-1 rounded-xl border p-3.5 shadow-[var(--lift-sm)]">
            <div className="flex items-center gap-2 text-sm font-medium">
              {decision.decision === "applied" ? (
                <Check aria-hidden className="size-4 text-emerald-600" />
              ) : (
                <X aria-hidden className="size-4 text-amber-600" />
              )}
              {DECISION_LABEL[decision.decision]}
              {decision.applied_price_cents != null && (
                <span className="font-mono tabular-nums">
                  · {fmt(decision.applied_price_cents)}
                </span>
              )}
              {decision.reject_reason && (
                <span className="text-muted-foreground font-normal">
                  · {REJECT_OPTIONS.find((o) => o.value === decision.reject_reason)?.label}
                </span>
              )}
            </div>
            {decision.next_action && (
              <p className="text-muted-foreground text-sm">
                <span className="font-medium">Sıradaki: </span>
                {decision.next_action}
              </p>
            )}
          </div>
        ) : (
          /* Karar yok: uygula / reddet */
          <div className="space-y-3 border-t pt-3">
            {suggested != null ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onApply}
                    disabled={pending}
                    className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-[var(--lift-sm)] transition-[translate,scale,box-shadow,opacity] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--lift)] active:translate-y-0 active:scale-[0.97] disabled:opacity-50"
                  >
                    <Sparkles aria-hidden className="size-4" />
                    Önerilen fiyatı uygula ({fmt(suggested)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectOpen((v) => !v)}
                    disabled={pending}
                    className="border-border hover:border-foreground/40 hover:bg-accent/50 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-[border-color,background-color,scale] duration-200 active:scale-[0.97] disabled:opacity-50"
                  >
                    <X aria-hidden className="size-4" />
                    Uygulama, gerekçe sun
                  </button>
                  {market?.price_position === "pahali" && (
                    <span className="text-muted-foreground text-xs">
                      Mevcut {fmt(health.price_cents)} → {fmt(suggested)}
                    </span>
                  )}
                </div>

                {rejectOpen && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <label htmlFor="reject-reason" className="text-sm font-medium">
                      Reddetme gerekçesi
                    </label>
                    <select
                      id="reject-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value as RejectReason)}
                      className="border-border bg-background w-full rounded-md border px-2 py-1.5 text-sm"
                    >
                      {REJECT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Not (opsiyonel)…"
                      aria-label="Reddetme notu"
                      rows={2}
                      className="border-border bg-background w-full rounded-md border px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={onReject}
                      disabled={pending}
                      className="bg-secondary hover:bg-secondary/80 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-[background-color,scale] duration-200 active:scale-[0.97] disabled:opacity-50"
                    >
                      Gerekçeyi kaydet
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Önerilecek somut bir fiyat yok (pazar bandında veya veri yetersiz).
                Aksiyon için yukarıdaki öneriyi izleyin.
              </p>
            )}
            {err && <p className="text-destructive text-sm">{err}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
