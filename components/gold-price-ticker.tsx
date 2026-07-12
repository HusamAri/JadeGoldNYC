"use client";

import { useEffect, useState } from "react";
import { Scale } from "lucide-react";

import { cn } from "@/lib/utils";

interface GoldPriceData {
  pricePerOunce: number;
  pricePerGram: number;
  karat14PerGram: number;
  karat10PerGram: number;
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtUsd2(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function GoldPriceTicker({ className }: { className?: string }) {
  const [data, setData] = useState<GoldPriceData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrice() {
      try {
        const res = await fetch("/api/gold-price");
        if (!res.ok) return;
        const json = (await res.json()) as GoldPriceData;
        if (!cancelled) setData(json);
      } catch {
        // sessiz hata
      }
    }

    fetchPrice();

    // Her 30 dakikada yenile
    const interval = setInterval(fetchPrice, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!data) return null;

  return (
    // Cam çip — hairline kenar + sheen + blur, ortamın üstünde süzülür;
    // okuma dili mono tabular (readout).
    <div
      className={cn(
        "hidden items-center gap-3 rounded-full border border-(--glass-border) bg-(--glass) [background-image:var(--glass-sheen)] px-4 py-1.5 font-mono text-xs tabular-nums shadow-[var(--lift-sm),var(--glass-highlight)] backdrop-blur-md lg:flex",
        className,
      )}
    >
      <Scale aria-hidden className="text-muted-foreground size-3.5" />
      <span className="text-muted-foreground text-[10px]/[1.5] tracking-[0.14em] uppercase">
        Altın:
      </span>
      <span className="font-semibold text-(--gold-deep) dark:[text-shadow:0_0_12px_color-mix(in_srgb,currentColor_40%,transparent)]">
        {fmtUsd(data.pricePerOunce)}/oz
      </span>
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <span>14K {fmtUsd2(data.karat14PerGram)}/g</span>
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <span>10K {fmtUsd2(data.karat10PerGram)}/g</span>
    </div>
  );
}
