"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, ChevronLeft, Check, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

import { signOut, switchOrganization } from "@/lib/actions/session";
import type { MembershipWithOrg } from "@/lib/auth";
import { NAV_ITEMS, NAV_GROUPS } from "@/components/layout/nav-items";
import { matchNavItem } from "@/lib/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
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
  showBrandBookNav,
  platformCapabilities,
  emblem,
}: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  memberships: MembershipWithOrg[];
  activeOrgId: string;
  /** Aktif şirket Jade Gold ise marka-özel sekmeler mobil menüde de görünür. */
  showJadeGoldNav: boolean;
  /** Jade Gold veya EON — Marka Kılavuzu. */
  showBrandBookNav: boolean;
  /** Aktif platform yetenekleri — `capability` işaretli sekmeler filtrelenir. */
  platformCapabilities: Record<string, boolean>;
  /** Aktif org'un LUME işareti (sunucuda render edilir; mobil başlıkta). */
  emblem?: React.ReactNode;
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
  const current = matchNavItem(NAV_ITEMS, pathname);
  // Geri butonu yalnız alt/detay sayfalarında (bölüm ana sayfası veya Panel değil).
  const isSubPage = pathname !== "/panel" && (!current || pathname !== current.href);
  // Bir üst seviyeye git (segment kırp) — tarayıcı geçmişine güvenmez, uygulama
  // dışına çıkmaz. Düzenleme sayfalarında ('.../[id]/duzenle') üst '[id]' detay
  // sayfası çoğu modülde YOK (maliyetler, analizler[/urunler], sepet-kurtarma,
  // tasarimlar, yorumlar) → tek segment kırpmak 404 üretir. Bu yüzden 'duzenle'
  // sayfasında iki segment kırpıp modül listesine dön (her modülde liste var);
  // diğer alt sayfalarda tek segment. Ör. /maliyetler/123/duzenle → /maliyetler.
  const segments = pathname.split("/").filter(Boolean);
  const upTo = segments[segments.length - 1] === "duzenle" ? -2 : -1;
  const up = segments.slice(0, upTo);
  const parentHref = up.length ? `/${up.join("/")}` : "/panel";

  return (
    /* V7 üst şerit: düz, hairline'sız, zeminle aynı; masaüstünde yalnız
       araçlar (altın, tema, bildirim, kullanıcı) sağda durur, bölüm adı
       mobilde görünür (masaüstünde editoryal başlık sayfanın kendisinde). */
    <div className="sticky top-0 z-30 bg-background/92 px-5 pt-3 backdrop-blur-[2px] md:px-14">
    <header className="relative flex h-12 items-center justify-between gap-3">
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
                <p className="toc-h mx-2 mt-2 mb-1 select-none">
                  {g.label}
                </p>
                {g.items.map((i) => {
                  if (i.jadeGoldOnly && !showJadeGoldNav) return null;
                  if (i.brandBook && !showBrandBookNav) return null;
                  if (i.capability && !platformCapabilities[i.capability])
                    return null;
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

        <span className="md:hidden">{emblem}</span>
        {/* Bildirim zili — sol üst (kullanıcı kararı): uyarı sinyalleri
            dropdown listede; ilk bildirim sağdan kayan cam kartla duyurulur.
            key + orgId: şirket değiştirilince zil YENİDEN MONTE olur ve aktif
            org için tazeler — yoksa istemci zil mount'taki eski şirketin
            uyarılarını tutup farklı şirketlerin alertlerini karıştırıyordu. */}
        <NotificationBell key={activeOrgId} orgId={activeOrgId} />
        {/* Bölüm adı yalnız mobilde; masaüstünde H1 sayfanın editoryal başlığıdır. */}
        <span className="h-serif text-[20px] md:hidden">{current?.label ?? "Panel"}</span>
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
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Çıkış yap
              </Button>
            </form>
          </div>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    </div>
  );
}
