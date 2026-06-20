"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

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

export type DeleteActionResult = { error?: string } | void;

export function DeleteButton({
  action,
  id,
  title = "Kaydı sil",
  description = "Bu işlem geri alınamaz. Kayıt kalıcı olarak silinecek (denetim logunda iz kalır).",
  redirectTo,
  variant = "icon",
}: {
  action: (id: string) => Promise<DeleteActionResult>;
  id: string;
  title?: string;
  description?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onConfirm() {
    startTransition(async () => {
      const res = await action(id);
      if (res && "error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Kayıt silindi");
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="size-4" />
            <span className="sr-only">Sil</span>
          </Button>
        ) : (
          <Button variant="outline" className="text-destructive">
            <Trash2 className="size-4" />
            Sil
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Siliniyor…" : "Sil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
