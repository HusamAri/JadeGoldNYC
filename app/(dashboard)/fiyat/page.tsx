import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPricingConfig } from "@/lib/pricing-engine/config";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PricingConsole } from "@/components/pricing/pricing-console";
import { PricingConfigForm } from "@/components/pricing/pricing-config-form";
import {
  GoldIndexCard,
  type GoldBasisRow,
} from "@/components/pricing/gold-index-card";
import { fetchLiveSpotUsd, type SpotQuote } from "@/lib/pricing/gold-index";
import type { PricingRunRow } from "@/lib/pricing-engine/run";

export const metadata = { title: "Fiyat" };
// Kuru çalıştırma listing başına bir Etsy envanter okuması yapar; itiş de
// listing başına bir PUT. 40+ listing tek çağrıda dakikalara çıkabilir.
export const maxDuration = 300;

interface RunRow {
  id: string;
  status: string;
  spot_usd_per_ozt: string | number;
  rows: PricingRunRow[];
  total_rows: number;
  changed_rows: number;
  below_floor_rows: number;
  unknown_rows: number;
  updated_rows: number;
  created_at: string;
}

export default async function FiyatPage() {
  const m = await requireMembership();
  const admin = createAdminClient();

  const [config, writeAccess, runsRes] = await Promise.all([
    getPricingConfig(m.org_id),
    getEtsyWriteAccess(m.org_id),
    admin
      .from("pricing_runs")
      .select(
        "id, status, spot_usd_per_ozt, rows, total_rows, changed_rows, below_floor_rows, unknown_rows, updated_rows, created_at",
      )
      .eq("org_id", m.org_id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const runs = (runsRes.data ?? []) as RunRow[];
  const bekleyen = runs.find((r) => r.status === "dry_run") ?? null;
  const gecmis = runs.filter((r) => r.status !== "dry_run").slice(0, 4);

  // Altın endeksi: taban geçmişi + canlı spot (dış kaynak; sayfayı asla
  // kilitlemesin — 5sn'de vazgeç, kart "alınamadı" gösterir).
  const { data: basisRows } = await admin
    .from("gold_reprice_basis")
    .select("spot_per_ozt, source, note, created_at")
    .eq("org_id", m.org_id)
    .order("created_at", { ascending: false })
    .limit(5);
  const basisHistory: GoldBasisRow[] = (
    (basisRows ?? []) as {
      spot_per_ozt: string | number;
      source: string;
      note: string | null;
      created_at: string;
    }[]
  ).map((r) => ({
    spot: Number(r.spot_per_ozt),
    date: r.created_at,
    source: r.source,
    note: r.note,
  }));
  let liveQuote: SpotQuote | null = null;
  let liveError: string | null = null;
  try {
    liveQuote = await Promise.race([
      fetchLiveSpotUsd(),
      // Sayfa dış kaynak yüzünden kilitlenmesin. Süre 5sn'den 8sn'ye çekildi:
      // soğuk başlangıçta 5sn sınırda kalıyordu ve kart sebepsiz "alınamadı"
      // gösteriyordu (kullanıcı "API çalışmıyor mu?" diye sordu — sebebi
      // görünmediği için teşhis edilemiyordu).
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (liveQuote == null) liveError = "kaynak 8 saniyede yanıt vermedi";
  } catch (e) {
    // SEBEBİ YUTMA: kart nedeni gösterir, yoksa arıza teşhis edilemez.
    liveError = e instanceof Error ? e.message : String(e);
    liveQuote = null;
  }

  return (
    <div className="page-stack pb-32">
      <PageHeader
        title="Fiyat"
        description="Tek kol spot fiyattır. Değiştirince her varyant kendi gramından, saflığından, genişlik çarpanından ve işçilik sınıfından yeniden hesaplanır. Elle fiyat yazılmaz, bir varyantın fiyatı diğerine kopyalanmaz."
      />

      <div aria-hidden className="idx -mb-3">
        <span>Fiyat / 01 · Spot ve kuru çalıştırma</span>
        <span className="idx-bar" />
      </div>

      <PricingConsole
        spot={config.spotUsdPerOzt}
        writeEnabled={writeAccess.writeEnabled}
        bekleyen={
          bekleyen
            ? {
                id: bekleyen.id,
                spot: Number(bekleyen.spot_usd_per_ozt),
                rows: bekleyen.rows ?? [],
                total: bekleyen.total_rows,
                changed: bekleyen.changed_rows,
                belowFloor: bekleyen.below_floor_rows,
                unknown: bekleyen.unknown_rows,
                createdAt: bekleyen.created_at,
              }
            : null
        }
      />

      <div aria-hidden className="idx -mb-3">
        <span>Fiyat / 02 · Altın endeksi (otomatik)</span>
        <span className="idx-bar" />
      </div>

      <GoldIndexCard
        basis={basisHistory[0]?.spot ?? config.spotUsdPerOzt}
        liveSpot={liveQuote?.spotPerOzt ?? null}
        liveSources={(liveQuote?.sources ?? []).map((s) => s.name).join(" + ")}
        liveError={liveError}
        history={basisHistory}
      />

      <div aria-hidden className="idx -mb-3">
        <span>Fiyat / 03 · Motor ayarları</span>
        <span className="idx-bar" />
      </div>

      <PricingConfigForm
        config={{
          fireFactor: config.fireFactor,
          laborUsd: config.laborUsd,
          laborHandfinishedUsd: config.laborHandfinishedUsd,
          packagingUsd: config.packagingUsd,
          shippingUsd: config.shippingUsd,
          multiplierNarrow: config.multiplierNarrow,
          multiplierWide: config.multiplierWide,
          wideBandMinMm: config.wideBandMinMm,
          saleRate: config.saleRate,
        }}
        stored={config.stored}
      />

      <div aria-hidden className="idx -mb-3">
        <span>Fiyat / 03 · Geçmiş koşular</span>
        <span className="idx-bar" />
      </div>

      <Card>
        <CardContent className="pt-5">
          {gecmis.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Henüz tamamlanmış bir fiyat koşusu yok.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {gecmis.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-0"
                >
                  <span className="text-foreground">
                    {new Date(r.created_at).toLocaleString("tr-TR")} · spot{" "}
                    {Number(r.spot_usd_per_ozt)} $/ozt
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {r.status} · {r.total_rows} satır · {r.updated_rows} yazıldı
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
