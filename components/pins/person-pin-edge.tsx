/* eslint-disable @next/next/no-img-element -- büyük statik cutout PNG */
import { cn } from "@/lib/utils";

/**
 * KENARA İLİŞTİRİLMİŞ KİŞİ CUTOUT'U — scrapbook/editoryal duruş (kullanıcı
 * kararı): atanan kişinin portre pini küçük avatar kutusuna sıkışmaz; kartın
 * SOL kenarına dışa taşarak iliştirilir — hafif dönük, katmanlı doğal gölge,
 * "panoya pinlenmiş kupür" hissi. Üstteki pirinç raptiye başı bu hissi mühürler.
 *
 * Kullanım: kartı `relative` bir sarmalayıcıya al, bu bileşeni KARTIN KARDEŞİ
 * olarak koy (kartın overflow'u kesmesin); metinle çakışmasın diye karta
 * koşullu sol dolgu ver.
 */
export function PersonPinEdge({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-16 -left-9 z-10 block -rotate-6 select-none",
        className,
      )}
    >
      <img
        src={src}
        alt={alt}
        className="h-32 w-auto max-w-none [filter:drop-shadow(0_3px_4px_rgb(48_42_60/0.3))_drop-shadow(0_16px_24px_rgb(48_42_60/0.22))] dark:[filter:drop-shadow(0_3px_5px_rgb(0_0_0/0.55))_drop-shadow(0_18px_28px_rgb(0_0_0/0.45))]"
      />
      {/* Pirinç raptiye başı — üst-orta; radyal parlaklık + minik gölge. */}
      <span
        aria-hidden
        className="absolute -top-1.5 left-1/2 size-3.5 -translate-x-1/2 rounded-full [background:radial-gradient(circle_at_35%_30%,#f4e3b2,#c9a24b_55%,#8a6a2a)] [box-shadow:0_1px_2px_rgb(48_42_60/0.45),inset_0_1px_1px_rgb(255_255_255/0.7)]"
      />
    </span>
  );
}
