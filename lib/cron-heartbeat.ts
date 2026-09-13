import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * CRON NABZI — zamanlanmış işin koşup koşmadığını ÖLÇER.
 *
 * Vaka (2026-09-12): `/api/cron/etsy-sync` 2026-08-12'den beri tetiklenmedi ve
 * bir ay kimse görmedi. Sebep kodun bozuk olması değildi — rota sağlamdı,
 * canlıda 401 dönüyordu, vercel.json kaydı yerindeydi. Sebep, "koştu mu?"
 * sorusunun ÖLÇÜLMÜYOR olmasıydı. İki ayrı kusur birlikte çalışıyordu:
 *
 *   1. Rotalar org başına hatayı yutup her koşuda `{ ok: true }` dönüyordu →
 *      koşup patlasa bile Vercel yeşil görürdü.
 *   2. Hiç koşmadığında da geriye hiçbir iz kalmıyordu → "iş yoktu" ile
 *      "iş çalışmadı" birbirinden ayırt edilemiyordu.
 *
 * Bu modül ikisini birden kapatır: her koşu — BAŞARISIZ OLSA DA — `cron_run`'a
 * bir satır bırakır ve başarısızlık çağırana geri verilir, böylece rota 5xx
 * dönebilir.
 */

/** Cron kimliği = vercel.json'daki yol. Rota adı değil: kayıt ile zamanlayıcı
 *  kaydının aynı dizeyi paylaşması, vercel.json değiştiğinde farkı görünür
 *  kılar (uyarı merkezi bu dizeyi arar). */
export type CronJobPath =
  | "/api/cron/etsy-sync"
  | "/api/cron/etsy-variants"
  | "/api/cron/shipstation-sync";

/**
 * AUTH KAPISINDA ÖLEN CRON'U KAYDET — nabzın ilk sürümündeki kör nokta.
 *
 * Vaka (2026-09-13): nabız kuruldu, ertesi sabah tablo yine boştu ve "cron hiç
 * tetiklenmiyor" diye okundu. Yanlıştı. Vercel runtime log'u tek satırla gerçeği
 * söyledi: `GET /api/cron/etsy-variants 401` — cron TETİKLENİYORDU, rota onu
 * kapıda geri çeviriyordu (`CRON_SECRET` uyuşmazlığı). Nabız `recordCronRun`
 * içinde, auth kontrolünden SONRA yazıldığı için bu durum hiç iz bırakmıyordu:
 * "hiç koşmadı" ile "koştu ve 401 yedi" ölçümde AYNI görünüyordu — oysa ikisinin
 * aksiyonu tamamen farklı (biri Vercel'de cron kaydı, diğeri ortam değişkeni).
 *
 * Güvenlik: bu uç kimlik doğrulamasız çağrılabildiği için her 401'i yazmak
 * tabloyu şişirmeye açık bir kapı olurdu. İki sınır var:
 *   1. yalnız Vercel'in cron çağrılarında bulunan `x-vercel-cron-schedule`
 *      başlığı varsa yazılır (Vercel cron-jobs dokümanında tanımlı),
 *   2. iş başına saatte EN FAZLA bir satır (aynı arıza günde bir kez anlatılır).
 * Başlık taklit edilebilir ama (2) yazımı sınırladığı için etkisi yok.
 */
export async function recordCronAuthFailure(
  admin: SupabaseClient,
  job: CronJobPath,
  headers: Headers,
): Promise<void> {
  const schedule = headers.get("x-vercel-cron-schedule");
  // Zamanlayıcıdan gelmeyen istek (rastgele tarama) iz bırakmaz.
  if (!schedule) return;

  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { data: recent, error: readErr } = await admin
    .from("cron_run")
    .select("id")
    .eq("job", job)
    .gte("started_at", oneHourAgo)
    .limit(1);
  if (readErr) {
    console.error(`[cron ${job}] nabız okunamadı:`, readErr.message);
    return;
  }
  if ((recent ?? []).length > 0) return;

  const now = new Date().toISOString();
  const reason =
    "zamanlayıcı tetikledi ama rota 401 döndü — CRON_SECRET ortam değişkeni " +
    "eksik ya da Vercel'in gönderdiğiyle uyuşmuyor";
  const { error } = await admin.from("cron_run").insert({
    job,
    started_at: now,
    finished_at: now,
    ok: false,
    target_count: 0,
    detail: { reason, authFailure: true, schedule },
  });
  if (error) console.error(`[cron ${job}] 401 nabzı yazılamadı:`, error.message);
  console.error(`[cron ${job}] BAŞARISIZ — ${reason}`);
}

export interface CronRunOutcome {
  /** İşlenen hedef (org) sayısı. */
  targetCount: number;
  /** Hedef başına sonuç; hatalar dahil ham haliyle saklanır. */
  results: Record<string, unknown>;
  /** Hata alan hedeflerin kimlikleri — boş değilse koşu BAŞARISIZ sayılır. */
  failed: string[];
}

export interface CronRunReport extends CronRunOutcome {
  ok: boolean;
  /** İnsan okur açıklama: neden başarısız sayıldı. */
  reason: string | null;
}

/**
 * PAYLAŞIMLI SÜRE BÜTÇESİ — org başına sabit bütçe, çok org'da fonksiyonu öldürür.
 *
 * Vaka (2026-09-13): rotalar her org için `advanceEtsySync(org, 50_000)` çağırıyordu
 * ama `maxDuration` fonksiyonun TAMAMI için 60 sn. Üç bağlı org varken ilk org tek
 * başına 50 sn yiyebiliyor, ikincisi başlıyor ve Vercel 60. saniyede işi 504 ile
 * öldürüyor — üçüncü org'a hiç sıra gelmiyor. Sıra sabit olduğu için de hep AYNI
 * org aç kalır (burada Ophir).
 *
 * İki kural birlikte çözer:
 *   1. bütçe org başına değil KOŞU başına verilir ve kalan süre paylaştırılır,
 *   2. sıra en BAYAT org'dan başlar (`last_sync_at` artan) — böylece aç kalan org
 *      bir sonraki koşuda başa geçer, kalıcı açlık imkânsız olur.
 */
export function createBudget(totalMs: number) {
  const deadline = Date.now() + totalMs;
  return {
    /** Kalan süre (ms); asla negatif dönmez. */
    remainingMs: () => Math.max(0, deadline - Date.now()),
    /** Yeni bir hedefe başlamak anlamlı mı? Kırıntı süreyle iş başlatma. */
    hasRoomFor: (minMs: number) => deadline - Date.now() >= minMs,
  };
}

/**
 * `fn`'i koşturur, sonucu `cron_run`'a yazar ve koşunun BAŞARILI SAYILIP
 * SAYILMADIĞINA karar verir.
 *
 * Başarısızlık sayılan iki durum var ve ikincisi kolayca gözden kaçar:
 *
 *   - bir hedef hata aldı (`failed` dolu),
 *   - HİÇBİR hedef işlenmedi (`targetCount === 0`). Sıfır hedef sessiz bir
 *     kusurdur: bağlantı sorgusu patladıysa ya da org listesi boş döndüyse iş
 *     "sorunsuz" görünür ama hiçbir şey senkronlanmaz. Reponun kendi dersi:
 *     "'eşleşme yok' ile 'iş yok' ayrı sonuçlardır; bir araç ikisini aynı `ok`
 *     altında raporluyorsa o araç sessiz yanlış üretir."
 *
 * Nabız yazımı işin KENDİSİNİ bozamaz: `cron_run` yazılamazsa (ör. 0149 henüz
 * uygulanmadı) hata loglanır ve koşunun sonucu olduğu gibi döner.
 */
export async function recordCronRun(
  admin: SupabaseClient,
  job: CronJobPath,
  fn: () => Promise<CronRunOutcome>,
): Promise<CronRunReport> {
  const startedAt = new Date().toISOString();

  // BAŞLANGIÇ satırı — koşu bitmeden yazılır ve `finished_at` NULL bırakılır.
  //
  // Neden (vaka 2026-09-13, aynı kör noktanın ÜÇÜNCÜ tekrarı): nabzın ilk iki
  // sürümü de satırı yalnız işin SONUNDA yazıyordu. `CRON_SECRET` düzelip
  // senkron gerçekten koşunca fonksiyon 60 sn'lik Vercel limitine takıldı ve
  // 504 ile ÖLDÜRÜLDÜ — yani `await fn()` hiç dönmedi, insert satırına sıra
  // gelmedi ve tablo yine bomboş kaldı. "Hiç tetiklenmedi" ile "tetiklendi ve
  // yarıda kesildi" bir kez daha aynı görünüyordu. Sona yazan bir ölçüm,
  // kendi ölümünü kaydedemez.
  //
  // `finished_at IS NULL` + eski `started_at` = koşu başladı, bitmedi.
  const { data: startRow, error: startErr } = await admin
    .from("cron_run")
    .insert({ job, started_at: startedAt, finished_at: null, ok: null })
    .select("id")
    .maybeSingle();
  if (startErr) console.error(`[cron ${job}] başlangıç nabzı yazılamadı:`, startErr.message);
  const runId = (startRow as { id: string } | null)?.id ?? null;

  let outcome: CronRunOutcome;
  let thrown: unknown = null;
  try {
    outcome = await fn();
  } catch (e) {
    thrown = e;
    outcome = { targetCount: 0, results: {}, failed: ["*"] };
  }

  const reason = thrown
    ? `koşu istisna ile düştü: ${thrown instanceof Error ? thrown.message : "bilinmeyen hata"}`
    : outcome.failed.length > 0
      ? `${outcome.failed.length} hedef hata aldı: ${outcome.failed.join(", ")}`
      : outcome.targetCount === 0
        ? "hiçbir hedef işlenmedi — bağlı org bulunamadı ya da sorgu düştü"
        : null;
  const ok = reason === null;

  const finish = {
    finished_at: new Date().toISOString(),
    ok,
    target_count: outcome.targetCount,
    detail: { results: outcome.results, reason },
  };
  // Başlangıç satırı yazılabildiyse onu KAPAT; yazılamadıysa tam satırı ekle
  // (nabız hiç kaybolmasın).
  const { error } = runId
    ? await admin.from("cron_run").update(finish).eq("id", runId)
    : await admin
        .from("cron_run")
        .insert({ job, started_at: startedAt, ...finish });
  // Nabız yazılamadıysa iş yine de raporlanır; yalnız ölçüm kaybolur.
  if (error) console.error(`[cron ${job}] nabız yazılamadı:`, error.message);

  if (!ok) console.error(`[cron ${job}] BAŞARISIZ — ${reason}`);

  return { ...outcome, ok, reason };
}
