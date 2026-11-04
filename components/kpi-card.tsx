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

/**
 * KPI — V7 defter hücresi: mono etiket, Fraunces 300 rakam, mono dipnot.
 * Kart/cam/gölge yok; hücreler `.band` içinde dikey hairline ile ayrılır,
 * tek başına kullanıldığında üst hairline taşır. `holo`/`splitTone` geriye
 * uyum için kabul edilir: ikisi de "kahraman" demektir ve rakam asit
 * mürekkeple basılır (tek vurgu kuralı).
 */
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
  value?: string;
  cents?: number | null;
  currency?: string;
  icon?: IconType;
  hint?: string;
  accent?: "default" | "positive" | "negative";
  change?: number | null;
  changeLabel?: string;
  comparisons?: KpiComparison[];
  className?: string;
  splitTone?: boolean;
  holo?: boolean;
}) {
  const isMoney = cents != null;
  const displayString = isMoney ? formatMoney(cents, currency) : (value ?? "");
  const hero = holo || splitTone;
  const len = displayString.length;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col border-t border-[color:var(--rule)] pt-4 pb-1",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="mono-label line-clamp-2">{label}</span>
        {Icon && <Icon aria-hidden className="text-muted-foreground size-3.5 shrink-0" />}
      </div>
      <p
        title={displayString || undefined}
        className={cn(
          "ledger-num mt-3 break-normal",
          len > 13 ? "text-[26px]" : len > 10 ? "text-[32px]" : "text-[40px]",
          hero && "text-neon-ink",
          !hero && accent === "negative" && "text-[var(--negative)]",
        )}
      >
        {isMoney ? (
          <CountUpMoney cents={cents} currency={currency} />
        ) : (
          <CountUpText value={value ?? ""} />
        )}
      </p>
      {comparisons && comparisons.length > 0 && (
        <div className="mono-label mt-2.5 space-y-0.5 normal-case tracking-[0.08em]">
          {comparisons.map((c) =>
            c.change != null ? (
              <p key={c.label} title={`${c.label} ile karşılaştırma`}>
                <span
                  className={cn(
                    c.change > 0 && "text-foreground",
                    c.change < 0 && "text-[var(--negative)]",
                  )}
                >
                  {formatChange(c.change)}
                </span>{" "}
                {c.label.toLocaleLowerCase("tr-TR")}
              </p>
            ) : (
              <p key={c.label}>{c.label.toLocaleLowerCase("tr-TR")}: veri yok</p>
            ),
          )}
        </div>
      )}
      {change != null && (
        <p className="mono-label mt-2.5 normal-case tracking-[0.08em]">
          <span
            className={cn(
              change > 0 && "text-foreground",
              change < 0 && "text-[var(--negative)]",
            )}
          >
            {formatChange(change)}
          </span>
          {changeLabel ? ` ${changeLabel}` : ""}
        </p>
      )}
      {hint && <p className="mono-label mt-2.5 normal-case tracking-[0.08em]">{hint}</p>}
    </div>
  );
}
