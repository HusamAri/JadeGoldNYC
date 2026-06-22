"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon, Monitor, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

function prefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

// localStorage'ı harici depo gibi oku — set-state-in-effect ve hydration uyumsuzluğu olmadan.
function subscribe(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("themechange", cb);
  mq.addEventListener("change", cb);
  return () => {
    window.removeEventListener("themechange", cb);
    mq.removeEventListener("change", cb);
  };
}
function getSnapshot(): Theme {
  return (localStorage.getItem("theme") as Theme) || "system";
}

const OPTIONS: { key: Theme; label: string; icon: LucideIcon }[] = [
  { key: "light", label: "Açık", icon: Sun },
  { key: "dark", label: "Koyu", icon: Moon },
  { key: "system", label: "Sistem", icon: Monitor },
];

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "system");

  // "Sistem" modundayken OS teması değişirse DOM sınıfını güncelle (state değiştirmez).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (getSnapshot() === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function choose(next: Theme) {
    localStorage.setItem("theme", next);
    applyTheme(next);
    window.dispatchEvent(new Event("themechange"));
  }

  const ActiveIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Tema seç">
          <ActiveIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {OPTIONS.map((o) => {
          const Icon = o.icon;
          return (
            <DropdownMenuItem
              key={o.key}
              onClick={() => choose(o.key)}
              className={cn(
                "gap-2",
                theme === o.key && "text-[oklch(0.6_0.08_72)]",
              )}
            >
              <Icon className="size-4" />
              {o.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
