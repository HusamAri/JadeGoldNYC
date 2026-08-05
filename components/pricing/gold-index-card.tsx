"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Landmark, ShieldCheck, TriangleAlert } from "lucide-react";

import { applyGoldIndex } from "@/app/(dashboard)/fiyat/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface GoldBasisRow {
  spot: number;
  date: string;
  source: string;
  note: string | null;
}

interface Props {
  /** Son uygulanan taban ($/ozt). */
  basis: number;
  /** Canlı spot — sunucu tarafında çekildi; alınamadıysa null. */
  liveSpot: number | null;
  liveSources: string;
  /** Spot alınamadıysa SEBEBİ — kullanıcı "API çalışmıyor mu?" diye
   *  sormak zorunda kalmasın, arıza kartın üstünde yazsın. */
  liveError?: string | null;
  history: GoldBasisRow[];
}

const pct = (x: number) => `${x > 0 ? "+" : ""}${x.toFixed(2)}%`;

/**
 * ALTIN ENDEKSİ — otomatik kolun panel yüzü.
 *
 * Konsoldan (elle spot + kuru çalıştırma + onay) farkı: burada spot GİRİLMEZ;
 * canlı piyasadan çift kaynakla çekilir ve fark kapılardan geçerse uygulanır.
 * Cron her sabah 04:30 UTC'de aynı işi kendiliğinden yapar — bu kart, "şimdi
 * olsun" dendiğinde aynı kapılı koşuyu elle tetiklemek içindir.
 */
export function GoldIndexCard({
  basis,
  liveSpot,
  liveSources,
  liveError,
  history,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const step = liveSpot != null ? (liveSpot / basis - 1) * 100 : null;
  const gate =
    step == null
      ? "bilinmiyor"
      : Math.abs(step) < 1
        ? "deadband"
        : Math.abs(step) > 10
          ? "onay-gerekli"
          : "otomatik";

  async function run(force: boolean) {
    setBusy(true);
    try {
      const out = await applyGoldIndex(force);
      if (out.error) {
        toast.error(out.error);
        return;
      }
      const r = out.result;
      if (!r) return;
      if (r.status === "applied") {
        toast.success(
          `Endeks uygulandı: taban $${r.basisPerOzt} → $${r.spotPerOzt} ` +
            `(${pct(r.stepPct)}) · ${r.repriced} varyant hedeflendi, ` +
            `panelde ${r.dbUpdated ?? 0} güncellendi.`,
        );
      } else if (r.status === "deadband") {
        toast.info(
          `Fark ${pct(r.stepPct)} — %1 bandının içinde, değişiklik yapılmadı.`,
        );
      } else if (r.status === "blocked-max-step") {
        toast.warning(
          `Fark ${pct(r.stepPct)} — %10 üstü adım onay ister. ` +
            "Emin misiniz? Onaylıyorsanız 'Onayla ve uygula' ile tekrarlayın.",
        );
      } else {
        toast.error(r.detail ?? `Koşu durumu: ${r.status}`);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Landmark className="size-4" aria-hidden />
              Altın endeksi — otomatik
            </h3>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Her sabah 04:30 UTC&apos;de canlı spot çekilir (tazelik + mantık
              aralığı kapılarından geçer); tabana göre fark{" "}
              <strong>%1&apos;in altındaysa</strong> hiçbir şey yapılmaz,{" "}
              <strong>%1–10 arasındaysa</strong> otomatik uygulanır,{" "}
              <strong>%10&apos;un üstündeyse</strong> burada onayınızı bekler.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground text-xs">Uygulanan taban</dt>
            <dd className="font-medium tabular-nums">${basis.toFixed(0)}/ozt</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">
              Canlı spot{liveSources ? ` (${liveSources})` : ""}
            </dt>
            <dd className="font-medium tabular-nums">
              {liveSpot != null ? `$${liveSpot.toFixed(0)}/ozt` : "alınamadı"}
            </dd>
            {liveSpot == null && liveError && (
              <dd className="text-destructive mt-0.5 text-xs leading-snug">
                {liveError}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Fark</dt>
            <dd className="font-medium tabular-nums">
              {step != null ? pct(step) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Kapı</dt>
            <dd className="flex items-center gap-1 font-medium">
              {gate === "otomatik" && (
                <ShieldCheck className="size-3.5 text-emerald-600" aria-hidden />
              )}
              {gate === "onay-gerekli" && (
                <TriangleAlert className="size-3.5 text-amber-600" aria-hidden />
              )}
              {gate}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            disabled={busy || gate === "deadband"}
            onClick={() => run(false)}
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Endeksi şimdi uygula
          </Button>
          {gate === "onay-gerekli" && (
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => run(true)}
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Onayla ve uygula (%10+ adım)
            </Button>
          )}
          {gate === "deadband" && (
            <span className="text-muted-foreground text-xs">
              Fark %1 bandının içinde — uygulanacak bir şey yok.
            </span>
          )}
        </div>

        {history.length > 0 && (
          <div>
            <h4 className="text-muted-foreground mb-1 text-xs font-medium">
              Taban geçmişi
            </h4>
            <ul className="space-y-1 text-xs">
              {history.map((h, i) => (
                <li key={i} className="text-muted-foreground flex gap-2">
                  <span className="tabular-nums">
                    {new Date(h.date).toLocaleDateString("tr-TR")}
                  </span>
                  <span className="text-foreground font-medium tabular-nums">
                    ${h.spot.toFixed(0)}
                  </span>
                  <span>{h.source}</span>
                  {h.note && <span className="truncate">{h.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
