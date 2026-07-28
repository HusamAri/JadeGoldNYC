import { NextResponse } from "next/server";

/**
 * DEVRE DIŞI — otomatik yeniden fiyatlama kaldırıldı (2026-07-28).
 *
 * Fiyat artık panelin DIŞINDA belirlenir (EON fiyat motoru xlsx). Panel fiyat
 * ÖNERMEZ, HESAPLAMAZ ve canlı mağazaya YAZMAZ; yalnız gram tablosu + maliyet
 * varsayımlarını salt-okunur içe aktarır. Bu uç eskiden `evaluateRepriceRules()`
 * çağırıp `mode='otomatik'` kurallarda Etsy envanterine PUT atıyordu — yani
 * insan onayı OLMADAN canlı fiyat değiştirebiliyordu.
 *
 * Vercel cron kaydı (`vercel.json`) kaldırıldı; rota da burada sonlandırıldı ki
 * elde kalan bir zamanlayıcı ya da elle çağrı motoru yeniden çalıştıramasın.
 * `reprice_rules` / `reprice_log` tabloları ve `lib/etsy/reprice.ts` PHASE 4
 * temizliğinde silinir (kayıt izi o güne kadar korunur).
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      disabled: true,
      reason:
        "Otomatik yeniden fiyatlama kaldırıldı. Fiyat panel dışında (EON fiyat motoru) belirlenir; panel fiyat hesaplamaz ve Etsy'ye yazmaz.",
    },
    { status: 410 },
  );
}
