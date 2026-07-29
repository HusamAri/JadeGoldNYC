import { NextResponse } from "next/server";

import { logAudit } from "@/lib/audit";
import { EtsyClient } from "@/lib/etsy/client";
import { pushListingPrices } from "@/lib/etsy/inventory";
import {
  GRID_V3_FILENAME,
  GRID_V3_SHA256,
  GRID_V3_SPOT_USD,
} from "@/lib/pricing-engine/grid-v3";
import {
  buildPushDiff,
  type PushDiff,
} from "@/lib/pricing-engine/push-diff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * GEÇİCİ gözetimli EON fiyat itişi — telefondan koşum için.
 *
 *   GET  ?token=CRON_SECRET  → otoriter dry-run diff'i (HTML tablo) + PUSH formu
 *   POST ?token=CRON_SECRET  → yalnız formdaki TEK KULLANIMLIK confirm ile yazar
 *
 * Auth iki katman: URL token'ı (CRON_SECRET) VE panelde açık admin/owner
 * oturumu (EON üyeliği). Sabit token koda gömülmez (repair rotası kuralı).
 * Başarılı push sonrası rota kendini kapatır (410) — durum
 * organizations.feature_flags.opsEonPricePush altında yaşar; rota emekliye
 * ayrılırken o anahtar da temizlenir.
 */

const ORG_SLUG = "eon-266055";
const CONFIRM_TTL_MS = 30 * 60 * 1000;

type OpsState = {
  done?: boolean;
  pushedAt?: string;
  confirm?: string | null;
  confirmExp?: number | null;
};

type OrgRow = {
  id: string;
  name: string;
  feature_flags: Record<string, unknown> | null;
};

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function page(title: string, body: string, status = 200): NextResponse {
  return new NextResponse(
    `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;padding:16px;background:#faf7f2;color:#2b2723}
  h1{font-size:1.15rem}h2{font-size:1rem;margin:1.4em 0 .4em}
  table{border-collapse:collapse;width:100%;font-size:.8rem}
  th,td{border-bottom:1px solid #e5ddd2;padding:4px 6px;text-align:left;white-space:nowrap}
  th{position:sticky;top:0;background:#f3ede4}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .cards{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
  .card{background:#fff;border:1px solid #e5ddd2;border-radius:10px;padding:10px 14px;min-width:96px}
  .card b{display:block;font-size:1.2rem}
  details{background:#fff;border:1px solid #e5ddd2;border-radius:10px;margin:8px 0;padding:6px 10px}
  summary{cursor:pointer;font-weight:600;font-size:.85rem;padding:6px 0}
  .tablewrap{overflow-x:auto;max-height:60vh;overflow-y:auto}
  .warn{background:#fdf3e7;border:1px solid #ecd9bb;border-radius:10px;padding:10px 14px;font-size:.85rem}
  .push{display:block;width:100%;margin:18px 0;padding:14px;font-size:1.05rem;font-weight:700;
        color:#fff;background:#8a6d3b;border:0;border-radius:12px}
  .muted{color:#8a8177;font-size:.78rem}
  .up{color:#1d6b3a}.gap{color:#a33}
</style></head><body>${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

function gonePage(state: OpsState): NextResponse {
  return page(
    "EON fiyat itişi — kapalı",
    `<h1>Bu rota kapandı (410)</h1>
     <p>Tek seferlik fiyat itişi ${esc(state.pushedAt ?? "")} tarihinde uygulandı.
     Kayıt: <code>audit_log</code> → <code>etsy.reprice</code>. Rota kod temizliğiyle kaldırılacak.</p>`,
    410,
  );
}

/** Katman 1: URL token'ı === CRON_SECRET (tanımsızsa fail-closed). */
function tokenOk(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  return url.searchParams.get("token") === secret;
}

/** Katman 2: açık panel oturumu + EON'da owner/admin üyelik. */
async function requireAdmin(orgId: string): Promise<
  | { ok: true; userId: string; email: string }
  | { ok: false; res: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      res: page(
        "Oturum gerekli",
        `<h1>Oturum gerekli (401)</h1>
         <p>Bu telefonda önce panele giriş yap, sonra bu linki tekrar aç.</p>`,
        401,
      ),
    };
  }
  const admin = createAdminClient();
  const { data: member } = await admin
    .from("organization_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (member as { role?: string } | null)?.role;
  if (role !== "owner" && role !== "admin") {
    return {
      ok: false,
      res: page(
        "Yetki yok",
        `<h1>Yetki yok (403)</h1><p>EON'da owner/admin üyelik gerekir.</p>`,
        403,
      ),
    };
  }
  return { ok: true, userId: user.id, email: user.email ?? user.id };
}

async function loadOrg(): Promise<OrgRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, name, feature_flags")
    .eq("slug", ORG_SLUG)
    .maybeSingle();
  return (data as OrgRow | null) ?? null;
}

function opsState(org: OrgRow): OpsState {
  return ((org.feature_flags ?? {})["opsEonPricePush"] ?? {}) as OpsState;
}

async function saveOpsState(orgId: string, state: OpsState): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("feature_flags")
    .eq("id", orgId)
    .single();
  const flags = ((data as { feature_flags: Record<string, unknown> | null })
    ?.feature_flags ?? {}) as Record<string, unknown>;
  flags["opsEonPricePush"] = state;
  const { error } = await admin
    .from("organizations")
    .update({ feature_flags: flags })
    .eq("id", orgId);
  if (error) throw new Error(`Durum yazılamadı: ${error.message}`);
}

function diffHtml(diff: PushDiff): string {
  const t = diff.totals;
  const parts: string[] = [];
  parts.push(`<div class="cards">
    <div class="card"><b>${t.variants}</b>varyant</div>
    <div class="card"><b>${t.changed}</b>değişecek</div>
    <div class="card"><b>${t.unchanged}</b>zaten hedefte</div>
    <div class="card"><b>${t.interpolated}</b>yarım-beden (enterp.)</div>
    <div class="card"><b class="${t.gaps ? "gap" : ""}">${t.gaps}</b>GAP (eski fiyat korunur)</div>
  </div>`);

  const gapRows = diff.listings.flatMap((L) => L.rows.filter((r) => r.gap));
  if (gapRows.length > 0) {
    parts.push(`<div class="warn"><b>GAP — bu varyantlara DOKUNULMAZ, canlı fiyat korunur:</b>
      <div class="tablewrap"><table><tr><th>Listing</th><th>SKU</th><th>Eski</th><th>Neden</th></tr>
      ${gapRows
        .map(
          (r) =>
            `<tr><td>${r.listingId}</td><td>${esc(r.sku)}</td><td class="num">${usd(r.oldCents)}</td><td>${r.gap}</td></tr>`,
        )
        .join("")}</table></div></div>`);
  }

  for (const L of diff.listings) {
    const cov = L.rows.filter((r) => r.newCents != null);
    const pcts = cov.map((r) => (r.newCents! - r.oldCents) / r.oldCents);
    const avg = pcts.length
      ? (pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100
      : 0;
    parts.push(`<details><summary>${L.listingId} · ${esc(L.title.slice(0, 60))} — ${
      L.rows.length
    } varyant, ort +%${avg.toFixed(1)}</summary>
    <div class="tablewrap"><table>
      <tr><th>SKU</th><th>Eski</th><th>Yeni</th><th>Δ%</th><th>Not</th></tr>
      ${L.rows
        .map((r) =>
          r.newCents == null
            ? `<tr><td>${esc(r.sku)}</td><td class="num">${usd(r.oldCents)}</td><td class="num gap">—</td><td class="num">—</td><td class="gap">${r.gap}</td></tr>`
            : `<tr><td>${esc(r.sku)}</td><td class="num">${usd(r.oldCents)}</td><td class="num">${usd(
                r.newCents,
              )}</td><td class="num up">+${(((r.newCents - r.oldCents) / r.oldCents) * 100).toFixed(1)}</td><td>${
                r.interpolated ? "yarım-beden" : ""
              }</td></tr>`,
        )
        .join("")}
    </table></div></details>`);
  }
  return parts.join("\n");
}

export async function GET(request: Request) {
  if (!tokenOk(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const org = await loadOrg();
  if (!org) {
    return NextResponse.json({ error: "org yok" }, { status: 500 });
  }
  const auth = await requireAdmin(org.id);
  if (!auth.ok) return auth.res;
  const state = opsState(org);
  if (state.done) return gonePage(state);

  const admin = createAdminClient();
  const diff = await buildPushDiff(admin, org.id);

  // Tek kullanımlık onay: her GET taze token üretir; POST tüketir.
  const confirm = crypto.randomUUID();
  await saveOpsState(org.id, {
    ...state,
    confirm,
    confirmExp: Date.now() + CONFIRM_TTL_MS,
  });

  const url = new URL(request.url);
  const action = `${url.pathname}?token=${encodeURIComponent(url.searchParams.get("token") ?? "")}`;
  return page(
    "EON fiyat itişi — dry-run",
    `<h1>EON fiyat itişi — otoriter dry-run</h1>
     <p class="muted">Grid: ${esc(GRID_V3_FILENAME)} · sha ${GRID_V3_SHA256.slice(0, 12)}… ·
     spot $${GRID_V3_SPOT_USD} · yarım-beden enterpolasyonu AÇIK · ${esc(auth.email)}</p>
     ${diffHtml(diff)}
     <form method="post" action="${esc(action)}"
       onsubmit="return confirm('TEK SEFERLİK: ${diff.totals.changed} varyant fiyatı Etsy\\'ye yazılacak. Emin misin?')">
       <input type="hidden" name="confirm" value="${confirm}">
       <button class="push" type="submit">PUSH — ${diff.totals.changed} varyantı Etsy'ye yaz</button>
     </form>
     <p class="muted">Buton 30 dk geçerli tek kullanımlık onay taşır; sayfa yenilenince yenisi üretilir.
     Yalnız POST yazar; bu sayfa hiçbir şeyi değiştirmedi.</p>`,
  );
}

export async function POST(request: Request) {
  if (!tokenOk(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const org = await loadOrg();
  if (!org) {
    return NextResponse.json({ error: "org yok" }, { status: 500 });
  }
  const auth = await requireAdmin(org.id);
  if (!auth.ok) return auth.res;
  const state = opsState(org);
  if (state.done) return gonePage(state);

  const form = await request.formData().catch(() => null);
  const confirm = String(form?.get("confirm") ?? "");
  const valid =
    confirm.length > 0 &&
    confirm === state.confirm &&
    (state.confirmExp ?? 0) > Date.now();
  // Tek kullanımlık: geçerli olsun olmasın tüket — replay kapansın.
  await saveOpsState(org.id, { ...state, confirm: null, confirmExp: null });
  if (!valid) {
    return page(
      "Onay geçersiz",
      `<h1>Onay geçersiz ya da süresi doldu (409)</h1>
       <p>GET sayfasını yeniden aç; taze PUSH butonuyla tekrar dene. Hiçbir şey yazılmadı.</p>`,
      409,
    );
  }

  const admin = createAdminClient();
  const diff = await buildPushDiff(admin, org.id);
  const client = await EtsyClient.forOrg(org.id);

  const outcomes: {
    listingId: number;
    title: string;
    status: string;
    changed: number;
    detail?: string;
  }[] = [];
  let panelSynced = 0;
  let panelErrors = 0;

  for (const L of diff.listings) {
    if (L.priceBySku.size === 0) {
      outcomes.push({
        listingId: L.listingId,
        title: L.title,
        status: "skipped",
        changed: 0,
        detail: "hedef fiyat yok",
      });
      continue;
    }
    const res = await pushListingPrices(
      client,
      L.listingId,
      L.priceBySku,
      L.propsBySku,
    );
    outcomes.push({ ...res, title: L.title });
    if (res.status === "updated" || res.status === "unchanged") {
      // Vekil durum: panel fiyatı no-op yolda da eşitlenir (bayat vekil kalmasın).
      const entries = [...L.priceBySku.entries()];
      for (let i = 0; i < entries.length; i += 20) {
        const results = await Promise.all(
          entries.slice(i, i + 20).map(([sku, cents]) =>
            admin
              .from("product_variants")
              .update({ price_cents: cents })
              .eq("org_id", org.id)
              .eq("product_id", L.productId)
              .eq("sku", sku),
          ),
        );
        for (const r of results) {
          if (r.error) panelErrors++;
          else panelSynced++;
        }
      }
    }
  }

  const updated = outcomes.filter((o) => o.status === "updated").length;
  const failed = outcomes.filter((o) => o.status === "error");
  const pushedAt = new Date().toISOString();
  const allOk = failed.length === 0;

  await logAudit(admin, {
    orgId: org.id,
    action: "etsy.reprice",
    entityType: "pricing_engine",
    summary:
      `EON tek seferlik fiyat itişi (${GRID_V3_FILENAME}, spot $${GRID_V3_SPOT_USD}): ` +
      `${updated}/${outcomes.length} listing güncellendi, ${diff.totals.changed} varyant hedeflendi, ` +
      `${diff.totals.gaps} GAP korundu, ${failed.length} hata.`,
    diff: {
      gridSha256: GRID_V3_SHA256,
      totals: diff.totals,
      outcomes,
      panelSynced,
      panelErrors,
    },
    source: "route:ops/eon-price-push",
    actorLabel: auth.email,
  });

  // Başarıda rota kapanır (410). Kısmi hata: AÇIK kalır ki kalanlar için
  // taze dry-run + yeniden push yapılabilsin (pushListingPrices idempotent).
  if (allOk) {
    await saveOpsState(org.id, { done: true, pushedAt });
  }

  return page(
    "EON fiyat itişi — sonuç",
    `<h1>${allOk ? "PUSH tamamlandı" : "PUSH kısmen tamamlandı"}</h1>
     <div class="cards">
       <div class="card"><b>${updated}</b>listing güncellendi</div>
       <div class="card"><b>${outcomes.length - updated - failed.length}</b>değişiksiz/atlandı</div>
       <div class="card"><b class="${failed.length ? "gap" : ""}">${failed.length}</b>hata</div>
       <div class="card"><b>${panelSynced}</b>panel varyantı eşitlendi</div>
     </div>
     ${
       failed.length
         ? `<div class="warn"><b>Hatalar (rota AÇIK kaldı — sayfayı yeniden açıp kalanlar için tekrar push edebilirsin):</b>
            <ul>${failed.map((f) => `<li>${f.listingId} ${esc(f.title.slice(0, 40))}: ${esc(f.detail ?? "")}</li>`).join("")}</ul></div>`
         : `<p>Rota kapandı (bundan sonra 410). Kayıt: <code>audit_log</code> → <code>etsy.reprice</code> (${pushedAt}).</p>`
     }
     ${panelErrors ? `<p class="gap">Panel eşitleme hatası: ${panelErrors} varyant — panel senkronu kontrol edilmeli.</p>` : ""}`,
  );
}
