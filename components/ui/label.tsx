"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        // Form etiketi = index dili (lab .slabel .n birebir: mono, 10-11px,
        // .14em tracking, uppercase, sessiz mürekkep).
        "text-muted-foreground flex items-center gap-2 font-mono text-[11px] leading-none font-medium tracking-[0.14em] uppercase select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
