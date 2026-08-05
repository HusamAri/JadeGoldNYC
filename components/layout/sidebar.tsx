"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { MembershipWithOrg } from "@/lib/auth";
import { NAV_GROUPS, NAV_ITEMS } from "@/components/layout/nav-items";
import { matchNavItem } from "@/lib/nav";
import { Logo } from "@/components/layout/logo";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { WhatsNewNav } from "@/components/layout/whats-new-nav";

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
  /** Aktif şirket Jade Gold ise marka-özel sekmeler (Görsel Üretim) görünür. */
  showJadeGoldNav: boolean;
  /** Jade Gold veya EON — Marka Kılavuzu. */
  showBrandBookNav: boolean;
  /**
   * Aktif platformun yetenek bayrakları (lib/platform.ts) — `capability`
   * işaretli sekmeler (Yıldız Satıcı, Reklamlar, SEO Etiketleri) yalnız
   * ilgili yetenek açıkken görünür (Etsy dışı org'da Etsy motorları gizlenir).
   */
  platformCapabilities: Record<string, boolean>;
  /**
   * Aktif org'un LUME işareti (holo gradient + ışıma) — sunucuda render
   * edilip prop olarak iner (bu bileşen client; async org çözümü yapamaz).
   * Başlıktaki "panel" etiketinin yanında durur.
   */
  emblem?: React.ReactNode;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const activeHref = matchNavItem(NAV_ITEMS, pathname)?.href;

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
        <span className="idx ml-auto !gap-1.5 text-[9px]">
          {emblem}
          panel
        </span>
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
              if (item.brandBook && !showBrandBookNav) return null;
              if (item.capability && !platformCapabilities[item.capability])
                return null;
              const active = item.href === activeHref;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    // Hareket dili: geçiş listesinde BOŞTA duran `transform`
                    // artık kullanılıyor — hover'da çip raydan bir tık öne
                    // sıyrılır, basışta ray zeminine OTURUR (nm-pressed dili:
                    // konkav zemin + çukur gölge). Basış hızlı ve lineer,
                    // bırakış 300ms --ease-premium (asimetrik fizik).
                    "relative isolate flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-[box-shadow,transform,color,background-image] duration-300 ease-[var(--ease-premium)]",
                    "hover:-translate-x-0.5 active:translate-x-0 active:[background-image:var(--nm-convex-press)] active:[box-shadow:var(--shadow-pressed)] active:[transition-duration:var(--motion-press-in)] active:[transition-timing-function:linear]",
                    // Klavye odağı: panelin ANA navigasyonunda hiçbir sinyal
                    // yoktu. `jg-focus` yerine `jg-focus-outline` — bu öğe
                    // box-shadow UTILITY'si taşıyor (utilities, components
                    // katmanını ezer) → gölge tabanlı halka ya hiç görünmez
                    // ya da kabarık çipi silerdi. Outline gölgeyle yarışmaz.
                    "jg-focus-outline",
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
