/**
 * Görev planı yayma motoru — SAF fonksiyon (I/O yok, bağımsız test edilebilir).
 *
 * Sorun: görev üreten akışlar (toplu ekleme, tamamlama-günü damgası, seed'ler)
 * terminleri tek güne yığar — zaman çizelgesinde "her şey bugün" görünür ve
 * plan anlamını yitirir. (Vaka: 32 görev aynı güne damgalanmıştı.)
 *
 * Kurallar (workload-balancing pratiği: günlük tavan + ileriye dağıt):
 *  - Yalnız AÇIK görevler (status != done) planlanır; tamamlananların tarihi
 *    bitiş günü kaydıdır, DOKUNULMAZ.
 *  - Günde en çok `maxPerDay` (varsayılan 5) açık görev.
 *  - Bugünden İLERİYE yayılır; geçmişe asla yazılmaz.
 *  - Öncelik sırası: P0 → P1 → P2 → P3; eşitlikte eski termin önce, tarihsiz sona.
 *  - İleri tarihli günler tavanı aşıyorsa taşan (önceliği düşük) görevler bir
 *    sonraki boş güne itilir; tavana uyan ileri tarihli görev YERİNDE KALIR
 *    (kullanıcının elle verdiği makul termin korunur).
 */

export interface SchedulableTask {
  id: string;
  status: string;
  priority: string;
  due_date: string | null;
}

export interface SpreadChange {
  id: string;
  from: string | null;
  to: string;
}

const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

/** ISO gün + n gün (saf takvim aritmetiği — TZ'siz, gün-anahtarı korunur). */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function byPriorityThenDue(a: SchedulableTask, b: SchedulableTask): number {
  const p =
    (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
  if (p !== 0) return p;
  // Eski termin önce; tarihsizler en sona (yeni işe en esnek olan onlar).
  if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
  if (a.due_date) return -1;
  if (b.due_date) return 1;
  return 0;
}

/**
 * Yayma planını hesaplar; HİÇBİR yan etkisi yoktur, yalnız değişiklik listesi
 * döner (uygulama server action'da). Deterministiktir: aynı girdi → aynı plan.
 */
export function planSpread(
  tasks: SchedulableTask[],
  today: string,
  maxPerDay = 5,
): SpreadChange[] {
  const open = tasks.filter((t) => t.status !== "done");

  // 1) İleri tarihli açık görevler: gün başına tavana kadar YERİNDE kalır;
  //    taşanlar (öncelik sırasına göre en düşükler) yeniden planlanır.
  const future = open.filter((t) => t.due_date && t.due_date > today);
  const byDay = new Map<string, SchedulableTask[]>();
  for (const t of future) {
    const arr = byDay.get(t.due_date as string) ?? [];
    arr.push(t);
    byDay.set(t.due_date as string, arr);
  }
  const capacity = new Map<string, number>(); // gün → kalan boşluk
  const toReplan: SchedulableTask[] = [];
  for (const [day, arr] of byDay) {
    arr.sort(byPriorityThenDue);
    const keep = arr.slice(0, maxPerDay);
    capacity.set(day, maxPerDay - keep.length);
    toReplan.push(...arr.slice(maxPerDay));
  }

  // 2) Yeniden planlanacaklar: gecikmiş + bugünkü + tarihsiz + taşanlar.
  //    (Bugüne damgalılar da dahil — "her şey bugün" yığılması tam da bu.)
  toReplan.push(
    ...open.filter((t) => !t.due_date || (t.due_date as string) <= today),
  );
  toReplan.sort(byPriorityThenDue);

  // 3) Her görev EN ERKEN gününden ileriye ilk boş güne yerleşir. İleri
  //    tarihli taşanlar KENDİ terminlerinden önceye ÇEKİLMEZ (kullanıcının
  //    bilerek verdiği ileri tarih öne alınmaz — yalnız ileri itilir);
  //    gecikmiş/bugünkü/tarihsizler bugünden başlar.
  const changes: SpreadChange[] = [];
  for (const t of toReplan) {
    let day =
      t.due_date && (t.due_date as string) > today
        ? (t.due_date as string)
        : today;
    let guard = 0;
    while ((capacity.get(day) ?? maxPerDay) <= 0 && guard++ < 3650) {
      day = addDays(day, 1);
    }
    capacity.set(day, (capacity.get(day) ?? maxPerDay) - 1);
    if (t.due_date !== day) changes.push({ id: t.id, from: t.due_date, to: day });
  }
  return changes;
}
