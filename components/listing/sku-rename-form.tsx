"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Tags } from "lucide-react";

import { renameListingSkusOnEtsy } from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * SKU ÖNEKİ DEĞİŞTİR — Etsy'de kopyalanan listing'i kendi ailesine taşır.
 * Kopya, kaynağın SKU'larını miras aldığı için panelde "0 varyant" görünür;
 * önek değişince çakışma biter ve varyantlar bu listing'e bağlanır.
 */
export function SkuRenameForm({
  productId,
  /** Panelde bu listing'e bağlı bir SKU varsa önek tahmini için. */
  ornekSku,
}: {
  productId: string;
  ornekSku?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const tahmin = (ornekSku ?? "").match(/^[A-Z]+-R-\d{4}/)?.[0] ?? "";
  const [from, setFrom] = useState(tahmin);
  const [to, setTo] = useState("");

  function run() {
    if (!from.trim() || !to.trim()) {
      toast.error("Eski ve yeni önek gerekli.");
      return;
    }
    if (
      !confirm(
        `Etsy envanterindeki tüm SKU'lar "${from.trim()}…" → "${to.trim()}…" olarak yeniden adlandırılacak. Fiyat ve adetlere dokunulmaz. Devam?`,
      )
    ) {
      return;
    }
    setPending(true);
    renameListingSkusOnEtsy(productId, from.trim(), to.trim())
      .then((res) => {
        if (res.error) {
          toast.error(res.error, { duration: 10000 });
          return;
        }
        toast.success(
          `${res.renamed} SKU yeniden adlandırıldı. ${(res.sample ?? [])[0] ?? ""}`,
          { duration: 8000 },
        );
        router.refresh();
      })
      .finally(() => setPending(false));
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs leading-relaxed">
        Etsy&apos;de listing kopyalayınca SKU&apos;lar da kopyalanır; panelde SKU
        benzersiz olduğu için kopya <strong>0 varyant</strong> görünür ve
        listelerde gizlenir. Kopyaya kendi SKU ailesini vererek çakışmayı
        kalıcı olarak bitirin. Fiyat, adet ve varyasyon değerleri korunur.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
            Eski önek
          </Label>
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="RSG-R-1401"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground font-mono text-[10px] tracking-[0.12em] uppercase">
            Yeni önek
          </Label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="GLD-R-1401"
            className="font-mono"
          />
        </div>
      </div>
      <Button type="button" variant="outline" onClick={run} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Tags />}
        {pending ? "Yazılıyor…" : "SKU önekini Etsy'de değiştir"}
      </Button>
    </div>
  );
}
