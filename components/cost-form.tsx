"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { costFormSchema, type CostFormValues } from "@/lib/validations/cost";
import { createCost, updateCost } from "@/app/(dashboard)/maliyetler/actions";
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

export function CostForm({
  mode,
  costId,
  defaultValues,
  categories,
}: {
  mode: "create" | "edit";
  costId?: string;
  defaultValues: CostFormValues;
  categories: { value: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CostFormValues>({
    resolver: zodResolver(costFormSchema),
    defaultValues,
  });

  function onSubmit(values: CostFormValues) {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createCost(values)
          : await updateCost(costId!, values);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        mode === "create" ? "Maliyet eklendi" : "Maliyet güncellendi",
      );
      router.push("/maliyetler");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category_id">Kategori</Label>
            <Controller
              control={control}
              name="category_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category_id" className="w-full">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category_id && (
              <p className="text-destructive text-sm">
                {errors.category_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost_date">Tarih</Label>
            <Input id="cost_date" type="date" {...register("cost_date")} />
            {errors.cost_date && (
              <p className="text-destructive text-sm">
                {errors.cost_date.message}
              </p>
            )}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Açıklama</Label>
            <Input id="description" {...register("description")} />
            {errors.description && (
              <p className="text-destructive text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Tutar</Label>
            <Input id="amount" inputMode="decimal" {...register("amount")} />
            {errors.amount && (
              <p className="text-destructive text-sm">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Para Birimi</Label>
            <Input id="currency" maxLength={3} {...register("currency")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor">Tedarikçi</Label>
            <Input id="vendor" {...register("vendor")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <Label htmlFor="notes">Notlar</Label>
          <Textarea id="notes" rows={3} {...register("notes")} />
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
