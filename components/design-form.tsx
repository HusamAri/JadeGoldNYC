"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, X } from "lucide-react";

import { designFormSchema, type DesignFormValues } from "@/lib/validations/design";
import {
  createDesign,
  updateDesign,
} from "@/app/(dashboard)/tasarimlar/actions";
import { createBoard } from "@/app/(dashboard)/tasarimlar/pano/actions";
import { DESIGN_STATUSES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const NONE = "__none__";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB — createBoard sunucu sınırıyla aynı

/** Görselin doğal en/boyunu okur (pano ölçeği/oranı için). */
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

export function DesignForm({
  mode,
  designId,
  defaultValues,
  products,
  collections,
}: {
  mode: "create" | "edit";
  designId?: string;
  defaultValues: DesignFormValues;
  products: { value: string; label: string }[];
  collections: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // Oluşturma akışında görsel, kayıt HENÜZ yokken seçilebilsin diye istemcide
  // tutulur; kaydetmede tasarım oluşturulup görsel yeni id ile yüklenir.
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues,
  });

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir görsel dosyası seçin.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Görsel 10 MB'ı aşamaz.");
      return;
    }
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPhoto(file);
  }

  function clearPhoto() {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  /** Seçilen görseli yeni tasarıma yükler; başarısızsa tasarım korunur. */
  async function uploadPhoto(newId: string): Promise<{ error?: string }> {
    if (!photo) return {};
    const { width, height } = await readDimensions(photo);
    const fd = new FormData();
    fd.append("file", photo);
    fd.append("designId", newId);
    fd.append("width", String(width || ""));
    fd.append("height", String(height || ""));
    const res = await createBoard(fd);
    return { error: res.error };
  }

  function onSubmit(values: DesignFormValues) {
    startTransition(async () => {
      if (mode === "edit") {
        const res = await updateDesign(designId!, values);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Tasarım güncellendi");
        router.push("/tasarimlar");
        router.refresh();
        return;
      }

      const res = await createDesign(values);
      if (res?.error || !res.id) {
        toast.error(res?.error ?? "Tasarım eklenemedi.");
        return;
      }
      // Görsel seçilmediyse: standart akış (listeye dön).
      if (!photo) {
        toast.success("Tasarım eklendi");
        router.push("/tasarimlar");
        router.refresh();
        return;
      }
      // Görsel seçildiyse: tasarım oluştu, şimdi görseli yükle. Yükleme
      // başarısız olsa bile tasarım kaydı korunur — kullanıcı düzenle
      // sayfasından tekrar deneyebilir. Her iki durumda düzenle sayfasına git.
      const up = await uploadPhoto(res.id);
      if (up.error) {
        toast.error("Tasarım kaydedildi, ancak görsel yüklenemedi: " + up.error);
      } else {
        toast.success("Tasarım ve görsel eklendi");
      }
      router.push(`/tasarimlar/${res.id}/duzenle`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Ad</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Durum</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGN_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_id">İlişkili Ürün</Label>
            <Controller
              control={control}
              name="product_id"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value : NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <SelectTrigger id="product_id" className="w-full">
                    <SelectValue placeholder="Ürün seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Yok</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection_id">Koleksiyon (Pano)</Label>
            <Controller
              control={control}
              name="collection_id"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value : NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <SelectTrigger id="collection_id" className="w-full">
                    <SelectValue placeholder="Koleksiyon seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Koleksiyonsuz</SelectItem>
                    {collections.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiketler</Label>
            <Input id="tags" placeholder="örn. altın, kolye, yeni" {...register("tags")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Versiyon</Label>
            <Input id="version" inputMode="numeric" {...register("version")} />
            {errors.version && (
              <p className="text-destructive text-sm">{errors.version.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {mode === "create" && (
        <Card>
          <CardContent className="space-y-3">
            <div>
              <Label>Görsel (opsiyonel)</Label>
              <p className="text-muted-foreground mt-1 text-sm">
                Mockup görselini şimdi ekleyebilirsiniz — kaydı kaydetmeden önce
                seçin, tasarımla birlikte yüklenir. Sonra düzenle sayfasından pin
                bırakıp not alabilirsiniz.
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0])}
            />
            {preview ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Seçilen görsel önizleme"
                  className="thumb-lift size-20 rounded-lg border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{photo?.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {photo ? `${(photo.size / 1024 / 1024).toFixed(1)} MB` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  Değiştir
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearPhoto}
                  aria-label="Görseli kaldır"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="size-4" />
                Görsel Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
