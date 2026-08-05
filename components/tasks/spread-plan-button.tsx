"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarRange, Loader2 } from "lucide-react";

import { spreadTaskPlan } from "@/app/(dashboard)/gorevler/actions";
import { Button } from "@/components/ui/button";

/**
 * "Planı Yay" — tek güne yığılmış açık görevleri bugünden ileriye dengeli
 * dağıtır (günde ≤5, P0 önce). Tamamlananlara ve tavana uyan ileri terminlere
 * dokunmaz; yalnız termin tarihleri değişir (geri alınabilir düzeyde hafif).
 */
export function SpreadPlanButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res = await spreadTaskPlan();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (!res.moved) {
        toast.info("Plan zaten dengeli — taşınacak görev yok (günde ≤5).");
        return;
      }
      toast.success(`${res.moved} görev ${res.days} güne yayıldı.`, {
        description: "P0 önce, günde en çok 5 açık görev; tamamlananlara dokunulmadı.",
      });
      router.refresh();
    });
  }

  return (
    <Button variant="outline" onClick={run} disabled={pending} aria-busy={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <CalendarRange />}
      {pending ? "Yayılıyor…" : "Planı Yay"}
    </Button>
  );
}
