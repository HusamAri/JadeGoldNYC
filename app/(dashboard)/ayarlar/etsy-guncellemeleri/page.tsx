import { Sparkles, Clock, XCircle, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { AddTaskButton } from "@/components/etsy-updates/add-task-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ETSY_UPDATES,
  ETSY_UPDATE_TIER_LABELS,
  type EtsyUpdateTier,
} from "@/lib/etsy-updates";

export const metadata = { title: "Etsy Güncellemeleri" };

const TIER_ORDER: EtsyUpdateTier[] = ["act_now", "worth_doing", "flag", "skip"];

const TIER_ICON: Record<EtsyUpdateTier, LucideIcon> = {
  act_now: Sparkles,
  worth_doing: Clock,
  flag: AlertTriangle,
  skip: XCircle,
};

const TIER_BADGE: Record<
  EtsyUpdateTier,
  "success" | "warning" | "destructive" | "secondary"
> = {
  act_now: "success",
  worth_doing: "warning",
  flag: "destructive",
  skip: "secondary",
};

export default function EtsyGuncellemeleriPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Etsy Güncellemeleri"
        description="Etsy'nin son duyurusundan, mağazanız için elenmiş öneriler"
      />

      {TIER_ORDER.map((tier) => {
        const items = ETSY_UPDATES.filter((i) => i.tier === tier);
        if (items.length === 0) return null;
        const Icon = TIER_ICON[tier];
        return (
          <Card key={tier}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="size-4" />
                {ETSY_UPDATE_TIER_LABELS[tier]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className={i > 0 ? "border-t pt-4" : undefined}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <Badge variant={TIER_BADGE[tier]}>
                      {ETSY_UPDATE_TIER_LABELS[tier]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {item.body}
                  </p>
                  {item.task && (
                    <div className="mt-3">
                      <AddTaskButton task={item.task} />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <p className="text-muted-foreground text-xs">
        Kaynak:{" "}
        <a
          href="https://help.etsy.com/hc/en-us/articles/10603291042967-Newly-Crafted-Etsy-Updates-for-Your-Shop"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Newly Crafted: Etsy Updates for Your Shop
        </a>{" "}
        ·{" "}
        <a
          href="https://www.etsy.com/shop/JadeGoldNyc"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          JadeGoldNyc · Etsy
        </a>
      </p>
    </div>
  );
}
