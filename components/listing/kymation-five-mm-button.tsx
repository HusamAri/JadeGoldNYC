"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Scissors } from "lucide-react";
import { toast } from "sonner";

import { keepKymationFiveMmAction } from "@/app/(dashboard)/tasarimlar/listing/[id]/actions";
import { Button } from "@/components/ui/button";

export function KymationFiveMmButton({
  productId,
  writeEnabled,
}: {
  productId: string;
  writeEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [armed, setArmed] = useState(false);

  function run() {
    start(async () => {
      const result = await keepKymationFiveMmAction(productId);
      setArmed(false);
      if (result.needsReconnect) {
        toast.error("Etsy bağlantısı yok. Ayarlar sayfasından yeniden bağlanın.");
        return;
      }
      if (result.error) {
        toast.error(result.error, { duration: 12000 });
        return;
      }
      if (result.unchanged) {
        toast.info("Listing zaten yalnız 5 mm ve 25 bedenden oluşuyor.");
      } else {
        toast.success(
          `${result.removed ?? 0} Etsy offering ve ${result.panelDeleted ?? 0} panel varyantı kaldırıldı. ${result.remaining ?? 0} adet 5 mm varyant doğrulandı.`,
          { duration: 10000 },
        );
      }
      router.refresh();
    });
  }

  if (armed && !pending) {
    return (
      <span className="inline-flex items-center gap-2">
        <Button type="button" size="sm" onClick={run}>
          <Scissors className="size-4" />
          Onayla, yalnız 5 mm bırak
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setArmed(false)}
        >
          Vazgeç
        </Button>
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={pending || !writeEnabled}
      title={
        writeEnabled
          ? "Etsy ve panelde yalnız 5 mm genişlik, US 4 ile 16 arasındaki tam ve yarım bedenler kalır"
          : "Etsy yazma izni kapalı"
      }
      onClick={() => setArmed(true)}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Scissors className="size-4" />
      )}
      Yalnız 5 mm bırak
    </Button>
  );
}
