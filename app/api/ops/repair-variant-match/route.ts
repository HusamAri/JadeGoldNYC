import { NextResponse } from "next/server";
import { Client } from "pg";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getListing, updateListingDescription } from "@/lib/etsy/listing";
import { stripWeightBlocks } from "@/lib/etsy/weights";

export const maxDuration = 300;

/**
 * Prod onarımı (bir kerelik / idempotent):
 * 1) 0107 — competitor_watch.image_url + competitor_variant_match
 * 2) Jade Gold NYC açıklamalarından beden→gram bloklarını sök (DB + Etsy)
 *
 * Auth: Authorization: Bearer $CRON_SECRET
 * Query: ?strip=1 (varsayılan) · ?strip=0 yalnız DDL · ?dry=1 Etsy'ye yazma
 */

const DDL = `
alter table public.competitor_watch
  add column if not exists image_url text;

create table if not exists public.competitor_variant_match (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  our_sku text not null,
  competitor_listing_id bigint not null,
  competitor_product_id bigint,
  competitor_label text,
  competitor_size text,
  competitor_karat text,
  price_cents integer,
  currency text not null default 'USD',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, product_id, our_sku, competitor_listing_id)
);

create index if not exists competitor_variant_match_product_idx
  on public.competitor_variant_match (org_id, product_id);

alter table public.competitor_variant_match enable row level security;

do $$ begin
  create policy "competitor_variant_match_all" on public.competitor_variant_match
    for all to authenticated
    using (org_id = public.current_org_id())
    with check (org_id = public.current_org_id());
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
`;

function hasWeightBlock(description: string | null): boolean {
  const d = description ?? "";
  return (
    /Weight by size \([^)]*\):/.test(d) ||
    d.includes("<!-- JG-WEIGHTS -->") ||
    d.includes("Weights are approximate and may vary slightly per piece.")
  );
}

/** Acil onarım — tek kullanımlık token YALNIZ ortam değişkeninden. Kod içine
 *  sabit token gömülmez (repo public; gömülü sabit = herkese açık tetikleme).
 *  REPAIR_ONE_SHOT_TOKEN tanımsızsa bu yol KAPALI (fail-closed) — yalnız
 *  CRON_SECRET Bearer ile çalışır. */
const ONE_SHOT = process.env.REPAIR_ONE_SHOT_TOKEN;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const url = new URL(request.url);
  const oneShot = url.searchParams.get("token");
  const authorized =
    (secret && auth === `Bearer ${secret}`) ||
    (ONE_SHOT != null && ONE_SHOT.length > 0 && oneShot === ONE_SHOT);
  if (!authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const strip = url.searchParams.get("strip") !== "0";
  const dryRun = url.searchParams.get("dry") === "1";
  const pushEtsy = url.searchParams.get("etsy") !== "0";

  const raw =
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!raw) {
    return NextResponse.json(
      { error: "POSTGRES_URL(_NON_POOLING) missing" },
      { status: 503 },
    );
  }
  // Vercel/Supabase zincirinde self-signed CA; pg varsayılanı reddeder.
  const connectionString = raw.includes("sslmode=")
    ? raw.replace(/sslmode=[^&]+/i, "sslmode=no-verify")
    : `${raw}${raw.includes("?") ? "&" : "?"}sslmode=no-verify`;

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  let ddlOk = false;
  let tableExistsBefore: string | null = null;
  try {
    await client.connect();
    const before = await client.query<{ r: string | null }>(
      "select to_regclass('public.competitor_variant_match')::text as r",
    );
    tableExistsBefore = before.rows[0]?.r ?? null;
    await client.query(DDL);
    ddlOk = true;
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        step: "ddl",
        tableExistsBefore,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  } finally {
    await client.end().catch(() => undefined);
  }

  if (!strip) {
    return NextResponse.json({
      ok: true,
      ddlOk,
      tableExistsBefore,
      stripped: 0,
      dryRun,
    });
  }

  const admin = createAdminClient();
  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", "jade-gold-nyc")
    .maybeSingle();
  if (orgErr || !org) {
    return NextResponse.json(
      {
        ok: false,
        ddlOk,
        error: orgErr?.message ?? "jade-gold-nyc org not found",
      },
      { status: 500 },
    );
  }

  const { data: products, error: prodErr } = await admin
    .from("products")
    .select("id, etsy_listing_id, title, sku, description")
    .eq("org_id", org.id)
    .is("archived_at", null);
  if (prodErr) {
    return NextResponse.json(
      { ok: false, ddlOk, error: prodErr.message },
      { status: 500 },
    );
  }

  const polluted = (products ?? []).filter((p) =>
    hasWeightBlock(p.description as string | null),
  );

  let updatedDb = 0;
  let updatedEtsy = 0;
  let unchanged = 0;
  let errors = 0;
  const samples: { sku: string | null; title: string | null; beforeTail: string; afterTail: string }[] = [];

  let etsy: EtsyClient | null = null;
  if (pushEtsy && !dryRun) {
    try {
      etsy = await EtsyClient.forOrg(org.id);
    } catch {
      etsy = null;
    }
  }

  for (const p of polluted) {
    const fresh = (p.description as string) ?? "";
    const next = stripWeightBlocks(fresh);
    if (next === fresh) {
      unchanged++;
      continue;
    }
    if (samples.length < 5) {
      samples.push({
        sku: p.sku as string | null,
        title: p.title as string | null,
        beforeTail: fresh.slice(-180),
        afterTail: next.slice(-180),
      });
    }
    if (dryRun) {
      updatedDb++;
      continue;
    }
    try {
      if (etsy && p.etsy_listing_id != null) {
        // Etsy'den taze oku — yerel kopya bayatsa çift blok kalmasın.
        try {
          const detail = await getListing(etsy, Number(p.etsy_listing_id));
          const etsyDesc = detail.description ?? fresh;
          const etsyNext = stripWeightBlocks(etsyDesc);
          if (etsyNext !== etsyDesc) {
            await updateListingDescription(
              etsy,
              Number(p.etsy_listing_id),
              etsyNext,
            );
            updatedEtsy++;
            await admin
              .from("products")
              .update({ description: etsyNext })
              .eq("id", p.id)
              .eq("org_id", org.id);
            updatedDb++;
            continue;
          }
        } catch {
          // Etsy başarısızsa en azından DB'yi temizle
        }
      }
      await admin
        .from("products")
        .update({ description: next })
        .eq("id", p.id)
        .eq("org_id", org.id);
      updatedDb++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    ok: errors === 0,
    ddlOk,
    tableExistsBefore,
    org: { id: org.id, slug: org.slug },
    polluted: polluted.length,
    updatedDb,
    updatedEtsy,
    unchanged,
    errors,
    dryRun,
    pushEtsy: Boolean(etsy),
    samples,
  });
}
