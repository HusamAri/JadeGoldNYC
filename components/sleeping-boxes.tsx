import { MoonStar } from "lucide-react";

/**
 * UYUYAN KUTULAR — minimalizm sözleşmesinin görünür ucu.
 *
 * Kural (kullanıcı kararı): günlük kullanımda verisi OLMAYAN ikincil
 * bölüm/kutu sayfada TAM BOY render edilmez — gizlenir; veri gelince
 * kendiliğinden açılır. Kaybolmuş hissi olmasın diye sayfanın SONUNDA bu
 * ince satır, uyuyan bölümlerin adını (ve varsa "nasıl uyanır" ipucunu)
 * listeler. Çekirdek bölümler (ana tablo, KPI'lar, CTA'lı boş-durumlar)
 * bu sisteme GİRMEZ — onlar boşken de yol gösterir.
 *
 * Kullanım (RSC sayfada):
 *   const sleeping: SleepingBox[] = [];
 *   {rows.length > 0 ? <Bölüm/> : sleeping.push({name: "Aylık trend"}) && null}
 *   ... sayfa sonu: <SleepingBoxes items={sleeping} />
 * (push-in-JSX yerine sayfa başında koşullarla doldurmak daha okunur.)
 */

export interface SleepingBox {
  /** Bölümün kullanıcıya görünen adı (idx/başlıktaki haliyle). */
  name: string;
  /** Nasıl uyanır — kısa ipucu (ör. "Etsy senkronu veri getirince"). */
  hint?: string;
}

export function SleepingBoxes({ items }: { items: SleepingBox[] }) {
  if (items.length === 0) return null;
  return (
    <p className="text-muted-foreground/60 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-2 text-center text-xs">
      <MoonStar aria-hidden className="size-3.5 shrink-0 opacity-70" />
      <span className="font-medium">Uyuyan kutular</span>
      <span aria-hidden>·</span>
      {items.map((b, i) => (
        <span key={b.name} title={b.hint}>
          {b.name}
          {b.hint ? <span className="opacity-70"> ({b.hint})</span> : null}
          {i < items.length - 1 && <span aria-hidden> ·</span>}
        </span>
      ))}
      <span className="basis-full text-[11px] opacity-70">
        Veri gelince kendiliğinden açılırlar.
      </span>
    </p>
  );
}
