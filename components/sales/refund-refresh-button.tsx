"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { refreshRefundsAction } from "@/app/(dashboard)/satislar/maliyet/actions";
import { Button } from "@/components/ui/button";

/**
 * "İade verisini Etsy'den çek" — durumu iade olup receipt gövdesi bu sürümden
 * önce okunmuş siparişler (tutar BİLİNMİYOR). Bütçeli; kalan varsa tekrar.
 */
export function RefundRefreshButton({
  backlog,
  canRun,
}: {
  backlog: number;
  canRun: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (backlog <= 0) return null;
  return (
    <Button
      type="button"
      variant="outline"
      disabled={!canRun || pending}
      aria-busy={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await refreshRefundsAction();
          if (r.error) {
            toast.error(r.error);
            return;
          }
          toast.success(
            `${r.refreshed ?? 0} siparişin iade verisi çekildi${
              r.remaining ? " · kalan var, tekrar basın" : ""
            }`,
          );
          router.refresh();
        })
      }
      title={
        canRun
          ? "Etsy'den receipt gövdelerini yeniden okur (refunds[])"
          : "Yalnız sahip/yönetici"
      }
    >
      <RefreshCw className={pending ? "animate-spin" : undefined} />
      İade verisini çek ({backlog})
    </Button>
  );
}
