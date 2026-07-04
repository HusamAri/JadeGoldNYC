"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderPlus, Loader2, X } from "lucide-react";

import { createCollection } from "@/app/(dashboard)/tasarimlar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** "Yeni Koleksiyon" (pano) — tasarımları gruplamak için hızlı ekleme. */
export function NewCollectionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const clean = name.trim();
    if (!clean) return;
    start(async () => {
      const res = await createCollection(clean);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Koleksiyon oluşturuldu.");
      setName("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <FolderPlus />
        Yeni Koleksiyon
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Koleksiyon adı (ör. Men's Collection)"
        className="h-9 w-56"
        disabled={pending}
      />
      <Button type="button" size="sm" onClick={submit} disabled={pending || !name.trim()}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : "Ekle"}
      </Button>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-9"
        onClick={() => setOpen(false)}
      >
        <X className="size-4" />
        <span className="sr-only">Kapat</span>
      </Button>
    </div>
  );
}
