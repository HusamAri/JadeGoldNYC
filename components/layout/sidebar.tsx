"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { MembershipWithOrg } from "@/lib/auth";
import { NAV_GROUPS, NAV_ITEMS } from "@/components/layout/nav-items";
import { matchNavItem } from "@/lib/nav";
import { OrgSwitcher } from "@/components/layout/org-switcher";

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

/**
 * V7 sol ray — dergi "içindekiler" sayfası: marka serif, numaralı bölümler
 * (01..NN), grup başlığı mono + hairline, aktif satır yumuşak kabartı + asit
 * çubuk. En altta folyo: şirket adı, ay ve Ayarlar. Neumorph yalnız aktif
 * satırda (serpiştirme kuralı).
 */
export function Sidebar({
  memberships,
  activeOrgId,
  showJadeGoldNav,
  showBrandBookNav,
  platformCapabilities,
  emblem,
}: {
  memberships: MembershipWithOrg[];
  activeOrgId: string;
  showJadeGoldNav: boolean;
  showBrandBookNav: boolean;
  platformCapabilities: Record<string, boolean>;
  /** Aktif org işareti — folyoda şirket adının yanında. */
  emblem?: React.ReactNode;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const activeHref = matchNavItem(NAV_ITEMS, pathname)?.href;
  const now = new Date();
  const folio = `${MONTHS_TR[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    navRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  // Numaralama: Panel 00, sonra bölümler sırayla; Sistem grubu folyoda.
  let counter = 0;
  const groups = NAV_GROUPS.filter((g) => g.label !== "Sistem");
  const system = NAV_GROUPS.find((g) => g.label === "Sistem");

  return (
    <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh w-[220px] shrink-0 flex-col justify-between border-r border-[color:var(--rule)] py-8 pl-7 md:flex">
      <div className="min-h-0 flex flex-col">
        <Link
          href="/panel"
          className="h-serif text-foreground text-[24px] leading-none tracking-[-0.01em]"
        >
          Amuletta<span className="text-neon not-italic">.</span>
        </Link>
        <div className="mt-5 pr-7">
          <OrgSwitcher memberships={memberships} activeOrgId={activeOrgId} />
        </div>
        <nav
          ref={navRef}
          className="mt-9 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-7 [scroll-padding-block:1rem]"
        >
          {groups.map((group) => {
            const items = group.items.filter((i) => {
              if (i.jadeGoldOnly && !showJadeGoldNav) return false;
              if (i.brandBook && !showBrandBookNav) return false;
              if (i.capability && !platformCapabilities[i.capability]) return false;
              return true;
            });
            if (items.length === 0) return null;
            return (
              <div key={group.label} className="flex flex-col gap-1.5">
                <p className="toc-h mb-1.5 select-none">{group.label}</p>
                {items.map((item) => {
                  const n = String(counter++).padStart(2, "0");
                  const active = item.href === activeHref;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn("toc-n jg-focus-outline", active && "on")}
                    >
                      <span className="num">{n}</span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>
      <div className="mono-label pr-7 leading-[1.9]">
        <span className="flex items-center gap-1.5 text-foreground">
          {emblem}
          <span className="truncate">
            {memberships.find((m) => m.org_id === activeOrgId)?.orgName ?? "Şirket"}
          </span>
        </span>
        <span className="block">{folio}</span>
        {system?.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.href === activeHref ? "page" : undefined}
            className={cn(
              "hover:text-foreground block transition-colors",
              item.href === activeHref ? "text-neon-ink" : "text-ink-2",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
