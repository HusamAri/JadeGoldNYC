"use client";

import React from "react";
import { Gem } from "lucide-react";

interface CostDiamondBadgeProps {
  costLabel: string;
  approxCostUsd?: number;
  className?: string;
  showWarningTooltip?: boolean;
}

export function CostDiamondBadge({
  costLabel,
  approxCostUsd,
  className = "",
}: CostDiamondBadgeProps) {
  const tooltipText = approxCostUsd
    ? `Tahmini birim işlem maliyeti: ~$${approxCostUsd.toFixed(4)}`
    : "Bu işlem ek API / model kullanım ücretine tabidir.";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 ${className}`}
      title={tooltipText}
    >
      <Gem className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
      <span>{costLabel}</span>
    </span>
  );
}
