"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, ChevronLeft, Check, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

import { signOut, switchOrganization } from "@/lib/actions/session";
import type { MembershipWithOrg } from "@/lib/auth";
import { NAV_ITEMS, NAV_GROUPS } from "@/components/layout/nav-items";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoldPriceTicker } from "@/components/gold-price-ticker";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({
  email,
  name,
  avatarUrl,
  memberships,
  activeOrgId,
  showJadeGoldNav,
}: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  memberships: MembershipWithOrg[];
  activeOrgId: string;
  /** Aktif şirket Jade Gold ise marka-özel sekmeler mobil menüde de görünür. */
  showJadeGoldNav: boolean;
}) {
  const pathname = usePathname();
  const [switchPending, startSwitch] = useTransition();

  function onSwitchOrg(orgId: string) {
    if (orgId === activeOrgId) return;
    startSwitch(async () => {
      try {
        await switchOrganization(orgId);
      } catch (e) {
        // redirect() kontrol-akışı istisnası normaldir; gerçek hatayı bildir.
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
          toast.error("Şirket değiştirilemedi.");
        }
      }
    });
  }
  const current = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );
  // Geri butonu yalnız alt/detay sayfalarında (bölüm ana sayfası veya Panel değil).
  const isSubPage = pathname !== "/panel" && (!current || pathname !== current.href);
  // Bir üst seviyeye git (segment kırp) — tarayıcı geçmişine güvenmez, uygulama
  // dışına çıkmaz. Ör. /satislar/123/duzenle → /satislar/123 → /satislar.
  const parentHref = pathname.split("/").slice(0, -1).join("/") || "/panel";

  return (
    /* Spatial navglass — yarı saydam cam şerit: blur'lu beyaz cam + sheen,
       altta hairline (--glass-border), içte pah highlight'ı + lift gölgesi.
       Koyu modda token'lar camı kendiliğinden "ışık taşıyan" LUME cama çevirir. */
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[color:var(--glass-border)] px-4 [background-color:var(--glass)] shadow-[var(--lift-sm),var(--glass-highlight)] [backdrop-filter:var(--glass-filter)] transition-[background-color,box-shadow] duration-500 ease-[var(--ease-premium)] [background-image:var(--glass-sheen)] md:px-6">
      <div className="flex items-center gap-3">
        {/* Geri — alt/detay sayfalarında */}
        {isSubPage && (
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Geri"
            title="Geri"
          >
            <Link href={parentHref}>
              <ChevronLeft />
              <span className="sr-only">Geri</span>
            </Link>
          </Button>
        )}

        {/* Mobil menü */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu />
              <span className="sr-only">Menü</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[75vh] w-60 overflow-y-auto">
            {NAV_GROUPS.map((g) => (
              <div key={g.label}>
                <p className="px-2 pt-2 pb-1 font-mono text-[0.62rem] font-medium tracking-[0.16em] text-[color:var(--brand-mark)]/80 uppercase select-none">
                  {g.label}
                </p>
                {g.items.map((i) => {
                  if (i.jadeGoldOnly && !showJadeGoldNav) return null;
                  const Icon = i.icon;
                  return (
                    <DropdownMenuItem key={i.href} asChild>
                      <Link href={i.href}>
                        <Icon className="size-4" />
                        {i.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Logo className="size-8 md:hidden" />
        {/* Editorial vurgu çizgisi (.idx-bar dili) — başlığın önünde kısa
            primary hairline; yalnız masaüstünde. */}
        <span aria-hidden className="hidden h-px w-6 shrink-0 bg-primary/70 md:block" />
        <h1 className="text-base font-semibold tracking-tight md:text-lg">
          {current?.label ?? "Panel"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <GoldPriceTicker />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <UserAvatar
                src={avatarUrl}
                name={name}
                email={email}
                className="size-6"
              />
              <span className="hidden max-w-[180px] truncate sm:inline">
                {name || email || "Kullanıcı"}
              </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="truncate">
            {name || email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Şirketler — mobilde sidebar (ve oradaki seçici) görünmediğinden
              şirket geçişi + yeni şirket kurma her ekranda buradan erişilir. */}
          <DropdownMenuLabel className="text-muted-foreground flex items-center gap-1.5 font-mono text-[0.68rem] font-medium tracking-[0.14em] uppercase">
            <Building2 className="size-3.5" />
            Şirketler
          </DropdownMenuLabel>
          {memberships.map((m) => (
            <DropdownMenuItem
              key={m.org_id}
              onSelect={() => onSwitchOrg(m.org_id)}
              disabled={switchPending}
              className="gap-2"
            >
              <span className="min-w-0 flex-1 truncate">{m.orgName}</span>
              {m.org_id === activeOrgId && <Check className="size-4 shrink-0" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild>
            <Link href="/kurulum" className="gap-2">
              <Plus className="size-4" />
              Yeni şirket kur
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="p-1">
            <form action={signOut}>
              <button
                type="submit"
                className="text-destructive hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              >
                <LogOut className="size-4" />
                Çıkış yap
              </button>
            </form>
          </div>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
