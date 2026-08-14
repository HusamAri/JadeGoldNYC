import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import {
  getListing,
  getListingTranslation,
  putListingTranslation,
  updateListingDescription,
  updateListingTags,
  updateListingTitle,
} from "@/lib/etsy/listing";
import { decodeHtmlEntities } from "@/lib/etsy/text";
import { logAudit } from "@/lib/audit";

export const maxDuration = 300;

/**
 * ES-PUSH — listing metin katmanı push'u (gözetimli, tek kullanımlık token).
 *
 * Yol haritası Faz 3+4 (docs/eon/strategy/2026-08-13-eon-iyilestirme-es-yol-
 * haritasi.md): İngilizce başlık/tag revizyonu ile İspanyolca çeviri AYNI
 * listing'e TEK düzenleme geçişinde gider. Kaynak `product_translations`:
 *   lang='en', status='approved' → başlık/tag/description revizyonu (PATCH)
 *   lang='es', status='approved' → çeviri katmanı (translation PUT/POST)
 *
 * Güvenlik/akış, sku-untangle ile aynı desen:
 *  - Auth: `Authorization: Bearer $CRON_SECRET` VEYA `?token=` (ops_tokens,
 *    purpose='es-push', SHA-256 CAS — tek kullanımlık, süreli).
 *  - Varsayılan KURU ÇALIŞMA; gerçek yazma `?apply=1`.
 *  - `?listing=<etsy_listing_id>` canary filtresi: İLK gerçek push tek
 *    listing'de koşulur, Etsy UI'da gözle teyit edilmeden batch yok.
 *  - Her push AYNI TURDA read-back ile doğrulanır; uyuşmazsa satır
 *    'failed' işaretlenir ve NEDEN note alanına yazılır, otomatik retry yok.
 *  - Günlük 429'da devre kesilir, kalan hedefler raporlanır.
 * Hiçbir fiyat alanına dokunulmaz.
 */

const LANG = "es";

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
    .eq("purpose", "es-push")
    .eq("token_hash", hash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return (data ?? []).length > 0;
}

interface TransRow {
  id: string;
  product_id: string;
  lang: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
}

/** Biçim kapısı — ajana değil sayaca güven. Hata listesi boşsa geçer. */
function formatGate(row: TransRow): string[] {
  const errs: string[] = [];
  if (row.title != null) {
    const t = row.title.trim();
    if (t.length === 0) errs.push("başlık boş");
    if (t.length > 140) errs.push(`başlık ${t.length} karakter (>140)`);
  }
  if (row.tags != null && row.tags.length > 0) {
    if (row.tags.length !== 13) errs.push(`${row.tags.length} tag (13 gerekli)`);
    for (const tag of row.tags) {
      if (tag.trim().length === 0) errs.push("boş tag");
      if (tag.length > 20) errs.push(`tag >20 karakter: "${tag}"`);
    }
    const uniq = new Set(row.tags.map((t) => t.toLowerCase().trim()));
    if (uniq.size !== row.tags.length) errs.push("tekrar eden tag");
  }
  // Çeviri satırı (es) başlık + açıklama olmadan push edilemez.
  if (row.lang === LANG && (!row.title || !row.description)) {
    errs.push("es satırında başlık ve açıklama zorunlu");
  }
  // İngilizce satırda açıklama OPSİYONELDİR (çoğu listing yalnız başlık
  // revizyonu alır), ama alan varsa boş olamaz — boş bir description PATCH'i
  // canlı açıklamayı SİLER.
  if (row.lang === "en" && row.description != null && row.description.trim() === "") {
    errs.push("en satırında açıklama boş olamaz (canlı metni silerdi)");
  }
  return errs;
}

// Etsy okumayı kendi biçiminde döndürür: HTML entity'leri (`&amp;`, `&quot;`)
// ve satır sonlarını normalize etmeden karşılaştırmak, doğru yazılmış bir
// alanı "canlıda farklı" diye işaretler — özellikle "SIZE & WIDTH" gibi
// ampersand taşıyan açıklamalarda.
const norm = (s: string) => decodeHtmlEntities(s).replace(/\s+/g, " ").trim();
const tagKey = (tags: string[]) =>
  tags.map((t) => t.toLowerCase().trim()).sort().join("|");

type Row = Record<string, unknown>;

export async function GET(request: Request) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const apply = url.searchParams.get("apply") === "1";
  const onlyListing = url.searchParams.get("listing");

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("name", "EON")
    .maybeSingle();
  if (!org) return NextResponse.json({ error: "EON yok" }, { status: 500 });
  const orgId = (org as { id: string }).id;

  // Onaylı satırlar + ürün bağı. Onaysız (draft/failed) satır kapıdan geçmez.
  const { data: transData, error: tErr } = await admin
    .from("product_translations")
    .select("id, product_id, lang, title, description, tags")
    .eq("org_id", orgId)
    .eq("status", "approved");
  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
  const rows = (transData ?? []) as TransRow[];

  const productIds = [...new Set(rows.map((r) => r.product_id))];
  const { data: prodData } = await admin
    .from("products")
    .select("id, etsy_listing_id, title, status")
    .eq("org_id", orgId)
    .in("id", productIds.length > 0 ? productIds : ["00000000-0000-0000-0000-000000000000"]);
  const products = new Map(
    ((prodData ?? []) as {
      id: string;
      etsy_listing_id: number | null;
      title: string;
      status: string | null;
    }[]).map((p) => [p.id, p]),
  );

  let client: EtsyClient | null = null;
  if (apply || rows.length > 0) {
    try {
      client = await EtsyClient.forOrg(orgId);
    } catch (e) {
      return NextResponse.json(
        { error: "etsy not connected", detail: String(e) },
        { status: 503 },
      );
    }
  }

  // Listing bazında grupla (en + es aynı geçişte).
  const byListing = new Map<number, { productId: string; en?: TransRow; es?: TransRow }>();
  for (const r of rows) {
    const p = products.get(r.product_id);
    if (!p?.etsy_listing_id) continue;
    if (onlyListing && String(p.etsy_listing_id) !== onlyListing) continue;
    const g = byListing.get(p.etsy_listing_id) ?? { productId: r.product_id };
    if (r.lang === "en") g.en = r;
    if (r.lang === LANG) g.es = r;
    byListing.set(p.etsy_listing_id, g);
  }

  const results: Row[] = [];
  const kalan: number[] = [];
  let devreKesildi = false;

  for (const [listingId, g] of byListing) {
    if (devreKesildi) {
      kalan.push(listingId);
      continue;
    }
    const row: Row = { listing: listingId };
    const gateErrs = [
      ...(g.en ? formatGate(g.en) : []),
      ...(g.es ? formatGate(g.es) : []),
    ];
    if (gateErrs.length > 0) {
      row.status = "format-error";
      row.errors = gateErrs;
      results.push(row);
      continue;
    }

    if (!apply) {
      row.status = "would-push";
      row.en = g.en
        ? { title: g.en.title != null, tags: (g.en.tags ?? []).length, description: g.en.description != null }
        : null;
      row.es = g.es ? { title: g.es.title, tags: (g.es.tags ?? []).length } : null;
      results.push(row);
      continue;
    }

    try {
      // 1) İngilizce revizyon (varsa) — alan alan PATCH.
      if (g.en?.title) await updateListingTitle(client!, listingId, g.en.title);
      if (g.en?.tags && g.en.tags.length > 0)
        await updateListingTags(client!, listingId, g.en.tags);
      if (g.en?.description) {
        await updateListingDescription(client!, listingId, g.en.description);
      }

      // 2) İspanyolca çeviri (varsa).
      if (g.es) {
        await putListingTranslation(client!, listingId, LANG, {
          title: g.es.title!,
          description: g.es.description!,
          tags: g.es.tags ?? undefined,
        });
      }

      // 3) READ-BACK — "200 OK teslim sayılmaz".
      const sapmalar: string[] = [];
      if (
        g.en?.title ||
        g.en?.description ||
        (g.en?.tags && g.en.tags.length > 0)
      ) {
        const live = await getListing(client!, listingId);
        if (g.en.title && norm(live.title ?? "") !== norm(g.en.title))
          sapmalar.push("EN başlık canlıda farklı");
        if (g.en.tags && g.en.tags.length > 0) {
          if (!Array.isArray(live.tags)) sapmalar.push("EN tag alanı yanıtta yok");
          else if (tagKey(live.tags) !== tagKey(g.en.tags))
            sapmalar.push("EN tag seti canlıda farklı");
        }
        if (g.en.description) {
          // Açıklama uzun; tam eşitlik yerine normalize edilmiş karşılaştırma
          // (Etsy satır sonlarını ve entity'leri kendi biçimine çevirebilir).
          if (norm(live.description ?? "") !== norm(g.en.description))
            sapmalar.push("EN açıklama canlıda farklı");
        }
      }
      if (g.es) {
        const liveT = await getListingTranslation(client!, listingId, LANG);
        if (!liveT) sapmalar.push("ES çeviri okunamadı (push sonrası 404)");
        else {
          if (norm(liveT.title ?? "") !== norm(g.es.title!))
            sapmalar.push("ES başlık canlıda farklı");
          const beklenen = (g.es.tags ?? []).length;
          const gelen = Array.isArray(liveT.tags) ? liveT.tags.length : 0;
          if (beklenen > 0 && gelen !== beklenen)
            sapmalar.push(`ES tag sayısı ${gelen}/${beklenen} — form biçimi şüpheli`);
        }
      }

      if (sapmalar.length > 0) {
        row.status = "verify-failed";
        row.detail = sapmalar.join(" · ");
        const ids = [g.en?.id, g.es?.id].filter(Boolean) as string[];
        await admin
          .from("product_translations")
          .update({ status: "failed", note: sapmalar.join(" · ") })
          .in("id", ids);
        results.push(row);
        continue;
      }

      // 4) Başarı: satırlar pushed + panel aynası + audit.
      const ids = [g.en?.id, g.es?.id].filter(Boolean) as string[];
      await admin
        .from("product_translations")
        .update({ status: "pushed", pushed_at: new Date().toISOString(), note: null })
        .in("id", ids);
      if (
        g.en?.title ||
        g.en?.description ||
        (g.en?.tags && g.en.tags.length > 0)
      ) {
        const mirror: Record<string, unknown> = {};
        if (g.en.title) mirror.title = g.en.title;
        if (g.en.tags && g.en.tags.length > 0) mirror.tags = g.en.tags;
        // Açıklama aynası ŞART: panelin "Etsy güncel mi" kıyası
        // `products.description`'a bakıyor; yazıp aynayı güncellememek
        // listing'i sonsuza dek "bekliyor" listesinde bırakır.
        if (g.en.description) mirror.description = g.en.description;
        await admin.from("products").update(mirror).eq("id", g.productId);
      }
      await logAudit(admin, {
        orgId,
        action: "etsy.seo_push",
        entityType: "product",
        entityId: g.productId,
        summary:
          `Metin push (ops es-push): listing ${listingId} — ` +
          `${g.en ? "EN revizyon" : ""}${g.en && g.es ? " + " : ""}` +
          `${g.es ? "ES çeviri" : ""}; read-back doğrulandı.`,
        source: "app",
      });
      row.status = "pushed";
      results.push(row);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      row.status = "error";
      row.detail = msg.slice(0, 200);
      results.push(row);
      // Günlük kota: kör denemeye devam etme, kalanları raporla.
      if (/daily/i.test(msg)) devreKesildi = true;
    }
  }

  return NextResponse.json({
    ok: true,
    apply,
    lang: LANG,
    hedef: byListing.size,
    devreKesildi,
    kalan,
    results,
  });
}
