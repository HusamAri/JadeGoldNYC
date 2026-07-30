"use client";

import { useEffect, useRef, useState } from "react";

import { Money } from "@/components/money";

/**
 * KPI SAYAÇ ANİMASYONU — rakam yüklenişte 0'dan gerçek değerine sayar
 * (~0.9s, ease-out). "Canlı panel" hissinin çekirdeği: değer bir metin değil,
 * o an ölçülen bir büyüklük gibi davranır.
 *
 * Kurallar:
 *  - SSR/hydration NİHAİ değeri basar (SEO + no-JS + mismatch yok); animasyon
 *    yalnız mount SONRASI başlar ve tek seferdir.
 *  - prefers-reduced-motion → animasyon hiç koşmaz.
 *  - Para modunda cent'ler tam sayı animasyonlanır, biçim <Money> ile aynı
 *    kalır (kuruş küçük/aşağı). Metin modunda sayısal token bulunur, tr-TR
 *    biçimiyle yeniden yazılır; sayı yoksa metin olduğu gibi kalır.
 *  - tabular-nums (Money ve KPI değeri zaten taşıyor) genişlik zıplamasını
 *    tek karakter genişliğine sabitler.
 */

const DURATION_MS = 900;

/** easeOutCubic — son rakamlar yavaşlayarak oturur. */
function ease(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number): number {
  // setState YALNIZ rAF callback'inde (dış sistem) çağrılır — effect gövdesi
  // temiz (react-hooks/set-state-in-effect). Animasyon başlamadan / hedef
  // eşleşmeden gösterilen değer HEDEFTİR: SSR ve reduced-motion nihai değeri
  // basar, animasyon başlayınca ilk kareden itibaren ara değerler görünür.
  const [anim, setAnim] = useState<{ target: number; value: number } | null>(
    null,
  );
  const raf = useRef(0);
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !Number.isFinite(target) ||
      target === 0
    ) {
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      setAnim({ target, value: target * ease(t) });
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // Hedef değişirse (dönem seçici ile yeni veri) yeniden sayar — istenen etki.
  }, [target]);
  return anim && anim.target === target ? anim.value : target;
}

/** Para KPI'ı — cent'ten sayarak <Money> biçimine. */
export function CountUpMoney({
  cents,
  currency = "USD",
}: {
  cents: number | null | undefined;
  currency?: string;
}) {
  const target = cents ?? 0;
  const shown = useCountUp(target);
  return <Money cents={Math.round(shown)} currency={currency} />;
}

/** tr-TR biçimli sayısal token'ı ("1.234", "12,5") sayıya çevirir. */
function parseTrNumber(token: string): number {
  return Number(token.replaceAll(".", "").replace(",", "."));
}

/**
 * Metin KPI'ı — içindeki İLK sayısal token'ı animasyonlar, kalıbı korur
 * ("%12,5" → yüzde işareti ve ondalık basamak sayısı aynı kalır).
 */
export function CountUpText({ value }: { value: string }) {
  const m = value.match(/-?[\d.]+(?:,\d+)?/);
  const target = m ? parseTrNumber(m[0]) : NaN;
  const decimals = m?.[0].includes(",") ? m[0].split(",")[1].length : 0;
  const shown = useCountUp(Number.isFinite(target) ? target : 0);
  if (!m || !Number.isFinite(target)) return <>{value}</>;
  const formatted = shown.toLocaleString("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <>{value.replace(m[0], formatted)}</>;
}
