import type { SVGProps } from "react";

/**
 * Lux ikon seti — Jade Gold NYC için markaya özel, "sessiz lüks" ince-çizgi
 * ikonlar (kuyumcu diline uygun: fasetli taş, terazi, tezgâh çekici). Lucide'ın
 * generic glifleri yerine; tutarlı 24 ızgara, ince ve zarif stroke, yuvarlak
 * uçlar. `LucideIcon` ile aynı yerde kullanılabilir (SVGProps kabul eder).
 *
 * Not: dolgu YOK (fill=none) — zarafet ince çizgide; renk currentColor'dan.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Ciro — zarif sikke + ince $ (fill YOK, override edilse de line kalır). */
export function DollarSign(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M14.4 9.2c-.5-.9-1.4-1.3-2.5-1.3-1.4 0-2.5.8-2.5 1.95 0 2.7 5.1.95 5.1 3.7 0 1.2-1.15 2-2.6 2-1.2 0-2.2-.5-2.7-1.55" />
      <path d="M12 6.4v11.2" />
    </Svg>
  );
}

/** Net — ince yükseliş çizgisi + uçta minik faset (elmas nokta). */
export function TrendingUp(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <path d="M3.5 15.8 9.2 10l3.1 3 5.4-5.6" />
      <path d="m17.7 7.4-.9 2.3 2.3.9" transform="translate(-.2 -.2)" />
      <path d="M18.9 6.2 20.4 7.7 18.9 9.2 17.4 7.7Z" />
    </Svg>
  );
}

/** Sipariş — ince alışveriş kesesi. */
export function ShoppingBag(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <path d="M6.2 8h11.6l-.9 10.4a1.4 1.4 0 0 1-1.4 1.3H8.5a1.4 1.4 0 0 1-1.4-1.3L6.2 8Z" />
      <path d="M9.2 8V6.6a2.8 2.8 0 0 1 5.6 0V8" />
    </Svg>
  );
}

/** Ort. sipariş / kesinti — zarif fiş, zikzak alt kenar. */
export function Receipt(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <path d="M7 3.8h10v15.9l-1.9-1.15-1.65 1.15-1.6-1.15-1.6 1.15L8.6 18.55 7 19.7V3.8Z" />
      <path d="M9.8 8.2h4.4M9.8 11.6h4.4" />
    </Svg>
  );
}

/** Yüzde / kâr marjı — iki faset topuz + ince eğik çizgi. */
export function Percent(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <path d="M6.4 17.6 17.6 6.4" />
      <circle cx="8.2" cy="8.2" r="2.1" />
      <circle cx="15.8" cy="15.8" r="2.1" />
    </Svg>
  );
}

/** Alıcılar — iki zarif figür. */
export function Users(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <circle cx="9" cy="8.6" r="2.9" />
      <path d="M3.6 19c0-3 2.4-4.9 5.4-4.9s5.4 1.9 5.4 4.9" />
      <path d="M15.4 6.1a2.9 2.9 0 0 1 0 5.4" />
      <path d="M17 14.4c1.9.5 3.4 2.2 3.4 4.6" />
    </Svg>
  );
}

/** Cüzdan — ince cüzdan + tek faset düğme. */
export function Wallet(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <path d="M4 8.6A2.4 2.4 0 0 1 6.4 6.2h10.2a1 1 0 0 1 1 1V8" />
      <rect x="4" y="8" width="16" height="11" rx="2.4" />
      <path d="M20 12.2h-3a1.8 1.8 0 0 0 0 3.6h3" />
    </Svg>
  );
}

/** Altın malzeme — fasetli pırlanta (kuyumcu kahramanı). */
export function Gem(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <path d="M7.2 4h9.6l3.7 5-8.5 11L3.5 9l3.7-5Z" />
      <path d="M3.5 9h17" />
      <path d="M9.4 4 7.6 9l4.4 11M14.6 4l1.8 5-4.4 11" />
    </Svg>
  );
}

/** İşçilik — kuyumcu tezgâh çekici (zarif diyagonal). */
export function Hammer(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <path d="M3.8 20.2 11 13" />
      <path d="M10.4 9.6 14.2 5.8l1.7 1.7 2.2-2.2 1.9 1.9-2.2 2.2 1.7 1.7-3.8 3.8-5.5-5.3Z" />
    </Svg>
  );
}

/** Terazi / ayar dengesi — zarif kefeli terazi. */
export function Scale(props: IconProps) {
  return (
    <Svg {...props} fill="none">
      <path d="M12 4.2v15.4M6.4 19.6h11.2M5 8h14" />
      <path d="M12 5 5 8l-2.4 4.9a2.9 2.9 0 0 0 4.8 0L5 8Z" />
      <path d="M12 5l7 3 2.4 4.9a2.9 2.9 0 0 1-4.8 0L19 8Z" />
    </Svg>
  );
}
