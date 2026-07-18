"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";

import { reconcileEtsyListings } from "@/app/(dashboard)/listing-onerileri/actions";
import { Button } from "@/components/ui/button";

/**
 * "Etsy ile eşle" — Etsy'de canlı olduğu halde etsy_listing_id yazılamamış
 * (Önerilerde takılı) taslakları Etsy listing'lerine SKU ailesiyle eşler.
 * Pending durumunda buton disabled + spinner (çift tık / donuk hissi önlenir).
 */
export function ReconcileEtsyButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await reconcileEtsyListings();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const parts: string[] = [];
      if (res.linked) parts.push(`${res.linked} taslak eşlendi`);
      if (res.conflicts) parts.push(`${res.conflicts} çakışma`);
      if (res.ambiguous) parts.push(`${res.ambiguous} belirsiz`);
      const msg = parts.length ? parts.join(" · ") : "Eşlenecek taslak bulunamadı";
      if (res.linked) {
        toast.success(msg, { description: `${res.scanned ?? 0} Etsy listing tarandı.` });
        router.refresh();
      } else {
        toast.info(msg, {
          description: res.notes?.length
            ? res.notes.slice(0, 3).join(" · ")
            : `${res.scanned ?? 0} Etsy listing tarandı.`,
        });
      }
    });
  }

  return (
    <Button variant="outline" onClick={run} disabled={pending} aria-busy={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      {pending ? "Eşleniyor…" : "Etsy ile eşle"}
    </Button>
  );
}
