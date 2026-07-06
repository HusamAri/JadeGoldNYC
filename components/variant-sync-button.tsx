"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, Boxes } from "lucide-react";

import { runVariantInventorySync } from "@/app/(dashboard)/stok/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Etsy varyant/envanter senkronunu elle tetikler. Varyantları listing'lere
 * bağlar, offering başına adedi (stok) çeker ve satış kalemlerini SKU üzerinden
 * ürüne bağlar — "N kalem bağlı değil / stok varyanta dağılmıyor" kaynağını kapatır.
 */
export function VariantSyncButton({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleClick() {
    setMsg(null);
    startTransition(async () => {
      const r = await runVariantInventorySync();
      if (r.error) {
        toast.error(r.error);
        setMsg(r.error);
        return;
      }
      const parts = [
        `${r.listings ?? 0} listing tarandı`,
        `${r.variants ?? 0} varyant güncellendi`,
        `${r.saleItemsLinked ?? 0} satış kalemi bağlandı`,
      ];
      if (r.gramsMatched) parts.push(`${r.gramsMatched} gram eşlendi`);
      if (r.errors) parts.push(`${r.errors} listing hata verdi`);
      const summary = parts.join(" · ");
      // Bazı listing'ler hata verdiyse kısmi başarı — uyarı tonu ile göster.
      if (r.errors && r.errors > 0) {
        toast.warning(summary);
      } else {
        toast.success(summary);
      }
      setMsg(summary);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <Boxes className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Etsy varyant / envanter senkronu</p>
            <p className="text-muted-foreground text-xs">
              {msg ??
                "Varyantları listing'lere bağlar, her varyantın (offering) stok adedini Etsy'den çeker ve satış kalemlerini ürüne bağlar."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={isPending || !connected}
          className="shrink-0"
        >
          <RefreshCw className={isPending ? "animate-spin" : ""} />
          {isPending ? "Senkronize ediliyor…" : "Varyantları Senkronize Et"}
        </Button>
      </CardContent>
    </Card>
  );
}
