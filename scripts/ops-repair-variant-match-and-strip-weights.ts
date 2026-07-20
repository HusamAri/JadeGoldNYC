/**
 * Prod onarımı (yerel): 0107/0111 DDL + Jade açıklamalarından gram bloklarını sök.
 *
 * Kullanım:
 *   # .env.production.local içinde SUPABASE_* + POSTGRES_URL_NON_POOLING
 *   npx tsx scripts/ops-repair-variant-match-and-strip-weights.ts
 *   npx tsx scripts/ops-repair-variant-match-and-strip-weights.ts --dry
 *   npx tsx scripts/ops-repair-variant-match-and-strip-weights.ts --ddl-only
 *   npx tsx scripts/ops-repair-variant-match-and-strip-weights.ts --no-etsy
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";

import { stripWeightBlocks } from "../lib/etsy/weights";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const key = m[1]!;
    let val = m[2]!;
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.production.local"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

const dry = process.argv.includes("--dry");
const ddlOnly = process.argv.includes("--ddl-only");
const noEtsy = process.argv.includes("--no-etsy");

const DDL = readFileSync(
  resolve(process.cwd(), "supabase/migrations/0111_competitor_variant_match.sql"),
  "utf8",
);

function hasWeightBlock(description: string | null): boolean {
  const d = description ?? "";
  return (
    /Weight by size \([^)]*\):/.test(d) ||
    d.includes("<!-- JG-WEIGHTS -->") ||
    d.includes("Weights are approximate and may vary slightly per piece.")
  );
}

async function main() {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL_NON_POOLING veya POSTGRES_URL gerekli (.env.production.local).",
    );
  }

  const pg = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await pg.connect();
  try {
    const before = await pg.query<{ r: string | null }>(
      "select to_regclass('public.competitor_variant_match')::text as r",
    );
    console.log("table before:", before.rows[0]?.r ?? null);
    await pg.query(DDL);
    const after = await pg.query<{ r: string | null }>(
      "select to_regclass('public.competitor_variant_match')::text as r",
    );
    console.log("table after:", after.rows[0]?.r ?? null);
  } finally {
    await pg.end();
  }

  if (ddlOnly) {
    console.log("DDL-only — strip atlandı.");
    return;
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY gerekli.");
  }
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", "jade-gold-nyc")
    .maybeSingle();
  if (orgErr || !org) throw new Error(orgErr?.message ?? "jade-gold-nyc yok");

  const { data: products, error: prodErr } = await admin
    .from("products")
    .select("id, etsy_listing_id, title, sku, description")
    .eq("org_id", org.id)
    .is("archived_at", null);
  if (prodErr) throw new Error(prodErr.message);

  const polluted = (products ?? []).filter((p) =>
    hasWeightBlock(p.description as string | null),
  );
  console.log(
    `Jade listings: ${products?.length ?? 0} · gram bloğu olan: ${polluted.length} · dry=${dry} noEtsy=${noEtsy}`,
  );

  let updated = 0;
  for (const p of polluted) {
    const next = stripWeightBlocks((p.description as string) ?? "");
    if (next === p.description) continue;
    console.log(
      `· ${p.sku ?? p.id}  ${((p.description as string) ?? "").length} → ${next.length} chars`,
    );
    if (dry) {
      updated++;
      continue;
    }
    const { error } = await admin
      .from("products")
      .update({ description: next })
      .eq("id", p.id)
      .eq("org_id", org.id);
    if (error) {
      console.error("DB update fail", p.sku, error.message);
      continue;
    }
    updated++;
  }
  console.log(`Done. updated=${updated}`);
  if (!noEtsy && !dry) {
    console.log(
      "Not: Etsy push bu scriptte yok — panel /api/ops/repair-variant-match?etsy=1 veya stripAllWeightBlocks kullan.",
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
