"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";

import { signOut } from "@/lib/actions/session";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/theme-toggle";
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
}: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center justify-between gap-3 px-4 shadow-[0_10px_24px_-20px_rgb(var(--nm-dark)/0.7)] backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobil menü */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu />
              <span className="sr-only">Menü</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {NAV_ITEMS.map((i) => {
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
          </DropdownMenuContent>
        </DropdownMenu>

        <Logo className="size-8 md:hidden" />
        <h1 className="text-base font-semibold md:text-lg">
          {current?.label ?? "Panel"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
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
