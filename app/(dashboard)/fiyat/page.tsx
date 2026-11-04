import { requireMembership } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPricingConfig } from "@/lib/pricing-engine/config";
import { getEtsyWriteAccess } from "@/lib/db/queries/etsy";
import { PageHeader } from "@/components/page-header";
import { Bezel, Screen, Knob } from "@/components/instruments";
import { formatMoneyParts, formatPercent } from "@/lib/money";
import { formatNumber } from "@/lib/format";
import { PricingConsole } from "@/components/pricing/pricing-console";
import { PanelPushCard } from "@/components/pricing/panel-push-card";
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

  // Etsy günlük kota telemetrisi (0134) — istemci her cevaptan kaydediyor.
  const { data: quotaRow } = await admin
    .from("etsy_connection")
    .select("quota_remaining, quota_limit_daily, quota_observed_at")
    .eq("org_id", m.org_id)
    .maybeSingle();
  const quota = (quotaRow ?? null) as {
    quota_remaining: number | null;
    quota_limit_daily: number | null;
    quota_observed_at: string | null;
  } | null;

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

  // Anahtar göstergeleri: motorun üç ana kolu (fire, işçilik, indirim) —
  // salt okunur düğme; gerçek düzenleme aşağıdaki formda.
  const knobs = [
    { label: "Fire", value: (config.fireFactor - 1) / 0.25, readout: `×${config.fireFactor.toFixed(2)}` },
    { label: "İşçilik", value: config.laborUsd / 200, readout: `$${config.laborUsd}` },
    { label: "İndirim", value: config.saleRate, readout: `%${Math.round(config.saleRate * 100)}` },
  ];
  const spotParts = formatMoneyParts(Math.round(config.spotUsdPerOzt * 100), "USD");

  return (
    <div className="flex flex-col gap-8 pb-24">
      <PageHeader
        eyebrow="09 · Stok & Fiyat"
        meta={writeAccess.writeEnabled ? "Etsy yazma açık" : "Etsy salt-okunur"}
        title="Fiyat Motoru"
        description="Tek kol spot fiyattır. Değiştirince her varyant kendi gramından, saflığından, genişlik çarpanından ve işçilik sınıfından yeniden hesaplanır. Elle fiyat yazılmaz."
      />

      {/* Kumanda masası: solda spot ekranı + üç düğme + segment, sağda konsol. */}
      <section className="grid gap-x-12 gap-y-10 xl:grid-cols-[340px_1fr]">
        <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-20 xl:self-start">
          <div className="sec-h">
            <span className="num">A</span>
            <h2>Kumanda</h2>
          </div>
          <Bezel>
            <Screen>
              <div className="flex justify-between">
                <span className="dim">Taban spot · USD/ozt</span>
                <span className="dim">● motor</span>
              </div>
              <div className="lcd mt-2 text-[40px] leading-none tracking-[0.02em]">
                {spotParts.main}
                <span className="text-[16px] opacity-70">{spotParts.fraction}</span>
              </div>
              <div className="mt-3 flex justify-between">
                <span className="dim">
                  canlı{" "}
                  {liveQuote ? `$${formatNumber(Math.round(liveQuote.spotPerOzt))}` : "alınamadı"}
                </span>
                <span className="dim lcd text-[10px]">
                  {liveQuote
                    ? `${liveQuote.spotPerOzt >= config.spotUsdPerOzt ? "+" : "−"}${formatPercent(Math.abs(liveQuote.spotPerOzt / config.spotUsdPerOzt - 1))}`
                    : "—"}
                </span>
              </div>
            </Screen>
          </Bezel>
          <div className="flex items-start justify-between gap-2 px-1">
            {knobs.map((k) => (
              <Knob key={k.label} size="sm" value={k.value} label={k.label} readout={k.readout} />
            ))}
          </div>
          <div className="seg self-start" role="group" aria-label="Etsy yazma durumu">
            <span className={writeAccess.writeEnabled ? "on" : ""}>Yazma</span>
            <span className={!writeAccess.writeEnabled ? "on" : ""}>Salt-okunur</span>
          </div>
          <p className="note">
            <span className="mark">†</span>
            <span>
              Düğmeler motorun kayıtlı ayarını gösterir; değiştirmek için sağdaki &quot;Motor ayarları&quot; formu kullanılır.
              Kota: {quota?.quota_remaining != null ? `${formatNumber(quota.quota_remaining)} / gün` : "ölçülmedi"}.
            </span>
          </p>
        </aside>

        <div className="flex min-w-0 flex-col gap-10">
          <section>
            <div className="sec-h">
              <span className="num">B</span>
              <h2>Spot ve kuru çalıştırma</h2>
            </div>
            <div className="mt-4">
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
            </div>
          </section>

          <section>
            <div className="sec-h">
              <span className="num">C</span>
              <h2>Tek tuş: panel → Etsy</h2>
            </div>
            <div className="mt-4">
              <PanelPushCard writeEnabled={writeAccess.writeEnabled} quota={quota} />
            </div>
          </section>

          <section>
            <div className="sec-h">
              <span className="num">D</span>
              <h2>Altın endeksi</h2>
              <span className="mono-label right">otomatik</span>
            </div>
            <div className="mt-4">
              <GoldIndexCard
                basis={basisHistory[0]?.spot ?? config.spotUsdPerOzt}
                liveSpot={liveQuote?.spotPerOzt ?? null}
                liveSources={(liveQuote?.sources ?? []).map((s) => s.name).join(" + ")}
                liveError={liveError}
                history={basisHistory}
              />
            </div>
          </section>

          <section>
            <div className="sec-h">
              <span className="num">E</span>
              <h2>Motor ayarları</h2>
            </div>
            <div className="mt-4">
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
            </div>
          </section>

          <section>
            <div className="sec-h">
              <span className="num">F</span>
              <h2>Geçmiş koşular</h2>
            </div>
            {gecmis.length === 0 ? (
              <p className="note mt-4">
                <span className="mark">†</span>
                <span>Henüz tamamlanmış bir fiyat koşusu yok.</span>
              </p>
            ) : (
              <ul className="mt-1 text-sm">
                {gecmis.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--rule-2)] py-3"
                  >
                    <span className="text-foreground">
                      {new Date(r.created_at).toLocaleString("tr-TR")} · spot {Number(r.spot_usd_per_ozt)} $/ozt
                    </span>
                    <span className="mono-label">
                      {r.status} · {r.total_rows} satır · {r.updated_rows} yazıldı
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
