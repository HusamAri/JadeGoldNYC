import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { CountUpMoney, CountUpText } from "@/components/kpi-value";

/** Hem Lucide hem markaya özel Lux ikonlarını kabul eden ikon tipi. */
type IconType = ComponentType<SVGProps<SVGSVGElement>>;

function formatChange(change: number): string {
  const pct = Math.abs(change * 100);
  const arrow = change >= 0 ? "↑" : "↓";
  return `${arrow} %${pct.toFixed(1)}`;
}

/**
 * Tek karşılaştırma satırı — "geçen döneme göre" / "geçen yıla göre" gibi.
 * `change` null ise karşılaştırma penceresi VAR ama verisi yok demektir;
 * satır gizlenmez, "veri yok" ibaresi gösterilir (veri kısıtı görünür kalır).
 */
export interface KpiComparison {
  /** -1..1 arası yüzde değişim (marj gibi oranlarda puan farkı). */
  change: number | null;
  /** Karşılaştırma dönemi etiketi (ör. "Geçen ay", "Geçen yıl aynı dönem"). */
  label: string;
}

/** Etikete göre deterministik küçük hash (SSR-güvenli; Math.random yok). */
function hashLabel(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Kutu ikonunun konumu — YALNIZ sağ köşeler (sol-üstteki metinle çakışmaz);
    karta clip'lenir → komşu kutulara taşmaz, kenarda kesilir (cam altında). */
const ICON_SPOTS = [
  { bottom: "-14%", right: "-8%" },
  { top: "-15%", right: "-7%" },
  { bottom: "-10%", right: "-12%" },
  { top: "-12%", right: "-11%" },
] as const;

// NOT: Bu bir SUNUCU bileşenidir — `icon` prop'u bir React bileşeni (LucideIcon)
// olduğundan client bileşenine dönüştürülemez. Hover/süzülme hareketi CSS ile
// yapılır. prefers-reduced-motion'da global kural animasyonu durdurur.
export function KpiCard({
  label,
  value,
  cents,
  currency = "USD",
  icon: Icon,
  hint,
  accent = "default",
  change,
  changeLabel,
  comparisons,
  className,
  splitTone = false,
  holo = false,
}: {
  label: string;
  /** Metin değer. Para için `cents` verin — kuruş küçük/aşağı kayar (estetik). */
  value?: string;
  /** Para tutarı (cent). Verilirse `value` yerine <Money> ile gösterilir. */
  cents?: number | null;
  currency?: string;
  icon?: IconType;
  hint?: string;
  accent?: "default" | "positive" | "negative";
  /** -1..1 arası yüzde değişim. null = gösterme. */
  change?: number | null;
  changeLabel?: string;
  /**
   * Çoklu karşılaştırma rozetleri (MoM + YoY). `change`/`changeLabel`
   * ikilisinin çok pencereli hâli; ikisi birlikte verilirse önce bu çizilir.
   */
  comparisons?: KpiComparison[];
  className?: string;
  /**
   * Panelin TEK bir hero/öne çıkan KPI'ı için: iki tonlu büyük rakam
   * (üstte nötr, altta sıcak antik altın — bkz. IMG_5669). Tüm KPI
   * kartlarında değil, yalnız en kritik metrikte kullanın.
   */
  splitTone?: boolean;
  /**
   * Görünüm başına TEK kahraman KPI için iridesan holografik rakam
   * (.holo-text — sistemin tek kroma patlaması). Net Kâr gibi en kritik
   * metrikte kullanın; accent renginin yerine geçer.
   */
  holo?: boolean;
}) {
  // Para modu: cents verilirse <Money> ile göster (kuruş küçük/aşağı); punto
  // ölçeği için biçimlenmiş metnin uzunluğunu kullan.
  const isMoney = cents != null;
  const displayString = isMoney ? formatMoney(cents, currency) : (value ?? "");
  const valueLen = displayString.length;

  // DERİNLİK (A5) — yalnız görünümün KAHRAMAN KPI'ında. `holo`/`splitTone`
  // zaten "görünüm başına tek kart" sözleşmesini taşıyor, o yüzden derinlik
  // de onlara bağlanır: 10 kartın hepsinde ayrışma olsaydı hiyerarşi
  // kaybolurdu (ve eşzamanlı hasar bölgesi süperadditif olurdu).
  //
  // NEDEN SADECE `jg-depth-fore` (kart EĞİLMİYOR, filigran ikon OYNAMIYOR):
  //  · Kartın kendisi rotateX/rotateY ile eğilemez — cam plaka
  //    backdrop-filter taşır, eğilen backdrop her karede yeniden rasterize
  //    olur (bu panelde FPS'i 4'e düşüren mekanizmanın ta kendisi).
  //  · Filigran ikon AÇIK temada cam plakanın ALTINDA (z-0). Bütçe md.4
  //    ALTIN KURAL: backdrop-filter yüzeyinin altındaki katman anime
  //    EDİLEMEZ. Bu yüzden ikona `jg-depth-back` verilmedi.
  //  · İçerik katmanı camın ÜSTÜNDE (z-2) → orada transform serbest.
  //    Sabit duran filigran + camın üstünde 2px öne gelen içerik zaten
  //    paralaks üretir: cam gerçek kalınlık kazanır, okuma sırası netleşir.
  //  · `jg-depth-scene` (perspective + contain:paint) BİLEREK kullanılmadı:
  //    (a) katman ayrışması saf translate/scale, perspektif gerektirmiyor;
  //    (b) contain:paint bir "backdrop root" kurar → cam plaka artık
  //    arkadaki holo ambiyansı örnekleyemez, kart düzleşirdi.
  const heroDepth = holo || splitTone;

  // Her kutu FARKLI süzülür: etiketten türeyen deterministik faz/yön/süre.
  // PERF: süzülme yalnız HOVER'da — 10 ikonun camın altında sürekli kıpırdaması
  // 10 backdrop'un her karede yeniden örneklenmesi demekti (eşzamanlılık
  // ölçümünde ana kalemlerden). Idle'da ikon sabit → cam bir kez blur'lanır.
  const h = hashLabel(label);
  const spot = ICON_SPOTS[h % ICON_SPOTS.length];
  const iconStyle: React.CSSProperties = {
    ...spot,
    // animasyon adı hover'da CSS'ten atanır (globals: .kpi-icon)
    animationDuration: `${64 + (h % 5) * 7}s`,
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDirection: h % 2 === 0 ? "normal" : "reverse",
    animationDelay: `-${h % 40}s`,
  };

  return (
    // Kutu: şeffaf kap (arka plandaki süzülen holo görünür). İçinde 3 katman:
    //  1) anlamlı kalın solid ikon — camın ALTINDA, kenardan taşar (bir kısmı
    //     cam altında buzlanır, bir kısmı dışında açık kalır); çok yavaş süzülür.
    //  2) cam yüzey — açıkta Spatial .stat camı, koyuda lume hücre;
    //     backdrop-filter ikonu ve arkadaki holo'yu buzlar.
    //  3) içerik (etiket + dev puntolu rakam) — camın üstünde.
    <div
      className={cn(
        "sheen-sweep relative flex h-full min-w-0 flex-col overflow-hidden rounded-[18px] px-6 py-6 transition-transform duration-300 ease-[var(--ease-premium)] hover:-translate-y-0.5 dark:rounded-[26px]",
        // `group`: kart-içi katman ayrışmasının tetikleyicisi (.jg-depth-fore
        // hem .jg-depth-scene:hover hem .group:hover ile açılır).
        // YAN ETKİ (bilinçli): globals'taki `.group:hover > .glass-liquid::before`
        // caustic ışık gezintisi de bu tek kartta artık ÇALIŞIR (şimdiye kadar
        // hiçbir kartta `group` olmadığı için ölü kuraldı ve caustic yalnız
        // padding halkasına gelindiğinde tetikleniyordu — tutarsızdı). Hover
        // kapılı, transform-only, 5.5s, görünüm başına 1 kart.
        heroDepth && "group",
        className,
      )}
    >
      {Icon && (
        <Icon
          aria-hidden
          // Açıkta camın ALTINDA (z-0, buzlanır); koyuda panel OPAK olduğundan
          // camın üstünde çok soluk oyma filigran olarak durur (dark:z-[2],
          // içerik DOM'da sonra geldiği için üstte kalır). Ham Lucide geçse
          // bile gri klipart'a düşmesin diye varsayılan mürekkep soluk mor.
          className="kpi-icon pointer-events-none absolute z-0 size-[8.5rem] object-contain text-[oklch(0.68_0.15_286)] opacity-[0.88] dark:z-[2] dark:text-[oklch(0.83_0.07_290)] dark:opacity-[0.14]"
          style={iconStyle}
        />
      )}
      {/* cam yüzey — açıkta Spatial .stat kutusu (cam + 1px beyaz kenar +
          glass-hi), koyuda OPAK lume hücre (Liquid_Dark .cell birebir:
          #262935 panel + 0.05 beyaz kenar + 0 20px 50px gölge + üst iç
          highlight; saydamlık/backdrop-blur yok). */}
      <div
        aria-hidden
        className="glass-liquid absolute inset-0 z-[1] rounded-[18px] border border-[color:var(--glass-border)] [backdrop-filter:var(--glass-filter)] [background-color:var(--glass)] [box-shadow:var(--lift),var(--glass-highlight)] dark:rounded-[26px] dark:border-[color:oklch(1_0_0/0.05)] dark:[backdrop-filter:none] dark:[background-color:var(--lume-panel)] dark:[box-shadow:0_20px_50px_oklch(0_0_0/0.4),inset_0_1px_0_oklch(1_0_0/0.06)]"
      />
      {/* Kahraman KPI: açılışta TEK SEFERLİK altın ışık süpürmesi — panelin
          "değerli metal" imzası. Hover sheen'inden bağımsız gerçek bir span
          (::after hover-sheen'e ayrılmış durumda); reduced-motion'da hiç
          çizilmez (opacity 0'da başlar, animasyon koşmayınca görünmez). */}
      {heroDepth && <span aria-hidden className="jg-gold-sheen" />}
      <div
        className={cn(
          "relative z-[2] flex h-full items-start justify-between gap-3",
          heroDepth && "jg-depth-fore",
        )}
      >
        <div className="flex min-w-0 flex-col">
          {/* Etiket — editorial .idx dili: mono, uppercase, geniş tracking. */}
          <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem] font-mono text-[11px] leading-[1.5] tracking-[0.16em] uppercase">
            {label}
          </p>
          {/* Değer — font-index readout: açıkta Spatial mürekkebi,
              koyuda lume beyazı + 0 0 14px beyaz ışıma. */}
          <p
            title={displayString || undefined}
            className={cn(
              // Mobil dar kolonlarda değer ASLA elipslenmesin: truncate yerine
              // kademeli punto — rakam her zaman tam okunur.
              "font-mono font-semibold tracking-tight break-normal tabular-nums",
              // Uzun finansal değerler ('$2.913.363,72' gibi) dar 5'li grid
              // kartında da tek satırda tam okunur: uzunluğa göre punto düşer.
              splitTone
                ? "text-3xl min-[420px]:text-4xl leading-tight jg-split-tone"
                : cn(
                    valueLen > 13
                      ? "text-base min-[420px]:text-lg"
                      : valueLen > 10
                        ? "text-lg min-[420px]:text-xl"
                        : "text-xl min-[420px]:text-2xl",
                    "leading-tight",
                    // Holo kahraman: iridesan degrade rakam — accent/ışıma yok.
                    holo
                      ? "holo-text"
                      : "dark:[text-shadow:0_0_14px_rgba(255,255,255,.5)]",
                  ),
              !splitTone &&
                !holo &&
                accent === "default" &&
                "text-foreground dark:text-white",
              !splitTone &&
                !holo &&
                accent === "positive" &&
                "text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]",
              !splitTone &&
                !holo &&
                accent === "negative" &&
                "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]",
            )}
          >
            {/* Sayaç animasyonu: rakam yüklenişte 0'dan değerine sayar
                (client alt-bileşen; SSR nihai değeri basar, reduced-motion'da
                animasyon hiç koşmaz). */}
            {isMoney ? (
              <CountUpMoney cents={cents} currency={currency} />
            ) : (
              <CountUpText value={value ?? ""} />
            )}
          </p>
          {comparisons && comparisons.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {comparisons.map((c) =>
                c.change != null ? (
                  <p
                    key={c.label}
                    title={`${c.label} ile karşılaştırma`}
                    className={cn(
                      "font-mono text-xs font-medium tabular-nums",
                      c.change > 0 &&
                        "text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]",
                      c.change < 0 &&
                        "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]",
                      c.change === 0 && "text-muted-foreground",
                    )}
                  >
                    {formatChange(c.change)}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      {c.label}
                    </span>
                  </p>
                ) : (
                  // Karşılaştırma penceresi var ama verisi yok — kısıtı söyle,
                  // sessizce gizleme (kullanıcı kuralı).
                  <p
                    key={c.label}
                    className="text-muted-foreground font-mono text-xs"
                  >
                    {c.label}: veri yok
                  </p>
                ),
              )}
            </div>
          )}
          {change != null && (
            <p
              className={cn(
                "mt-1 font-mono text-xs font-medium tabular-nums",
                change > 0 &&
                  "text-[oklch(0.50_0.19_278)] dark:text-[oklch(0.80_0.10_278)]",
                change < 0 &&
                  "text-[oklch(0.58_0.16_344)] dark:text-[oklch(0.74_0.12_344)]",
                change === 0 && "text-muted-foreground",
              )}
            >
              {formatChange(change)}
              {changeLabel && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  {changeLabel}
                </span>
              )}
            </p>
          )}
          {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
