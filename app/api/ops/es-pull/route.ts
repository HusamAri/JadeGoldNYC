import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { getListingTranslation } from "@/lib/etsy/listing";
import { logAudit } from "@/lib/audit";

export const maxDuration = 300;

/**
 * ES-PULL — Etsy'deki ELLE girilmiş çeviri katmanını panele aynalar.
 *
 * NEDEN: Kullanıcı çevirileri Etsy arayüzünden (Alura üzerinden) elle giriyor;
 * panel çeviri katmanını hiç görmüyor ve mağaza geneli tutarlılık taraması
 * (hitap tú/usted, ölçü birimi biçimi, yasak terimler — docs/second-brain.md
 * İspanyolca dersleri) yapılamıyor. Etsy'nin herkese açık sayfası bot
 * korumalı (403), tek okuma yolu API — o da yalnız canlı app kimliğiyle
 * çalışır, bu yüzden iş bu gözetimli rotada.
 *
 * Yön: SALT OKUMA (Etsy'ye hiçbir yazma yok). Tek mutasyon panel DB'sine
 * upsert: `product_translations` (org_id, product_id, lang) anahtarıyla,
 * status='draft' + source='etsy-manual'. `draft` bilinçli: es-push yalnız
 * `approved` satırları iter — çekilen aynayı yanlışlıkla geri itemez.
 *
 * Güvenlik/akış es-push ile aynı desen:
 *  - Auth: `Authorization: Bearer $CRON_SECRET` VEYA `?token=` (ops_tokens,
 *    purpose='es-pull', SHA-256 CAS — tek kullanımlık, süreli).
 *  - `?org=` org adı (varsayılan "Jade Gold NYC").
 *  - `?langs=es,de,fr` çekilecek diller (varsayılan "es").
 *  - `?probe=1`: tam çekim yerine İLK 5 listing'de Etsy'nin desteklediği tüm
 *    dilleri yoklar — kullanıcının hangi dillerde çeviri girdiğini keşfeder.
 *  - Varsayılan KURU ÇALIŞMA (ilk 5 listing önizleme); tam çekim `?apply=1`.
 *  - Günlük 429'da devre kesilir, kalan listing'ler raporlanır (kota dersi).
 */

const ETSY_DILLER = ["de", "en-GB", "es", "fr", "it", "ja", "nl", "pl", "pt", "ru"];

async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (secret && auth === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data } = await admin
    .from("ops_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("purpose", "es-pull")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

const gunlukKota = (e: unknown) =>
  e instanceof Error && /daily/i.test(e.message) && /limit/i.test(e.message);

type Row = Record<string, unknown>;

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const probe = url.searchParams.get("probe") === "1";
  const orgName = url.searchParams.get("org") ?? "Jade Gold NYC";
  const langs = (url.searchParams.get("langs") ?? "es")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("name", orgName)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: `org yok: ${orgName}` }, { status: 404 });
  const orgId = (org as { id: string }).id;

  const { data: prodData, error: pErr } = await admin
    .from("products")
    .select("id, etsy_listing_id")
    .eq("org_id", orgId)
    .not("etsy_listing_id", "is", null)
    .is("etsy_deleted_at", null)
    .order("etsy_listing_id", { ascending: true });
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  const products = (prodData ?? []) as { id: string; etsy_listing_id: number }[];

  let client: EtsyClient;
  try {
    client = await EtsyClient.forOrg(orgId);
  } catch (e) {
    return NextResponse.json(
      { error: "etsy not connected", detail: String(e) },
      { status: 503 },
    );
  }

  // PROBE: ilk 5 listing × tüm Etsy dilleri — hangi dillerde elle çeviri var?
  if (probe) {
    const bulunan: Row[] = [];
    for (const p of products.slice(0, 5)) {
      for (const lang of ETSY_DILLER) {
        try {
          const t = await getListingTranslation(client, p.etsy_listing_id, lang);
          if (t && (t.title || t.description)) {
            bulunan.push({
              listing: p.etsy_listing_id,
              lang,
              title_kr: (t.title ?? "").length,
              desc_kr: (t.description ?? "").length,
              tags: Array.isArray(t.tags) ? t.tags.length : 0,
            });
          }
        } catch (e) {
          if (gunlukKota(e)) {
            return NextResponse.json({ probe: bulunan, error: "günlük kota doldu" });
          }
          throw e;
        }
      }
    }
    return NextResponse.json({ probe: bulunan, not: "probe yalnız ilk 5 listing" });
  }

  // KURU ÇALIŞMA: ilk 5 listing önizleme; TAM ÇEKİM: apply=1.
  const hedefler = apply ? products : products.slice(0, 5);
  const results: Row[] = [];
  const kalan: number[] = [];
  let cekilen = 0;
  let bos = 0;
  let devreKesildi = false;

  for (const p of hedefler) {
    if (devreKesildi) {
      kalan.push(p.etsy_listing_id);
      continue;
    }
    for (const lang of langs) {
      try {
        const t = await getListingTranslation(client, p.etsy_listing_id, lang);
        if (!t || (!t.title && !t.description)) {
          bos++;
          continue;
        }
        cekilen++;
        if (apply) {
          const { error: uErr } = await admin.from("product_translations").upsert(
            {
              org_id: orgId,
              product_id: p.id,
              lang,
              title: t.title ?? null,
              description: t.description ?? null,
              tags: Array.isArray(t.tags) && t.tags.length > 0 ? t.tags : null,
              status: "draft",
              source: "etsy-manual",
              note: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "org_id,product_id,lang" },
          );
          if (uErr) {
            results.push({ listing: p.etsy_listing_id, lang, error: uErr.message });
            continue;
          }
        }
        results.push({
          listing: p.etsy_listing_id,
          lang,
          title_kr: (t.title ?? "").length,
          desc_kr: (t.description ?? "").length,
          tags: Array.isArray(t.tags) ? t.tags.length : 0,
          durum: apply ? "kaydedildi" : "önizleme",
        });
      } catch (e) {
        if (gunlukKota(e)) {
          devreKesildi = true;
          kalan.push(p.etsy_listing_id);
          break;
        }
        results.push({ listing: p.etsy_listing_id, lang, error: String(e) });
      }
    }
  }

  if (apply) {
    await logAudit(admin, {
      orgId,
      action: "etsy.translation_pull",
      entityType: "shop",
      summary:
        `Etsy çeviri katmanı panele aynalandı (${langs.join(",")}): ` +
        `${cekilen} çeviri kaydedildi · ${bos} listing'de çeviri yok` +
        (devreKesildi ? ` · kota nedeniyle ${kalan.length} listing kaldı` : " · TAMAMLANDI"),
    });
  }

  return NextResponse.json({
    org: orgName,
    langs,
    mod: apply ? "apply" : "dry-run (ilk 5 listing)",
    cekilen,
    ceviri_olmayan: bos,
    kota_nedeniyle_kalan: kalan.length > 0 ? kalan : undefined,
    results,
  });
}
