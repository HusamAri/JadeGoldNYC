"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import { switchOrganization } from "@/lib/actions/session";
import type { MembershipWithOrg } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Şirket seçici — kullanıcı birden çok şirkete üyeyse sidebar başlığında
 * açılır liste; tek şirkette yalnız adı gösterir. "Yeni şirket kur" her
 * durumda görünür (platform: aynı hesapla ikinci şirket).
 */
export function OrgSwitcher({
  memberships,
  activeOrgId,
}: {
  memberships: MembershipWithOrg[];
  activeOrgId: string;
}) {
  const [pending, startTransition] = useTransition();
  const active = memberships.find((m) => m.org_id === activeOrgId);

  function onSwitch(orgId: string) {
    if (orgId === activeOrgId) return;
    startTransition(async () => {
      try {
        await switchOrganization(orgId);
      } catch (e) {
        // redirect() bir kontrol akışı istisnası fırlatır — gerçek hata değilse yut.
        if (e instanceof Error && !e.message.includes("NEXT_REDIRECT")) {
          toast.error("Şirket değiştirilemedi.");
        }
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex min-w-0 items-center gap-1 rounded-md text-left",
          "hover:text-foreground focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
          pending && "opacity-60",
        )}
        aria-label="Şirket seç"
      >
        {/* Kiracı adı — Spatial marka dili: serif 600, sıkı tracking
            (ref: .navglass .brand). */}
        <span className="truncate text-[15px] leading-tight font-semibold tracking-[-0.01em] [font-family:var(--font-serif)]">
          {active?.orgName ?? "Şirket"}
        </span>
        <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.org_id}
            onSelect={() => onSwitch(m.org_id)}
            className="gap-2"
          >
            <span className="min-w-0 flex-1 truncate">{m.orgName}</span>
            {m.org_id === activeOrgId && <Check className="size-4 shrink-0" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/kurulum" className="gap-2">
            <Plus className="size-4" />
            Yeni şirket kur
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
