/**
 * EON TEK SEFERLİK gözetimli fiyat itişi — 2026-07-28 grid (spot 4090, v2).
 *
 * Bu script panel yazı-yolu DEĞİLDİR (externalPricing AÇIK kalır); onaylı tek
 * push sonrası EMEKLİYE AYRILIR (repo'dan silinir, rapor docs/eon/pricing/
 * altında kalır).
 *
 * Akış:
 *   1) Grid'i xlsx'ten oku (ETSY LISTE = karat/profil/genişlik/beden → cent).
 *   2) Panel varyantlarını (org EON, canlı Etsy listing'leri) SKU'dan çöz.
 *   3) Dry-run diff yaz (varsayılan): listing · varyant · eski · yeni · GAP.
 *   4) --push (açık onay sonrası): listing başına envanter PUT
 *      (lib/etsy/inventory.pushListingPrices — 2025 sözleşmesi + fiyat-sıfır
 *      korumaları), panel varyant fiyatını eşitle, audit_log'a kaydet.
 *
 * Kullanım:
 *   npx tsx scripts/eon-price-push-oneshot.ts --file docs/eon/pricing/2026-07-28-eon-etsy-giris-grid-spot4090-v3.xlsx
 *   npx tsx scripts/eon-price-push-oneshot.ts --file ... --interpolate-half   # yarım bedenleri komşu ortalamasıyla doldur
 *   npx tsx scripts/eon-price-push-oneshot.ts --file ... --interpolate-half --push
 *
 * GAP politikası (varsayılan): yeni fiyatı olmayan varyant ATLANIR — Etsy'de
 * canlı fiyatı korunur (buildPriceSyncUpdate haritada olmayan SKU'da canlı
 * fiyatı geri yazar). Yarım bedenler --interpolate-half olmadan GAP'tır ve
 * fiyat merdivenini KIRAR (bkz. dry-run raporu) — push öncesi karar şart.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

import { logAudit } from "../lib/audit";
import { EtsyClient } from "../lib/etsy/client";
import { pushListingPrices } from "../lib/etsy/inventory";
import {
  PricingImportError,
  parsePricingSnapshot,
  type Karat,
  type PricingAssumptions,
  type PricingProfile,
  type RawSheet,
} from "../lib/pricing-engine/parse";

const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}
const FILE =
  arg("file") ??
  "docs/eon/pricing/2026-07-28-eon-etsy-giris-grid-spot4090-v3.xlsx";
const ORG_SLUG = arg("org") ?? "eon-266055";
const PUSH = args.includes("--push");
const INTERPOLATE_HALF = args.includes("--interpolate-half");

if (!existsSync(FILE)) {
  console.error(`Dosya yok: ${FILE}`);
  process.exit(1);
}

// .env.local'ı elle yükle (script Next dışında koşar).
(function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
})();

// ---------------------------------------------------------------------------
// 1) Grid yükleme (import-pricing-engine.ts ile aynı okuma; script emekliye
//    ayrılacağı için bilinçli olarak kendi kopyasını taşır)
// ---------------------------------------------------------------------------

function asmNumber(ws: ExcelJS.Worksheet, label: string): number {
  for (let r = 1; r <= ws.rowCount; r++) {
    if (String(ws.getCell(r, 1).value ?? "").trim() === label) {
      const v = ws.getCell(r, 2);
      const raw = (v.result ?? v.value) as unknown;
      const n =
        typeof raw === "string" ? Number(raw.replace(",", ".")) : (raw as number);
      if (typeof n === "number" && Number.isFinite(n)) return n;
      throw new PricingImportError(`ASM '${label}': sayi okunamadi.`);
    }
  }
  throw new PricingImportError(`ASM '${label}' satiri bulunamadi.`);
}

function asmText(ws: ExcelJS.Worksheet, label: string): string {
  for (let r = 1; r <= ws.rowCount; r++) {
    if (String(ws.getCell(r, 1).value ?? "").trim() === label) {
      return String(ws.getCell(r, 2).value ?? "").trim();
    }
  }
  return "";
}

function readGrid(ws: ExcelJS.Worksheet): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row: (string | number | null)[] = [];
    for (let c = 1; c <= 10; c++) {
      const cell = ws.getCell(r, c);
      const raw = (cell.result ?? cell.value) as unknown;
      if (raw == null) row.push(null);
      else if (typeof raw === "number" || typeof raw === "string") row.push(raw);
      else if (typeof raw === "object" && "result" in (raw as object)) {
        const rr = (raw as { result?: unknown }).result;
        row.push(typeof rr === "number" || typeof rr === "string" ? rr : null);
      } else row.push(null);
    }
    rows.push(row);
  }
  return rows;
}

type CellKey = `${Karat}|${PricingProfile}|${number}|${number}`;
const cellKey = (
  k: Karat,
  p: PricingProfile,
  w: number,
  s: number,
): CellKey => `${k}|${p}|${w}|${s}`;

// ---------------------------------------------------------------------------
// 2) SKU çözümleme — v3 SKU: <RENK>-R-<KARAT+TİP>-<GENİŞLİK>MM-<BEDEN>
// ---------------------------------------------------------------------------

const SKU_RE = /^(GLD|WHG|RSG)-R-(10|14|18)(0[1-5])-(\d+)MM-(\d+(?:\.5)?)$/;
function parseSku(sku: string): {
  karat: Karat;
  profile: PricingProfile;
  widthMm: number;
  sizeUs: number;
} | null {
  const m = SKU_RE.exec(sku);
  if (!m) return null;
  return {
    karat: `${m[2]}K` as Karat,
    profile: m[3] === "04" ? "milgrain" : "standard",
    widthMm: Number(m[4]),
    sizeUs: Number(m[5]),
  };
}

type DiffRow = {
  listingId: number;
  listingTitle: string;
  sku: string;
  oldCents: number | null;
  newCents: number | null;
  gap: "" | "yarim-beden" | "milgrain-kapsam-disi" | "sku-cozulmedi";
  interpolated: boolean;
};

async function main() {
  const buf = readFileSync(FILE);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as unknown as ExcelJS.Buffer);
  const need = (n: string) => {
    const ws = wb.getWorksheet(n);
    if (!ws) throw new PricingImportError(`${n} sayfasi yok.`);
    return ws;
  };
  const asm = need("ASM");
  const assumptions: PricingAssumptions = {
    spotUsdPerOzt: asmNumber(asm, "Spot USD/ozt"),
    spotUsdPerGram: asmNumber(asm, "Spot USD/gram"),
    fire: asmNumber(asm, "Fire"),
    laborUsd: asmNumber(asm, "Iscilik USD"),
    laborMilgrainUsd: asmNumber(asm, "Iscilik Milgrain USD"),
    packagingUsd: asmNumber(asm, "Paket USD"),
    shippingUsd: asmNumber(asm, "Kargo USD"),
    multiplier: asmNumber(asm, "Carpan"),
    etsyFeeRate: asmNumber(asm, "Etsy kesinti orani"),
    offsiteRate: asmNumber(asm, "Offsite Ads"),
    purity: {
      "10K": asmNumber(asm, "Saflik 10K"),
      "14K": asmNumber(asm, "Saflik 14K"),
      "18K": asmNumber(asm, "Saflik 18K"),
    },
    thickness: asmText(asm, "Kalinlik"),
  };
  const sheets: RawSheet[] = [
    { karat: "10K", profile: "standard", rows: readGrid(need("10K")) },
    { karat: "14K", profile: "standard", rows: readGrid(need("14K")) },
    { karat: "18K", profile: "standard", rows: readGrid(need("18K")) },
    { karat: "14K", profile: "milgrain", rows: readGrid(need("MILGRAIN-14K")) },
  ];
  const snapshot = parsePricingSnapshot(assumptions, sheets);

  // ETSY LISTE haritası + yarım beden enterpolasyonu (isteğe bağlı).
  const listByCell = new Map<CellKey, number>();
  for (const r of snapshot.rows) {
    listByCell.set(cellKey(r.karat, r.profile, r.widthMm, r.sizeUs), r.listCents);
  }
  const interpolatedCells = new Set<CellKey>();
  if (INTERPOLATE_HALF) {
    for (const r of snapshot.rows) {
      const hi = listByCell.get(
        cellKey(r.karat, r.profile, r.widthMm, r.sizeUs + 1),
      );
      if (hi == null) continue;
      const half = r.sizeUs + 0.5;
      const key = cellKey(r.karat, r.profile, r.widthMm, half);
      if (listByCell.has(key)) continue;
      // Komşu tam bedenlerin orta noktası, grid ruhuyla $5'e YUKARI yuvarlanır.
      const mid = Math.ceil((r.listCents + hi) / 2 / 500) * 500;
      listByCell.set(key, mid);
      interpolatedCells.add(key);
    }
  }
  console.log(
    `Grid: ${snapshot.rows.length} hücre (spot $${assumptions.spotUsdPerOzt}, ` +
      `sha ${sha256.slice(0, 12)}…)` +
      (INTERPOLATE_HALF ? ` + ${interpolatedCells.size} yarım-beden enterpolasyonu` : ""),
  );

  // ---------------------------------------------------------------------
  // Panel varyantları
  // ---------------------------------------------------------------------
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY yok (.env.local).",
    );
  }
  const db = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
  const { data: org, error: orgErr } = await db
    .from("organizations")
    .select("id, name")
    .eq("slug", ORG_SLUG)
    .single();
  if (orgErr || !org) throw new Error(`Org bulunamadi: ${ORG_SLUG}`);

  const { data: products, error: prodErr } = await db
    .from("products")
    .select("id, title, etsy_listing_id, etsy_deleted_at")
    .eq("org_id", org.id)
    .not("etsy_listing_id", "is", null)
    .is("etsy_deleted_at", null)
    .order("title");
  if (prodErr) throw new Error(prodErr.message);
  const live = (products ?? []) as {
    id: string;
    title: string;
    etsy_listing_id: number;
  }[];
  console.log(`Canlı Etsy listing: ${live.length}`);

  const diffs: DiffRow[] = [];
  const perListing = new Map<
    number,
    { title: string; priceBySku: Map<string, number>; props: Map<string, { name: string; value: string }[]> }
  >();

  for (const p of live) {
    const { data: variants, error: vErr } = await db
      .from("product_variants")
      .select("sku, price_cents, properties, active")
      .eq("product_id", p.id)
      .eq("active", true);
    if (vErr) throw new Error(`${p.title}: ${vErr.message}`);
    const priceBySku = new Map<string, number>();
    const props = new Map<string, { name: string; value: string }[]>();
    for (const v of (variants ?? []) as {
      sku: string;
      price_cents: number;
      properties: Record<string, string> | null;
    }[]) {
      const parsed = parseSku(v.sku);
      if (!parsed) {
        diffs.push({
          listingId: p.etsy_listing_id,
          listingTitle: p.title,
          sku: v.sku,
          oldCents: v.price_cents,
          newCents: null,
          gap: "sku-cozulmedi",
          interpolated: false,
        });
        continue;
      }
      const key = cellKey(parsed.karat, parsed.profile, parsed.widthMm, parsed.sizeUs);
      const target = listByCell.get(key);
      if (target == null) {
        diffs.push({
          listingId: p.etsy_listing_id,
          listingTitle: p.title,
          sku: v.sku,
          oldCents: v.price_cents,
          newCents: null,
          gap:
            parsed.sizeUs !== Math.floor(parsed.sizeUs)
              ? "yarim-beden"
              : "milgrain-kapsam-disi",
          interpolated: false,
        });
        continue;
      }
      diffs.push({
        listingId: p.etsy_listing_id,
        listingTitle: p.title,
        sku: v.sku,
        oldCents: v.price_cents,
        newCents: target,
        gap: "",
        interpolated: interpolatedCells.has(key),
      });
      priceBySku.set(v.sku, target);
      props.set(
        v.sku,
        Object.entries(v.properties ?? {}).map(([name, value]) => ({
          name,
          value: String(value),
        })),
      );
    }
    perListing.set(p.etsy_listing_id, { title: p.title, priceBySku, props });
  }

  // ---------------------------------------------------------------------
  // 3) Dry-run raporu
  // ---------------------------------------------------------------------
  const covered = diffs.filter((d) => d.newCents != null);
  const changed = covered.filter((d) => d.newCents !== d.oldCents);
  const gaps = diffs.filter((d) => d.gap !== "");
  const pct = (d: DiffRow) =>
    d.oldCents && d.newCents ? ((d.newCents - d.oldCents) / d.oldCents) * 100 : 0;

  const today = new Date().toISOString().slice(0, 10);
  const reportPath = `docs/eon/pricing/push-dry-run-${today}.md`;
  const L: string[] = [];
  L.push(`# EON fiyat itişi — dry-run ${today}`);
  L.push("");
  L.push(
    `Kaynak: \`${path.basename(FILE)}\` (sha256 \`${sha256.slice(0, 16)}…\`, ` +
      `spot $${assumptions.spotUsdPerOzt}, çarpan ${assumptions.multiplier})`,
  );
  L.push("");
  L.push(
    `Varyant: **${diffs.length}** · yeni fiyatı olan: **${covered.length}** · ` +
      `değişen: **${changed.length}** · GAP: **${gaps.length}**` +
      (INTERPOLATE_HALF
        ? ` · enterpolasyonlu hücre: ${interpolatedCells.size}`
        : " · yarım-beden enterpolasyonu KAPALI"),
  );
  L.push("");
  L.push("## Listing özeti");
  L.push("");
  L.push("| Listing | Başlık | Varyant | Değişen | GAP | Δ% min | Δ% ort | Δ% max |");
  L.push("|---|---|---|---|---|---|---|---|");
  for (const [lid, info] of perListing) {
    const rows = diffs.filter((d) => d.listingId === lid);
    const cov = rows.filter((d) => d.newCents != null);
    const ds = cov.map(pct);
    const avg = ds.length ? ds.reduce((a, b) => a + b, 0) / ds.length : 0;
    L.push(
      `| ${lid} | ${info.title.slice(0, 48)} | ${rows.length} | ` +
        `${cov.filter((d) => d.newCents !== d.oldCents).length} | ` +
        `${rows.length - cov.length} | ` +
        (ds.length
          ? `${Math.min(...ds).toFixed(1)} | ${avg.toFixed(1)} | ${Math.max(...ds).toFixed(1)} |`
          : `— | — | — |`),
    );
  }
  L.push("");
  L.push("## GAP dökümü");
  L.push("");
  for (const kind of ["yarim-beden", "milgrain-kapsam-disi", "sku-cozulmedi"] as const) {
    const g = gaps.filter((d) => d.gap === kind);
    if (g.length === 0) continue;
    L.push(`- **${kind}**: ${g.length} varyant (örnek: ${g.slice(0, 3).map((d) => d.sku).join(", ")})`);
  }
  L.push("");
  L.push("## Tam diff (varyant düzeyi)");
  L.push("");
  L.push("| Listing | SKU | Eski | Yeni | Δ% | Not |");
  L.push("|---|---|---|---|---|---|");
  for (const d of diffs) {
    L.push(
      `| ${d.listingId} | ${d.sku} | ${d.oldCents != null ? (d.oldCents / 100).toFixed(2) : "—"} | ` +
        `${d.newCents != null ? (d.newCents / 100).toFixed(2) : "—"} | ` +
        `${d.newCents != null ? pct(d).toFixed(1) : "—"} | ` +
        `${d.gap || (d.interpolated ? "enterpolasyon" : "")} |`,
    );
  }
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, L.join("\n") + "\n");
  console.log(`\nDry-run raporu: ${reportPath}`);
  console.log(
    `Varyant ${diffs.length} · kapsanan ${covered.length} · değişen ${changed.length} · GAP ${gaps.length}`,
  );

  if (!PUSH) {
    console.log(
      "\nDURDU — onay bekliyor. Uygulamak için: --push (yarım bedenler için önce --interpolate-half kararı verin).",
    );
    return;
  }

  // ---------------------------------------------------------------------
  // 4) PUSH — listing başına envanter PUT + panel eşitleme + audit
  // ---------------------------------------------------------------------
  console.log("\nPUSH başlıyor…");
  const client = await EtsyClient.forOrg(org.id);
  const outcomes: { listingId: number; status: string; changed: number; detail?: string }[] = [];
  for (const [lid, info] of perListing) {
    if (info.priceBySku.size === 0) {
      outcomes.push({ listingId: lid, status: "skipped", changed: 0, detail: "hedef fiyat yok" });
      continue;
    }
    const res = await pushListingPrices(client, lid, info.priceBySku, info.props);
    outcomes.push(res);
    console.log(
      `  ${lid} ${info.title.slice(0, 40)} → ${res.status} (${res.changed} offering)` +
        (res.detail ? ` — ${res.detail}` : ""),
    );
    if (res.status === "updated" || res.status === "unchanged") {
      // Vekil durum: panel fiyatı da eşitlenir (no-op yolda da — bayat vekil kalmasın).
      for (const [sku, cents] of info.priceBySku) {
        const { error: upErr } = await db
          .from("product_variants")
          .update({ price_cents: cents })
          .eq("sku", sku)
          .eq("org_id", org.id);
        if (upErr) console.error(`  panel eşitleme hatası ${sku}: ${upErr.message}`);
      }
    }
  }
  const ok = outcomes.filter((o) => o.status === "updated").length;
  const failed = outcomes.filter((o) => o.status === "error");
  await logAudit(db, {
    orgId: org.id,
    action: "etsy.reprice",
    entityType: "pricing_engine",
    summary:
      `EON tek seferlik fiyat itişi (${path.basename(FILE)}, spot $${assumptions.spotUsdPerOzt}): ` +
      `${ok}/${outcomes.length} listing güncellendi, ${changed.length} varyant, ${gaps.length} GAP atlandı.`,
    diff: { sha256, outcomes, gapCount: gaps.length, interpolateHalf: INTERPOLATE_HALF },
    source: "script:eon-price-push-oneshot",
    actorLabel: "eon-price-push-oneshot",
  });
  console.log(
    `\nBİTTİ: ${ok} güncellendi, ${outcomes.length - ok - failed.length} değişiksiz/atlandı, ${failed.length} hata.`,
  );
  if (failed.length) {
    for (const f of failed) console.error(`  HATA ${f.listingId}: ${f.detail}`);
    process.exitCode = 1;
  } else {
    console.log("Script artık emekli — repo'dan silinebilir (rapor docs/eon/pricing/ altında).");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
