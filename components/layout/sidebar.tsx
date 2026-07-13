"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { MembershipWithOrg } from "@/lib/auth";
import { NAV_GROUPS } from "@/components/layout/nav-items";
import { Logo } from "@/components/layout/logo";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { WhatsNewNav } from "@/components/layout/whats-new-nav";

export function Sidebar({
  memberships,
  activeOrgId,
  showJadeGoldNav,
}: {
  memberships: MembershipWithOrg[];
  activeOrgId: string;
  /** Aktif şirket Jade Gold ise marka-özel sekmeler (Marka Kılavuzu, Görsel Üretim) görünür. */
  showJadeGoldNav: boolean;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // Aktif nav öğesi katlanan (overflow-y-auto) rayda görünür kalsın —
  // rota değişince en yakın konuma kaydır (görsel geri bildirim; davranış yok).
  useEffect(() => {
    navRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  return (
    /* Koyuda zeminden (#14161e) bir tık derin, lume panellerden koyu
       #1b1d27 panel — kartlar öne, nav geriye çekilir (Lume derinlik dili). */
    <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh w-64 shrink-0 flex-col md:flex dark:border-r dark:border-[color:oklch(1_0_0/0.05)] dark:bg-[#1b1d27]">
      {/* Uygulama markası — Amuletta (serif italik, editorial) */}
      <div className="flex h-14 items-center px-5">
        <span className="text-foreground text-xl leading-none font-medium tracking-tight [font-family:var(--font-display)]">
          Amuletta<em className="text-primary not-italic">.</em>
        </span>
        <span className="idx ml-auto !gap-0 text-[9px]">panel</span>
      </div>
      {/* Marka kutusu — kiracı (şirket) kimliği yalnız bu SINIRLI kutuda:
          kazınmış oyuk içinde logo + şirket seçici. Arayüzün kalanı Amuletta. */}
      <div className="px-4 pb-1">
        <div className="brand-box flex items-center gap-3 px-3.5 py-3">
          <Logo />
          <div className="relative z-[1] flex min-w-0 flex-col leading-tight">
            <OrgSwitcher memberships={memberships} activeOrgId={activeOrgId} />
            <span className="text-muted-foreground text-[0.68rem] tracking-wide">
              Marka Alanı
            </span>
          </div>
        </div>
      </div>
      {/* Fade maskesi: üst/alt kenarda içerik taştığını gösterir; scroll-padding
          pill'in tam katlama sınırında ortadan kesilmesini önler. */}
      <nav
        ref={navRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 [scroll-padding-block:1.25rem] [mask-image:linear-gradient(to_bottom,transparent,#000_14px,#000_calc(100%-20px),transparent)]"
      >
        {NAV_GROUPS.map((group) => (
          /* Neu ray — grup çukur bir ray içinde (ref: Spatial .seg/.tabbar:
             neu-inset ray + içinde kabarık aktif). Koyuda ray, derin panelin
             içine oyulmuş lume çukuruna döner (--lume-pit). */
          <div
            key={group.label}
            className="nm-pressed space-y-1 overflow-clip rounded-2xl p-1.5 dark:bg-[#171922] dark:[background-image:none] dark:[box-shadow:var(--lume-pit)]"
          >
            <p className="px-2.5 pt-1.5 pb-1 text-[0.64rem] font-bold tracking-[0.18em] text-[color:var(--sidebar-label)] uppercase select-none">
              {group.label}
            </p>
            {group.items.map((item) => {
              if (item.jadeGoldOnly && !showJadeGoldNav) return null;
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative isolate flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-[box-shadow,transform,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    active
                      ? /* Aktif = rayın içinde KABARIK çip (ref: .tabbar .t.on —
                           neu-bg + neu-raised-sm + fg-1 mürekkep). */
                        "text-foreground [background-image:var(--nm-convex)] [box-shadow:var(--shadow-raised-sm)]"
                      : "text-sidebar-foreground/75 hover:text-foreground hover:[background-image:var(--nm-convex)] hover:[box-shadow:var(--shadow-raised-sm)]",
                  )}
                >
                  {/* İndigo lamp — aktif çipin altında yumuşak radyal ışık
                      (ref: .tabbar .lamp — oklch(0.72 0.13 280/.38) → .10 %55
                      → şeffaf %75, blur(7px)). */}
                  {active && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-x-1 -inset-y-1.5 -z-10 rounded-2xl blur-[7px] [background-image:radial-gradient(62%_58%_at_50%_32%,oklch(0.72_0.13_280/0.38),oklch(0.72_0.13_280/0.10)_55%,transparent_75%)]"
                    />
                  )}
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active && "text-[color:var(--gold-deep)]",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <WhatsNewNav />
    </aside>
  );
}
