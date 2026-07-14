"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BadgeCheck,
  ChevronDown,
  ExternalLink,
  Loader2,
  Wand2,
} from "lucide-react";

import type { AuditGroup } from "@/lib/db/queries/listing-audit";
import type { AlertSeverity } from "@/lib/db/queries/data-gaps";
import { normalizeTitleEntities } from "@/app/(dashboard)/tasarimlar/iyilestir/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

const SEVERITY_META: Record<
  AlertSeverity,
  { label: string; variant: "destructive" | "warning" | "secondary" }
> = {
  kritik: { label: "Kritik", variant: "destructive" },
  onemli: { label: "Önemli", variant: "warning" },
  bilgi: { label: "Bilgi", variant: "secondary" },
};

/**
 * Denetim panosu — kontrol başına bir kart. Kartı açınca YALNIZ etkilenen
 * listingler listelenir; her satırın "Düzelt" bağlantısı doğru düzenleme
 * yüzeyine gider. Kullanıcı havuzdan ürün hatırlayıp seçmek zorunda kalmaz.
 */
export function ListingAuditBoard({ groups }: { groups: AuditGroup[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(
    groups.length > 0 ? groups[0].key : null,
  );
  const [fixing, startFixing] = useTransition();

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={BadgeCheck}
        title="Tüm kontroller temiz"
        description="Aktif listingler belgeli Etsy arama sinyallerinin hepsinden geçti — tag'ler dolu, başlıklar verimli, açıklamalar yerinde."
      />
    );
  }

  function runNormalize() {
    startFixing(async () => {
      const res = await normalizeTitleEntities();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.fixed
          ? `${res.fixed} başlık normalize edildi — Etsy'deki listing'lere dokunulmadı.`
          : "Normalize edilecek başlık kalmamış.",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const isOpen = open === g.key;
        const sev = SEVERITY_META[g.severity];
        return (
          <Card key={g.key} className="p-0">
            <button
              type="button"
              className="flex w-full items-start gap-3 p-4 text-left"
              onClick={() => setOpen(isOpen ? null : g.key)}
              aria-expanded={isOpen}
            >
              <Badge variant={sev.variant} className="mt-0.5 shrink-0">
                {sev.label}
              </Badge>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block text-sm font-semibold">
                  {g.title}
                </span>
                <span className="text-muted-foreground block text-xs leading-relaxed">
                  {g.hint}
                </span>
                <a
                  href={g.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground/80 hover:text-foreground inline-flex items-center gap-1 font-mono text-[10px] tracking-wide uppercase underline-offset-2 hover:underline"
                >
                  Kaynak: {g.sourceLabel}
                  <ExternalLink className="size-3" />
                </a>
              </span>
              <ChevronDown
                className={cn(
                  "text-muted-foreground mt-1 size-4 shrink-0 transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {isOpen && (
              <CardContent className="space-y-2 border-t pt-3 pb-4">
                {g.autoFixable && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-3">
                    <p className="text-muted-foreground text-xs">
                      Bu bulgu tek tuşla panelde düzeltilebilir; Etsy&rsquo;deki
                      listing&rsquo;lere yazılmaz.
                    </p>
                    <Button size="sm" disabled={fixing} onClick={runNormalize}>
                      {fixing ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Wand2 className="size-4" />
                      )}
                      Tümünü düzelt ({g.count})
                    </Button>
                  </div>
                )}
                <ul className="divide-border/60 divide-y">
                  {g.items.map((it) => (
                    <li
                      key={it.productId}
                      className="flex items-center gap-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{it.title}</p>
                        <p className="text-muted-foreground font-mono text-[11px]">
                          {it.detail}
                          {it.etsyListingId != null && ` · #${it.etsyListingId}`}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={it.fixHref}>
                          {g.fixLabel}
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
