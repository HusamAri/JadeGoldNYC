"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Çukur (inset) ray — aktif sekme rayın içinden kabararak yükselir.
        // `isolate`: tetikleyicinin -z lamp katmanı (after) rayın ÜSTÜNDE ama
        // hap dolgusunun ALTINDA boyanır (arkadan sızan ışık).
        "nm-pressed text-muted-foreground relative isolate inline-flex h-10 w-fit items-center justify-center rounded-full p-1",
        // Koyu: lume seg rayı (Liquid_Dark .seg birebir) — oklch(0 0 0/0.3)
        // zemin + lume-pit iç gölgesi.
        "dark:[background-image:none] dark:[background-color:oklch(0_0_0/0.3)] dark:shadow-[var(--lume-pit)]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Aktif sekme: konveks kabartı hap (raised-sm + text-primary) — çukur
        // rayın içinde yükselir. Yazı index dilinde (mono, uppercase, tracking).
        // Basma fiziği (Button ile aynı dil): transform hızlı iner, yaylanarak
        // kalkar → süre ve easing per-property listelenir. Sekme, dolgu
        // düğmeden daha ince bir kontrol olduğu için genlik biraz daha derin
        // (0.96) ama gölge/lamp katmanına DOKUNULMAZ.
        "text-muted-foreground hover:text-foreground data-[state=active]:text-primary data-[state=active]:[background-image:var(--nm-convex)] data-[state=active]:shadow-[var(--shadow-raised-sm)] focus-visible:ring-ring/50 relative inline-flex h-full flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3.5 py-1 font-mono text-xs font-medium tracking-[0.06em] uppercase whitespace-nowrap transition-[color,box-shadow,translate,scale] [transition-duration:300ms,300ms,var(--motion-press-out),var(--motion-press-out)] [transition-timing-function:var(--ease-premium),var(--ease-premium),var(--ease-press-out),var(--ease-press-out)] active:scale-[0.96] active:[transition-duration:var(--motion-press-in)] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Lamp — aktifin altında blur(7px) indigo radyal (Spatial .tabbar .lamp
        // birebir: oklch(0.72 0.13 280/.38) → .10 %55 → transparent %75).
        "after:absolute after:-inset-x-1.5 after:-inset-y-1 after:-z-10 after:rounded-full after:opacity-0 after:blur-[7px] after:transition-opacity after:duration-500 after:ease-[var(--ease-premium)] after:[background:radial-gradient(62%_58%_at_50%_32%,oklch(0.72_0.13_280/0.38),oklch(0.72_0.13_280/0.10)_55%,transparent_75%)] data-[state=active]:after:opacity-100",
        // Lume (koyu): aktif hap oklch(1 0 0/0.14) + lume-hi + lume-glow,
        // beyaz metin hafif ışımalı (Liquid_Dark .seg button.on birebir).
        "dark:data-[state=active]:[background-image:none] dark:data-[state=active]:[background-color:oklch(1_0_0/0.14)] dark:data-[state=active]:shadow-[var(--lume-hi),var(--lume-glow)] dark:data-[state=active]:text-white dark:data-[state=active]:[text-shadow:0_0_10px_rgb(255_255_255/0.5)]",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
