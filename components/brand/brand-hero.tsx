import { BrandTile } from "@/components/brand/brand-tile";

/**
 * Bölüm başı marka hero'su — gerçek ürün çekimi üzerinde sıcak scrim + altın
 * eyebrow ve başlık. Estetik marka dili; veri düzenini bozmayacak yükseklikte.
 */
export function BrandHero({
  image,
  eyebrow,
  title,
  subtitle,
}: {
  image: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <BrandTile
      src={image}
      rounded={false}
      scrim
      className="h-40 rounded-[1.75rem] shadow-[var(--shadow-raised)] md:h-52"
    >
      <div className="relative flex h-full flex-col justify-end p-6 md:p-8">
        <span className="text-[11px] font-medium tracking-[0.28em] text-[oklch(0.86_0.09_85)] uppercase">
          {eyebrow}
        </span>
        <h2 className="mt-1.5 text-2xl font-semibold text-white md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 max-w-md text-sm text-white/85">{subtitle}</p>
        )}
      </div>
    </BrandTile>
  );
}
