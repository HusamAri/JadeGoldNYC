"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, Loader2, Play } from "lucide-react";

import { setListingStateOnEtsy } from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { Button } from "@/components/ui/button";

/**
 * Etsy listing durumu — "Pasife al" / "Yayına al".
 * Pasife alma SİLME DEĞİLDİR: listing Etsy'de durur, alıcıya görünmez, tek
 * tıkla geri alınır. Çift listing / yanlış fiyat gibi durumlarda ilk müdahale.
 */
export function ListingStateButton({
  productId,
  status,
}: {
  productId: string;
  /** Panel aynasındaki Etsy durumu (active / inactive / …). */
  status: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const cur = (status ?? "").toLowerCase();
  // Yalnız iki yönlü geçişin mümkün olduğu durumlarda göster; sold_out /
  // expired / draft'ta Etsy düzenlemeye izin vermiyor (canlı 403).
  if (cur !== "active" && cur !== "inactive") return null;
  const hedef = cur === "active" ? "inactive" : "active";

  function run() {
    const soru =
      hedef === "inactive"
        ? "Listing Etsy'de PASİFE alınacak (silinmez, alıcıya görünmez, geri alınabilir). Devam?"
        : "Listing Etsy'de yeniden YAYINA alınacak. Devam?";
    if (!confirm(soru)) return;
    setPending(true);
    setListingStateOnEtsy(productId, hedef)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success(
          hedef === "inactive" ? "Listing pasife alındı." : "Listing yayına alındı.",
        );
        router.refresh();
      })
      .finally(() => setPending(false));
  }

  return (
    <Button type="button" variant="outline" onClick={run} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : hedef === "inactive" ? (
        <EyeOff />
      ) : (
        <Play />
      )}
      {hedef === "inactive" ? "Pasife al" : "Yayına al"}
    </Button>
  );
}
