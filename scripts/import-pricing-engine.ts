/**
 * Fiyat motoru xlsx → `pricing_engine_import`/`pricing_engine_row` aynası.
 *
 * Kullanım (repo kökünden; .env.local'daki service-role anahtarıyla yazar):
 *   npx tsx scripts/import-pricing-engine.ts \
 *     --file docs/eon/pricing/2026-07-29-eon-etsy-giris-grid-spot4090-v4.xlsx \
 *     --org eon-266055 [--dry-run]
 *
 * İlkeler (0120 başlık yorumuyla aynı):
 *  - AYNA elle düzenlenmez; kaynak değişince bu script yeniden koşulur.
 *  - Ayrıştırma + bütünlük `lib/pricing-engine/parse.ts`'te (saf, bağımsız
 *    test edilebilir). Buradaki iş yalnız: xlsx'i oku → doğrula → yaz.
 *  - Altın satırlar (GIRIS-SIRASI'nın kendi beyanı) her koşuda yeniden
 *    doğrulanır — v4: 10K 5mm US7 motor 449 / liste 600 · 10K 2mm US7
 *    floor 170 / offsite 205. Uyuşmayan içe aktarım REDDEDİLİR.
 *  - Yazım: başlık + satırlar tek akışta; eski içe aktarımlar SİLİNMEZ
 *    (tarihçe kalır), tüketiciler `pricing_engine_current` görünümünü okur.
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

import {
  parsePricingSnapshot,
  PricingImportError,
  type Karat,
  type PricingAssumptions,
  type RawSheet,
} from "../lib/pricing-engine/parse";

// ── argümanlar ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}
const FILE = arg("file");
const ORG_SLUG = arg("org") ?? "eon-266055";
const DRY = args.includes("--dry-run");

if (!FILE || !existsSync(FILE)) {
  console.error("Kullanim: --file <xlsx yolu> [--org <slug>] [--dry-run]");
  process.exit(1);
}

// .env.local'ı elle yükle (script Next dışında koşar).
function loadEnvLocal() {
  const p = path.join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Altın satırlar — GIRIS-SIRASI'nın kendi beyanı (v4 "Dogrulama" satırı).
// Alanlar opsiyonel: beyan hangi kolonları veriyorsa onlar denetlenir.
const GOLDEN: {
  karat: Karat;
  widthMm: number;
  sizeUs: number;
  engineUsd?: number;
  listUsd?: number;
  floorUsd?: number;
  offsiteFloorUsd?: number;
}[] = [
  { karat: "10K", widthMm: 5, sizeUs: 7, engineUsd: 449, listUsd: 600 },
  { karat: "10K", widthMm: 2, sizeUs: 7, floorUsd: 170, offsiteFloorUsd: 205 },
];

/** İlk bulunan etiketi okur — sürümler arası ad değişikliği için sıralı
 *  alternatif verilir (ör. v4 "Etsy kesinti" ← v2/v3 "Etsy kesinti orani"). */
function asmNumber(ws: ExcelJS.Worksheet, ...labels: string[]): number {
  for (const label of labels) {
    for (let r = 1; r <= ws.rowCount; r++) {
      if (String(ws.getCell(r, 1).value ?? "").trim() === label) {
        const v = ws.getCell(r, 2);
        const raw = (v.result ?? v.value) as unknown;
        const n = typeof raw === "string" ? Number(raw.replace(",", ".")) : (raw as number);
        if (typeof n === "number" && Number.isFinite(n)) return n;
        throw new PricingImportError(`ASM '${label}': sayi okunamadi (${String(raw)}).`);
      }
    }
  }
  throw new PricingImportError(`ASM '${labels.join("' / '")}' satiri bulunamadi.`);
}

function asmText(ws: ExcelJS.Worksheet, label: string): string {
  for (let r = 1; r <= ws.rowCount; r++) {
    if (String(ws.getCell(r, 1).value ?? "").trim() === label) {
      return String(ws.getCell(r, 2).value ?? "").trim();
    }
  }
  return "";
}

function cellNumberOrNull(c: ExcelJS.Cell): number | string | null {
  const raw = (c.result ?? c.value) as unknown;
  if (raw == null) return null;
  if (typeof raw === "number" || typeof raw === "string") return raw;
  // exceljs formül hücresi {formula, result} şeklinde gelebilir.
  if (typeof raw === "object" && "result" in (raw as object)) {
    const r = (raw as { result?: unknown }).result;
    if (typeof r === "number" || typeof r === "string") return r;
  }
  return null;
}

function readGrid(
  ws: ExcelJS.Worksheet,
  cols = 10,
): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row: (string | number | null)[] = [];
    for (let c = 1; c <= cols; c++) row.push(cellNumberOrNull(ws.getCell(r, c)));
    rows.push(row);
  }
  return rows;
}

/**
 * Milgrain sayfaları: v3'te tek "MILGRAIN" sekmesi (başta Karat kolonu,
 * 3 karat × 11 genişlik × 13 beden) — karat bazında bölünüp standart 10-kolon
 * düzenine indirgenir; parse.ts yerleşimden habersiz kalır. v2 geriye-uyum:
 * "MILGRAIN-14K" (yalnız 14K, kolonsuz).
 */
function milgrainSheets(wb: ExcelJS.Workbook): RawSheet[] {
  const v3 = wb.getWorksheet("MILGRAIN");
  if (v3) {
    const byKarat = new Map<Karat, (string | number | null)[][]>();
    for (const raw of readGrid(v3, 11)) {
      if (raw[0] == null) continue;
      const k = String(raw[0]).trim();
      if (k !== "10K" && k !== "14K" && k !== "18K") {
        throw new PricingImportError(`MILGRAIN: taninmayan karat '${k}'.`);
      }
      const arr = byKarat.get(k as Karat) ?? [];
      arr.push(raw.slice(1));
      byKarat.set(k as Karat, arr);
    }
    return [...byKarat.entries()].map(([karat, rows]) => ({
      karat,
      profile: "milgrain" as const,
      rows,
    }));
  }
  const legacy = wb.getWorksheet("MILGRAIN-14K");
  if (!legacy) {
    throw new PricingImportError("MILGRAIN / MILGRAIN-14K sayfasi yok.");
  }
  return [{ karat: "14K", profile: "milgrain", rows: readGrid(legacy) }];
}

async function main() {
  const buf = readFileSync(FILE!);
  const sha256 = createHash("sha256").update(buf).digest("hex");

  const wb = new ExcelJS.Workbook();
  // exceljs kendi Buffer tipini bekliyor; Node 22 Buffer'ı yapısal uyumlu.
  await wb.xlsx.load(buf as unknown as ExcelJS.Buffer);

  const asm = wb.getWorksheet("ASM");
  if (!asm) throw new PricingImportError("ASM sayfasi yok.");
  const need = (n: string) => {
    const ws = wb.getWorksheet(n);
    if (!ws) throw new PricingImportError(`${n} sayfasi yok.`);
    return ws;
  };

  const assumptions: PricingAssumptions = {
    spotUsdPerOzt: asmNumber(asm, "Spot USD/ozt"),
    spotUsdPerGram: asmNumber(asm, "Spot USD/gram"),
    fire: asmNumber(asm, "Fire"),
    laborUsd: asmNumber(asm, "Iscilik USD"),
    laborMilgrainUsd: asmNumber(asm, "Iscilik Milgrain USD"),
    packagingUsd: asmNumber(asm, "Paket USD"),
    shippingUsd: asmNumber(asm, "Kargo USD"),
    multiplier: asmNumber(asm, "Carpan 2-7mm", "Carpan"),
    multiplierWide: asmNumber(asm, "Carpan 8-12mm", "Carpan"),
    etsyFeeRate: asmNumber(asm, "Etsy kesinti", "Etsy kesinti orani"),
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
    ...milgrainSheets(wb),
  ];

  const snapshot = parsePricingSnapshot(assumptions, sheets);

  // Altın satır doğrulaması — dosyanın kendi beyanı (GIRIS-SIRASI!A13).
  for (const g of GOLDEN) {
    const row = snapshot.rows.find(
      (r) =>
        r.karat === g.karat &&
        r.profile === "standard" &&
        r.widthMm === g.widthMm &&
        r.sizeUs === g.sizeUs,
    );
    if (!row) {
      throw new PricingImportError(
        `Altin satir yok: ${g.karat} ${g.widthMm}mm US${g.sizeUs}.`,
      );
    }
    const checks: [string, number | undefined, number][] = [
      ["motor", g.engineUsd, row.engineCents],
      ["liste", g.listUsd, row.listCents],
      ["floor", g.floorUsd, row.floorCents],
      ["offsite", g.offsiteFloorUsd, row.offsiteFloorCents],
    ];
    for (const [label, wantUsd, gotCents] of checks) {
      if (wantUsd != null && gotCents !== wantUsd * 100) {
        throw new PricingImportError(
          `Altin satir tutmadi: ${g.karat} ${g.widthMm}mm US${g.sizeUs} — ` +
            `beklenen ${label} ${wantUsd}, okunan ${gotCents / 100}.`,
        );
      }
    }
  }

  console.log(
    `OK: ${snapshot.rows.length} satir dogrulandi ` +
      `(spot $${assumptions.spotUsdPerOzt}, carpan ${assumptions.multiplier}` +
      `${assumptions.multiplierWide !== assumptions.multiplier ? `/${assumptions.multiplierWide}` : ""}, ` +
      `sha256 ${sha256.slice(0, 12)}…)`,
  );
  const bySheet = new Map<string, number>();
  for (const r of snapshot.rows) {
    const k = `${r.karat}/${r.profile}`;
    bySheet.set(k, (bySheet.get(k) ?? 0) + 1);
  }
  for (const [k, n] of bySheet) console.log(`  ${k}: ${n} satir`);

  if (DRY) {
    console.log("Dry-run — DB'ye yazilmadi.");
    return;
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new PricingImportError(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY yok — yazma icin .env.local gerekli (dogrulama icin --dry-run kullanin).",
    );
  }
  const db = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { data: org, error: orgErr } = await db
    .from("organizations")
    .select("id")
    .eq("slug", ORG_SLUG)
    .single();
  if (orgErr || !org) throw new PricingImportError(`Org bulunamadi: ${ORG_SLUG}`);

  // Aynı dosya zaten en güncel içe aktarımsa yenisini açma (idempotent).
  const { data: last } = await db
    .from("pricing_engine_import")
    .select("id, source_sha256")
    .eq("org_id", org.id)
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last?.source_sha256 === sha256) {
    console.log(`Ayni dosya zaten en guncel ice aktarim (${last.id}) — atlandi.`);
    return;
  }

  const { data: imp, error: impErr } = await db
    .from("pricing_engine_import")
    .insert({
      org_id: org.id,
      source_filename: path.basename(FILE!),
      source_sha256: sha256,
      spot_usd_per_ozt: assumptions.spotUsdPerOzt,
      assumptions,
      row_count: snapshot.rows.length,
    })
    .select("id")
    .single();
  if (impErr || !imp) {
    throw new PricingImportError(`Baslik yazilamadi: ${impErr?.message}`);
  }

  const payload = snapshot.rows.map((r) => ({
    import_id: imp.id,
    org_id: org.id,
    karat: r.karat,
    profile: r.profile,
    width_mm: r.widthMm,
    size_us: r.sizeUs,
    grams: r.grams,
    landed_cents: r.landedCents,
    engine_cents: r.engineCents,
    list_cents: r.listCents,
    sale_cents: r.saleCents,
    floor_cents: r.floorCents,
    offsite_floor_cents: r.offsiteFloorCents,
    kontrol_ok: r.kontrolOk,
  }));
  for (let i = 0; i < payload.length; i += 200) {
    const { error } = await db
      .from("pricing_engine_row")
      .insert(payload.slice(i, i + 200));
    if (error) {
      // Yarım içe aktarım bırakma: başlığı geri al (satırlar cascade siler).
      await db.from("pricing_engine_import").delete().eq("id", imp.id);
      throw new PricingImportError(`Satir yazimi patladi: ${error.message}`);
    }
  }

  // Yazım sonrası sayım teyidi (second-brain: sonda count'la doğrula).
  const { count } = await db
    .from("pricing_engine_row")
    .select("id", { count: "exact", head: true })
    .eq("import_id", imp.id);
  if (count !== snapshot.rows.length) {
    throw new PricingImportError(
      `Sayim tutmadi: beklenen ${snapshot.rows.length}, DB ${count}.`,
    );
  }
  console.log(`Yazildi: import ${imp.id} — ${count} satir.`);
}

main().catch((e) => {
  console.error(
    e instanceof PricingImportError ? `REDDEDILDI: ${e.message}` : e,
  );
  process.exit(1);
});
