/**
 * PIN META — istemci-GÜVENLİ saf katman (tip + saf fonksiyon; import yok).
 * "use client" bileşenler BURADAN import eder; lib/db/queries/pins.ts
 * (supabase/server → next/headers zinciri) yalnız RSC/action tarafında kalır
 * ve bu modülü yeniden dışa verir (ads/meta.ts deseni — PR #265 dersi).
 */

/** Ortak pin kütüphanesindeki bir sticker (pin_stickers satırı). Kural
    (kullanıcı kararı): rozetler HERKESE açık; portre pinleri (kind='person')
    kütüphaneye girmez — onlar profil pinidir. */
export interface PinSticker {
  id: string;
  key: string;
  label: string;
  src: string;
  kind: "person" | "badge";
  /** Setin sahibi (tepside grup başlığı) — profil adı yoksa null. */
  ownerName: string | null;
}

/** Bir hedefe iğnelenmiş pin (görsel + kim iğneledi). */
export interface TargetPin {
  id: string;
  target_id: string;
  src: string;
  label: string;
  pinned_by: string | null;
  by_name: string | null;
}

export type PinTargetType = "task" | "sale" | "event" | "audit";

/** Zaman çizelgesi olayının bileşik pin hedef anahtarı — olay satırı türetilmiş
    olduğundan (uuid yok) sunucu ve istemci AYNI kurguyu kullanır. */
export function eventPinTargetId(e: {
  kind: string;
  date: string;
  title: string;
}): string {
  return `${e.kind}|${e.date}|${e.title}`;
}
