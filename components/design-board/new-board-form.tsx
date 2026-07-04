"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";

import { createBoard } from "@/app/(dashboard)/tasarimlar/pano/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Görselin doğal en/boyunu okur (leader-line ölçeği + oran için). */
function readDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export function NewBoardForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Görsel 15 MB'ı aşamaz.");
      return;
    }
    setBusy(true);
    try {
      const { width, height } = await readDimensions(file);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("width", String(width || ""));
      fd.append("height", String(height || ""));
      const res = await createBoard(fd);
      if (res.error || !res.id) {
        toast.error(res.error ?? "Pano oluşturulamadı.");
        return;
      }
      toast.success("Pano oluşturuldu.");
      router.push(`/tasarimlar/pano/${res.id}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Pano başlığı (opsiyonel)"
        disabled={busy}
        className="sm:max-w-xs"
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <Button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        {busy ? "Yükleniyor…" : "Görsel Yükle"}
      </Button>
    </div>
  );
}
