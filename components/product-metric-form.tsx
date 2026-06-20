"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  productMetricFormSchema,
  type ProductMetricFormValues,
} from "@/lib/validations/product-metric";
import {
  createProductMetric,
  updateProductMetric,
} from "@/app/(dashboard)/analizler/urunler/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export function ProductMetricForm({
  mode,
  metricId,
  defaultValues,
}: {
  mode: "create" | "edit";
  metricId?: string;
  defaultValues: ProductMetricFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductMetricFormValues>({
    resolver: zodResolver(productMetricFormSchema),
    defaultValues,
  });

  function onSubmit(values: ProductMetricFormValues) {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createProductMetric(values)
          : await updateProductMetric(metricId!, values);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Ürün kaydı eklendi" : "Güncellendi");
      router.push("/analizler/urunler");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="product_title">Ürün Adı</Label>
            <Input id="product_title" {...register("product_title")} />
            {errors.product_title && (
              <p className="text-destructive text-sm">
                {errors.product_title.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="period_label">Dönem</Label>
            <Input id="period_label" {...register("period_label")} />
            {errors.period_label && (
              <p className="text-destructive text-sm">
                {errors.period_label.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" {...register("sku")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="views">Görüntüleme</Label>
            <Input id="views" inputMode="numeric" {...register("views")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orders">Sipariş</Label>
            <Input id="orders" inputMode="numeric" {...register("orders")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="revenue">Ciro</Label>
            <Input id="revenue" inputMode="decimal" {...register("revenue")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ads_clicks">Reklam Tık</Label>
            <Input id="ads_clicks" inputMode="numeric" {...register("ads_clicks")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ads_spend">Reklam Harcama</Label>
            <Input id="ads_spend" inputMode="decimal" {...register("ads_spend")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ads_revenue">Reklam Ciro</Label>
            <Input id="ads_revenue" inputMode="decimal" {...register("ads_revenue")} />
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
