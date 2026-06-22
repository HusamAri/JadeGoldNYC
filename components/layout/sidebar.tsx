"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { Logo } from "@/components/layout/logo";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Logo />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Jade Gold NYC</span>
          <span className="text-muted-foreground text-xs">Yönetim Paneli</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-[box-shadow,transform,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                active
                  ? "nm-pressed text-foreground"
                  : "text-sidebar-foreground/75 hover:text-foreground hover:[background-image:var(--nm-convex)] hover:[box-shadow:var(--shadow-raised-sm)]",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active && "text-[oklch(0.6_0.08_72)]",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
