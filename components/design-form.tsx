"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { designFormSchema, type DesignFormValues } from "@/lib/validations/design";
import {
  createDesign,
  updateDesign,
} from "@/app/(dashboard)/tasarimlar/actions";
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

export function DesignForm({
  mode,
  designId,
  defaultValues,
  products,
}: {
  mode: "create" | "edit";
  designId?: string;
  defaultValues: DesignFormValues;
  products: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues,
  });

  function onSubmit(values: DesignFormValues) {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createDesign(values)
          : await updateDesign(designId!, values);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Tasarım eklendi" : "Tasarım güncellendi");
      router.push("/tasarimlar");
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
