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
        // rayın içinde yükselir.
        "text-muted-foreground hover:text-foreground data-[state=active]:text-primary data-[state=active]:[background-image:var(--nm-convex)] data-[state=active]:shadow-[var(--shadow-raised-sm)] focus-visible:ring-ring/50 relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] duration-300 ease-[var(--ease-premium)] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Lamp — aktif hapın ARKASINDA blur'lu accent radial (after, -z; rail
        // isolate olduğundan hap dolgusunun altında, rayın üstünde parlar).
        "after:absolute after:-inset-x-1.5 after:-inset-y-1 after:-z-10 after:rounded-full after:opacity-0 after:blur-[6px] after:transition-opacity after:duration-500 after:ease-[var(--ease-premium)] after:[background:radial-gradient(65%_85%_at_50%_50%,var(--pit-glow),transparent_78%)] data-[state=active]:after:opacity-100",
        // Lume (koyu): aktif metinde belli belirsiz currentColor parıltısı.
        "dark:data-[state=active]:[text-shadow:0_0_12px_color-mix(in_srgb,currentColor_40%,transparent)]",
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
