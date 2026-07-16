/**
 * GÖREV STİL KAYNAĞI — ikon seti + isimlendirilmiş renk skalası tek yerden.
 * İkonlar Higgsfield'da tek görselden üretilip public/icons/tasks/<key>.png
 * olarak kesildi; siyah glif oldukları için CSS mask ile skaladaki HER renge
 * boyanabilirler. Renkler mücevher adlarıyla isimlendirilir (skala kurulabilir).
 */

export interface TaskIconDef {
  key: string;
  label: string;
}

/** 30 muhtemel görev tipi — sıra, üretilen 5×6 ikon sayfasındaki hücre sırası. */
export const TASK_ICONS: TaskIconDef[] = [
  { key: "gem", label: "Taş / tasarım" },
  { key: "ring", label: "Yüzük" },
  { key: "necklace", label: "Kolye" },
  { key: "earring", label: "Küpe" },
  { key: "gold-bar", label: "Altın / külçe" },
  { key: "sketch", label: "Eskiz / çizim" },
  { key: "camera", label: "Çekim" },
  { key: "photo", label: "Görsel / retuş" },
  { key: "palette", label: "Renk / stil" },
  { key: "wand", label: "İyileştirme" },
  { key: "price-tag", label: "Fiyatlama" },
  { key: "calculator", label: "Hesap / maliyet" },
  { key: "percent", label: "İndirim / kampanya" },
  { key: "coins", label: "Gelir / ödeme" },
  { key: "chart", label: "Analiz / rapor" },
  { key: "search", label: "Araştırma / SEO" },
  { key: "megaphone", label: "Pazarlama / duyuru" },
  { key: "mail", label: "E-posta / mesaj" },
  { key: "chat", label: "Müşteri iletişimi" },
  { key: "star", label: "Yorum / puan" },
  { key: "box", label: "Paketleme" },
  { key: "truck", label: "Kargo / teslimat" },
  { key: "vault", label: "Stok / depo" },
  { key: "checklist", label: "Kontrol listesi" },
  { key: "calendar", label: "Plan / takvim" },
  { key: "clock", label: "Termin / süre" },
  { key: "sync", label: "Senkron / entegrasyon" },
  { key: "tools", label: "Atölye / tamir" },
  { key: "shield", label: "Politika / güvence" },
  { key: "rocket", label: "Lansman / büyüme" },
];

export interface TaskColorDef {
  key: string;
  /** İsimlendirilmiş renk — skala mücevher taşlarından kurulur. */
  name: string;
  /** Ana mürekkep (açık tema). */
  ink: string;
  /** Koyu temada okunur eş. */
  inkDark: string;
}

export const TASK_COLORS: TaskColorDef[] = [
  { key: "altin", name: "Altın", ink: "oklch(0.66 0.13 85)", inkDark: "oklch(0.82 0.13 90)" },
  { key: "yesim", name: "Yeşim", ink: "oklch(0.60 0.11 165)", inkDark: "oklch(0.78 0.11 165)" },
  { key: "ametist", name: "Ametist", ink: "oklch(0.56 0.19 300)", inkDark: "oklch(0.76 0.14 300)" },
  { key: "safir", name: "Safir", ink: "oklch(0.52 0.17 258)", inkDark: "oklch(0.74 0.13 258)" },
  { key: "yakut", name: "Yakut", ink: "oklch(0.55 0.20 20)", inkDark: "oklch(0.74 0.16 20)" },
  { key: "mercan", name: "Mercan", ink: "oklch(0.68 0.15 40)", inkDark: "oklch(0.80 0.13 40)" },
  { key: "zumrut", name: "Zümrüt", ink: "oklch(0.58 0.14 150)", inkDark: "oklch(0.76 0.13 150)" },
  { key: "gul-kuvarsi", name: "Gül Kuvarsı", ink: "oklch(0.70 0.12 350)", inkDark: "oklch(0.82 0.10 350)" },
  { key: "turkuaz", name: "Turkuaz", ink: "oklch(0.66 0.12 200)", inkDark: "oklch(0.80 0.11 200)" },
  { key: "kehribar", name: "Kehribar", ink: "oklch(0.70 0.15 70)", inkDark: "oklch(0.82 0.13 75)" },
  { key: "inci", name: "İnci", ink: "oklch(0.72 0.03 280)", inkDark: "oklch(0.88 0.02 280)" },
  { key: "obsidyen", name: "Obsidyen", ink: "oklch(0.35 0.02 280)", inkDark: "oklch(0.70 0.02 280)" },
];

export const TASK_ICON_BY_KEY = new Map(TASK_ICONS.map((i) => [i.key, i]));
export const TASK_COLOR_BY_KEY = new Map(TASK_COLORS.map((c) => [c.key, c]));

/** İkonun public yolu — CSS mask olarak kullanılır (renk = skala mürekkebi). */
export function taskIconUrl(key: string): string {
  return `/icons/tasks/${key}.png`;
}
