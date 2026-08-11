import { NextResponse } from "next/server";

/**
 * DEVRE DIŞI — gözetimsiz altın-endeks fiyat itişi kaldırıldı (2026-08-11).
 *
 * ## Neden
 *
 * Bu uç her gün 04:30 UTC'de `runGoldReprice({ apply: true })` çağırıyordu; o
 * da panel fiyatlarını tazelemekle KALMIYOR, `pushListingPrices()` ile canlı
 * Etsy envanterine fiyat YAZIYORDU (bkz. `lib/pricing/gold-reprice-run.ts`).
 * Yani insan onayı olmadan, her sabah, mağazadaki fiyatlar değişiyordu.
 *
 * Kullanıcı kuralı NET: "Etsy'ye zamanlanmış ya da gözetimsiz yazma ASLA."
 * Audit izi ihlalin canlı olduğunu gösteriyor — 4090 → 4261.20 (08-06) →
 * 4343.30 (08-08) → 4399.90 (08-11, 41 listing işlendi). Fiyat tabanının
 * "hâlâ 4090" sanılmasının sebebi de buydu: taban sessizce yürümüştü.
 *
 * ## Ne kaldı
 *
 * Motor SİLİNMEDİ. `runGoldReprice` iki GÖZETİMLİ yoldan çağrılmaya devam
 * eder ve ikisi de bir insanın tetiklemesini gerektirir:
 *   - `app/api/ops/gold-reprice` (token kapılı ops rotası)
 *   - `/fiyat` sayfasındaki tek-tuş aksiyonu (`fiyat/actions.ts`)
 * Deadband/max-step/spot tazelik kapıları çekirdekte yerinde durur.
 *
 * Vercel cron kaydı `vercel.json`dan kaldırıldı; rota da burada sonlandırıldı
 * ki elde kalan bir zamanlayıcı, eski bir deployment ya da elle çağrı motoru
 * gözetimsiz koşturamasın (aynı desen: `app/api/cron/reprice/route.ts`).
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      reason:
        "Gözetimsiz altın-endeks fiyat itişi kaldırıldı. Bu uç canlı Etsy " +
        "envanterine insan onayı olmadan yazıyordu. Fiyat itişi artık yalnız " +
        "gözetimli yollardan yapılır: /api/ops/gold-reprice (token) veya " +
        "/fiyat sayfasındaki onaylı tek-tuş akışı.",
    },
    { status: 410 },
  );
}
