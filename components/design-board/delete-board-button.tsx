"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { deleteBoard } from "@/app/(dashboard)/tasarimlar/pano/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Tasarımın görsel panosunu (yanlış yüklenen görseli) siler. Onay için markalı
 * `Dialog` kullanır (native `window.confirm` yerine — uygulamanın geri kalanıyla
 * tutarlı, stillenebilir ve daha az sarsıcı).
 */
export function DeleteBoardButton({
  boardId,
  designId,
}: {
  boardId: string;
  designId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onConfirm() {
    start(async () => {
      const res = await deleteBoard(boardId, designId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Görsel silindi. Yeni bir görsel yükleyebilirsiniz.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Trash2 className="size-4" />
          Görseli sil
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Görseli sil</DialogTitle>
          <DialogDescription>
            Bu panonun görselini ve tüm notlarını silmek istiyor musunuz? Bu işlem
            geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Vazgeç
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Siliniyor…
              </>
            ) : (
              "Sil"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
