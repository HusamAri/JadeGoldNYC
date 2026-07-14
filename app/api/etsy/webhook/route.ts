import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";
import { upsertSalesPage, mapReceiptStatus } from "@/lib/etsy/sync";
import { logAudit } from "@/lib/audit";
import type { EtsyReceipt } from "@/lib/etsy/types";

/**
 * Etsy WEBHOOK alıcısı — sipariş olaylarında (order.paid / order.canceled /
 * order.shipped / order.delivered) Etsy anında POST atar; panel taze receipt'i
 * geri çekip satışı günceller. Günlük cron tam uzlaştırma yapmaya devam eder;
 * webhook yalnız gecikmeyi dakikalardan saniyelere indirir.
 *
 * Kurulum: Etsy Developer Portal → uygulama → "Webhook portal" → endpoint
 * olarak `https://<panel-domain>/api/etsy/webhook` eklenir, 4 sipariş olayı
 * seçilir; portalın verdiği imza anahtarı (whsec_…) Vercel'e
 * `ETSY_WEBHOOK_SECRET` olarak girilir. Anahtar girilene kadar uç inert (503).
 *
 * Güvenlik: her istek HMAC-SHA256 ile doğrulanır (webhook-id.timestamp.body,
 * base64) + 5 dk timestamp penceresi (replay koruması). Payload'a asla
 * güvenilmez: sipariş verisi resource_url'den DEĞİL, id çözülüp Etsy API'den
 * OAuth'lu istemciyle yeniden çekilir.
 */

const TIMESTAMP_TOLERANCE_S = 300;

function verifySignature(
  secret: string,
  id: string,
  timestamp: string,
  body: string,
  signatureHeader: string,
): boolean {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${body}`)
    .digest();
  // Header birden çok (versiyonlu) imza taşıyabilir: "v1,BASE64 v1,BASE64…"
  for (const token of signatureHeader.split(/\s+/)) {
    const sig = token.includes(",") ? token.split(",", 2)[1] : token;
    try {
      const candidate = Buffer.from(sig, "base64");
      if (
        candidate.length === expected.length &&
        timingSafeEqual(candidate, expected)
      )
        return true;
    } catch {
      // bozuk base64 → sıradaki token
    }
  }
  return false;
}

export async function POST(req: Request) {
  const secret = process.env.ETSY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "ETSY_WEBHOOK_SECRET tanımlı değil" },
      { status: 503 },
    );
  }

  const body = await req.text();
  const id = req.headers.get("webhook-id") ?? "";
  const timestamp = req.headers.get("webhook-timestamp") ?? "";
  const signature = req.headers.get("webhook-signature") ?? "";

  const ts = Number(timestamp);
  if (
    !id ||
    !signature ||
    !Number.isFinite(ts) ||
    Math.abs(Date.now() / 1000 - ts) > TIMESTAMP_TOLERANCE_S
  ) {
    return NextResponse.json({ error: "Geçersiz başlıklar" }, { status: 401 });
  }
  if (!verifySignature(secret, id, timestamp, body, signature)) {
    return NextResponse.json({ error: "İmza doğrulanamadı" }, { status: 401 });
  }

  let payload: {
    event_type?: string;
    resource_url?: string;
    shop_id?: number | string;
  };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Geçersiz gövde" }, { status: 400 });
  }

  const shopId = Number(payload.shop_id);
  const receiptId = Number(
    payload.resource_url?.match(/\/receipts\/(\d+)/)?.[1],
  );
  if (!Number.isFinite(shopId) || !Number.isFinite(receiptId)) {
    // Tanımadığımız kaynak şekli — başarıyla yut (retry fırtınası olmasın).
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createAdminClient();
  const { data: conn } = await admin
    .from("etsy_connection")
    .select("org_id")
    .eq("shop_id", shopId)
    .maybeSingle();
  const orgId = (conn as { org_id: string } | null)?.org_id;
  if (!orgId) return NextResponse.json({ ok: true, ignored: true });

  try {
    const client = await EtsyClient.forOrg(orgId);
    const receipt = await client.get<EtsyReceipt>(
      etsyPaths.receipt(shopId, receiptId),
    );
    await upsertSalesPage(admin, orgId, [receipt]);

    await logAudit(admin, {
      orgId,
      action: "etsy.sync",
      entityType: "sales",
      entityId: String(receiptId),
      summary: `Webhook ${payload.event_type ?? "?"}: sipariş #${receiptId} → ${mapReceiptStatus(receipt)}`,
      source: "etsy",
      actorLabel: "Etsy Webhook",
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // 5xx dön ki Etsy exponential backoff ile yeniden denesin (geçici token/
    // API hatasında olay kaybolmasın).
    const message = e instanceof Error ? e.message : "işlenemedi";
    console.error("Etsy webhook işleme hatası:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
