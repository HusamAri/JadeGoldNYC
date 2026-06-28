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
    <div
      className={cn(
        "bg-accent/50 hidden items-center gap-3 rounded-xl px-3 py-1.5 text-xs tabular-nums lg:flex",
        className,
      )}
    >
      <Scale className="text-muted-foreground size-3.5" />
      <span className="text-muted-foreground">Altin:</span>
      <span className="font-semibold">{fmtUsd(data.pricePerOunce)}/oz</span>
      <span className="text-muted-foreground">·</span>
      <span>14K {fmtUsd2(data.karat14PerGram)}/g</span>
      <span className="text-muted-foreground">·</span>
      <span>10K {fmtUsd2(data.karat10PerGram)}/g</span>
    </div>
  );
}
