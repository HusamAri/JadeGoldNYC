import type { SVGProps } from "react";

/**
 * Lux "art" ikonları — Higgsfield ile TEK görselde üretilip (art-deco, sessiz
 * lüks, jade+altın kuyumcu dili) hücrelere kesilip arka planı temizlenmiş
 * (cutout) şeffaf PNG'ler (public/icons/lux/*.png). KPI kutu filigranı olarak
 * kullanılır; zaten altın tonunda oldukları için tema kontrastına uyar.
 *
 * `LucideIcon` yerine geçebilir (SVGProps kabul eder; yalnız className/style
 * uygulanır — img SVG-özel propları yok sayar).
 */
function art(src: string) {
  function LuxArtIcon({ className, style }: SVGProps<SVGSVGElement>) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden
        draggable={false}
        className={className}
        style={style as React.CSSProperties}
      />
    );
  }
  return LuxArtIcon;
}

export const Gem = art("/icons/lux/gem.png");
export const Scale = art("/icons/lux/scale.png");
export const Hammer = art("/icons/lux/hammer.png");
export const DollarSign = art("/icons/lux/coin.png");
export const ShoppingBag = art("/icons/lux/bag.png");
export const Receipt = art("/icons/lux/receipt.png");
export const Percent = art("/icons/lux/percent.png");
export const Users = art("/icons/lux/users.png");
export const Wallet = art("/icons/lux/wallet.png");
export const TrendingUp = art("/icons/lux/trend.png");
