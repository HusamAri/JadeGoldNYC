"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { runEtsySync } from "@/app/(dashboard)/ayarlar/etsy/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EtsySyncButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    startTransition(async () => {
      const r = await runEtsySync();
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(`Senkronize edildi: ${r.imported ?? 0} sipariş`);
      router.refresh();
    });
  }

  return (
    <Button onClick={onClick} disabled={pending || disabled}>
      <RefreshCw className={cn("size-4", pending && "animate-spin")} />
      {pending ? "Senkronize ediliyor…" : "Şimdi Senkronize Et"}
    </Button>
  );
}
