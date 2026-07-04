"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

import { deleteBoard } from "@/app/(dashboard)/tasarimlar/pano/actions";
import { Button } from "@/components/ui/button";

/** Tasarımın görsel panosunu (yanlış yüklenen görseli) siler. */
export function DeleteBoardButton({
  boardId,
  designId,
}: {
  boardId: string;
  designId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onDelete() {
    if (!window.confirm("Bu panonun görselini ve tüm notlarını silmek istiyor musunuz?"))
      return;
    start(async () => {
      const res = await deleteBoard(boardId, designId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Görsel silindi. Yeni bir görsel yükleyebilirsiniz.");
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onDelete}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
      Görseli sil
    </Button>
  );
}
