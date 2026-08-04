import { createAdminClient } from "@/lib/supabase/admin";
import { EtsyClient } from "@/lib/etsy/client";
import { etsyPaths } from "@/lib/etsy/endpoints";

/**
 * SİPARİŞ ↔ ÖDEME EŞLEMESİ — ödeme işleme ücretini siparişe bağlayan tek anahtar.
 *
 * Neden gerekli: Etsy ledger'ında `PAYMENT_PROCESSING_FEE` satırının
 * `reference_id`'si receipt değil `shop_payment_id`'dir. Bu bağ kurulmadan o
 * ücret sipariş bazına inemiyor ve panel ücreti EKSİK kaydediyordu — EON'da
 * ölçülen fark %33,6 (panel $91,55, gerçek $137,78), yani net kâr şişkin
 * görünüyordu (bkz. supabase/migrations/0123).
 *
 * `getShopPaymentByReceiptId` ucu Payment nesnesini döndürür; bize yalnız
 * `payment_id` lazım, onu `sales.etsy_payment_id`'ye yazıyoruz. Tutarları
 * ledger'dan okumaya devam ediyoruz — tek doğruluk kaynağı ledger kalsın,
 * aynı rakam iki yerden gelip çelişmesin.
 */

export interface EtsyPayment {
  payment_id: number;
  receipt_id?: number;
  amount_gross?: { amount: number; divisor: number; currency_code: string };
  amount_fees?: { amount: number; divisor: number; currency_code: string };
}

interface PaymentsResponse {
  count?: number;
  results?: EtsyPayment[];
}

/** Tek siparişin ödeme kayıtlarını okur (transactions_r kapsamı). */
export async function getReceiptPayments(
  client: EtsyClient,
  shopId: number,
  receiptId: number,
): Promise<EtsyPayment[]> {
  const res = await client.get<PaymentsResponse>(
    etsyPaths.receiptPayments(shopId, receiptId),
  );
  return res.results ?? [];
}

export interface PaymentSyncResult {
  /** Bu turda ödeme kimliği yazılan sipariş sayısı. */
  matched: number;
  /** Etsy ödeme kaydı döndürmeyen sipariş (ücret "bilinmiyor" kalır). */
  empty: number;
  errors: number;
  /** Bütçe dolduğu için sıraya kalan sipariş var mı. */
  remaining: boolean;
}

/**
 * Ödeme kimliği eksik siparişleri gezip `sales.etsy_payment_id`'yi doldurur.
 *
 * Yalnız EKSİK olanları çeker (idempotent, tekrar koşmak zararsız) ve süre
 * bütçesiyle çalışır: sipariş başına bir GET var, binlerce sipariş tek çağrıya
 * sığmaz. Bütçe dolarsa `remaining: true` döner, sonraki tur kaldığı yerden
 * devam eder — senkronun domino deseniyle aynı mantık.
 *
 * Eşleşme bulunamayan sipariş SESSİZCE geçilmez: `etsy_payment_id` null kalır
 * ve `sales_etsy_fee_coverage` görünümü o siparişi "işleme ücreti bilinmiyor"
 * olarak işaretler. Tahmin ikame edilmez (kullanıcı kısıtı 5).
 */
export async function syncReceiptPayments(
  orgId: string,
  opts: { budgetMs?: number; limit?: number } = {},
): Promise<PaymentSyncResult> {
  const deadline = Date.now() + (opts.budgetMs ?? 45_000);
  const admin = createAdminClient();
  const client = await EtsyClient.forOrg(orgId);
  const shopId = await client.requireShopId();

  const { data, error } = await admin
    .from("sales")
    .select("id, etsy_receipt_id")
    .eq("org_id", orgId)
    .not("etsy_receipt_id", "is", null)
    .is("etsy_payment_id", null)
    .order("etsy_receipt_id", { ascending: false })
    .limit(opts.limit ?? 500);
  if (error) throw new Error(`sales okuma: ${error.message}`);

  const rows = (data ?? []) as { id: string; etsy_receipt_id: number }[];
  const result: PaymentSyncResult = {
    matched: 0,
    empty: 0,
    errors: 0,
    remaining: false,
  };

  for (const [i, s] of rows.entries()) {
    if (Date.now() > deadline) {
      result.remaining = i < rows.length;
      break;
    }
    try {
      const payments = await getReceiptPayments(client, shopId, s.etsy_receipt_id);
      // Etsy bir receipt için birden çok ödeme döndürebilir (kısmi/çoklu
      // yöntem). İlkini alıyoruz: ledger'daki işleme ücreti de o ödeme
      // kimliğine yazılıyor; çoklu ödemede kalan satırlar kapsam görünümünde
      // eksik görünür, uydurulmaz.
      const pid = payments[0]?.payment_id;
      if (pid == null) {
        result.empty++;
        continue;
      }
      const { error: upErr } = await admin
        .from("sales")
        .update({ etsy_payment_id: pid })
        .eq("id", s.id)
        .eq("org_id", orgId);
      if (upErr) throw new Error(upErr.message);
      result.matched++;
    } catch {
      result.errors++;
    }
    // Oran sınırı nezaketi (Etsy ~10 istek/sn).
    await new Promise((r) => setTimeout(r, 120));
  }

  return result;
}
