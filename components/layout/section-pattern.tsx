"use client";

import { usePathname } from "next/navigation";

/**
 * Sessiz lüks doku katmanı — her bölüme (sekme) FARKLI art-deco filigran.
 * Sabit, tam ekran, etkileşimsiz; zeminin üstünde ama içeriğin altında. Yalnız
 * aktif sayfanın deseni yüklenir. Asset yoksa katman şeffaf (zarif düşüş).
 * Opaklık/boyut .jg-texture'da (globals.css); burada yalnız desen URL'i değişir.
 */
const SECTION_PATTERN: Record<string, string> = {
  panel: "jade-pattern", // ana panel — marka mührü motifi
  satislar: "deco-fan",
  maliyetler: "deco-grid",
  analizler: "deco-kaleido",
  stok: "deco-sparse",
  tasarimlar: "deco-damask",
  yorumlar: "deco-quatrefoil",
};
const DEFAULT_PATTERN = "deco-crosshatch";

export function SectionPattern() {
  const pathname = usePathname() ?? "";
  const segment = pathname.split("/").filter(Boolean)[0] ?? "panel";
  const name = SECTION_PATTERN[segment] ?? DEFAULT_PATTERN;

  return (
    <div
      aria-hidden
      className="jg-texture pointer-events-none absolute inset-0 -z-10"
      style={{ backgroundImage: `url(/brand/pattern/${name}.webp)` }}
    />
  );
}
