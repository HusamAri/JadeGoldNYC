"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";

import { createBoard } from "@/app/(dashboard)/tasarimlar/pano/actions";
import { Button } from "@/components/ui/button";

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

/** Bir tasarıma görsel (anotasyon panosu) yükler. */
export function NewBoardForm({ designId }: { designId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin.");
      return;
    }
    // İstemci sınırı sunucu (10 MB) ve Next gövde limitiyle uyumlu.
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Görsel 10 MB'ı aşamaz.");
      return;
    }
    setBusy(true);
    try {
      const { width, height } = await readDimensions(file);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("designId", designId);
      fd.append("width", String(width || ""));
      fd.append("height", String(height || ""));
      const res = await createBoard(fd);
      if (res.error || !res.id) {
        toast.error(res.error ?? "Görsel eklenemedi.");
        return;
      }
      toast.success("Görsel eklendi.");
      router.refresh();
    } catch {
      toast.error("Yükleme sırasında beklenmeyen bir hata oluştu.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-dashed p-6 text-center">
      <p className="text-muted-foreground mb-3 text-sm">
        Bu tasarımın mockup görselini yükleyin; üzerine pin bırakıp not alın.
      </p>
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
      <Button type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
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
