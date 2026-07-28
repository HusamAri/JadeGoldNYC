/**
 * Fiyat motoru xlsx → `pricing_engine_import`/`pricing_engine_row` aynası.
 *
 * Kullanım (repo kökünden; .env.local'daki service-role anahtarıyla yazar):
 *   npx tsx scripts/import-pricing-engine.ts \
 *     --file docs/eon/pricing/2026-07-28-eon-etsy-giris-grid-spot4090-v2.xlsx \
 *     --org eon-266055 [--dry-run]
 *
 * İlkeler (0120 başlık yorumuyla aynı):
 *  - AYNA elle düzenlenmez; kaynak değişince bu script yeniden koşulur.
 *  - Ayrıştırma + bütünlük `lib/pricing-engine/parse.ts`'te (saf, bağımsız
 *    test edilebilir). Buradaki iş yalnız: xlsx'i oku → doğrula → yaz.
 *  - Altın satırlar (GIRIS-SIRASI!A13) her koşuda yeniden doğrulanır:
 *    10K 5mm US7 motor 580 / liste 775 · 14K 6mm US7 motor 1022 / liste 1365.
 *    Dosyanın kendi beyanıyla uyuşmayan içe aktarım REDDEDİLİR.
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

// Altın satırlar — GIRIS-SIRASI!A13'ün beyanı. Motor USD, Liste USD.
const GOLDEN: {
  karat: Karat;
  widthMm: number;
  sizeUs: number;
  engineUsd: number;
  listUsd: number;
}[] = [
  { karat: "10K", widthMm: 5, sizeUs: 7, engineUsd: 580, listUsd: 775 },
  { karat: "14K", widthMm: 6, sizeUs: 7, engineUsd: 1022, listUsd: 1365 },
];

function asmNumber(ws: ExcelJS.Worksheet, label: string): number {
  for (let r = 1; r <= ws.rowCount; r++) {
    if (String(ws.getCell(r, 1).value ?? "").trim() === label) {
      const v = ws.getCell(r, 2);
      const raw = (v.result ?? v.value) as unknown;
      const n = typeof raw === "string" ? Number(raw.replace(",", ".")) : (raw as number);
      if (typeof n === "number" && Number.isFinite(n)) return n;
      throw new PricingImportError(`ASM '${label}': sayi okunamadi (${String(raw)}).`);
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

function readGrid(ws: ExcelJS.Worksheet): (string | number | null)[][] {
  const rows: (string | number | null)[][] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row: (string | number | null)[] = [];
    for (let c = 1; c <= 10; c++) row.push(cellNumberOrNull(ws.getCell(r, c)));
    rows.push(row);
  }
  return rows;
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
    if (row.engineCents !== g.engineUsd * 100 || row.listCents !== g.listUsd * 100) {
      throw new PricingImportError(
        `Altin satir tutmadi: ${g.karat} ${g.widthMm}mm US${g.sizeUs} — ` +
          `beklenen motor ${g.engineUsd}/liste ${g.listUsd}, okunan ` +
          `${row.engineCents / 100}/${row.listCents / 100}.`,
      );
    }
  }

  console.log(
    `OK: ${snapshot.rows.length} satir dogrulandi ` +
      `(spot $${assumptions.spotUsdPerOzt}, carpan ${assumptions.multiplier}, ` +
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
