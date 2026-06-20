"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { metricFormSchema, type MetricFormValues } from "@/lib/validations/metric";
import { createMetric, updateMetric } from "@/app/(dashboard)/analizler/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}

export function MetricForm({
  mode,
  metricId,
  defaultValues,
}: {
  mode: "create" | "edit";
  metricId?: string;
  defaultValues: MetricFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MetricFormValues>({
    resolver: zodResolver(metricFormSchema),
    defaultValues,
  });

  function onSubmit(values: MetricFormValues) {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createMetric(values)
          : await updateMetric(metricId!, values);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Snapshot eklendi" : "Snapshot güncellendi");
      router.push("/analizler");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dönem</CardTitle>
          <CardDescription>
            Örn. &quot;2026 Oca-Haz&quot;, &quot;Haziran 2026&quot;, &quot;2025&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Field id="period_label" label="Dönem Etiketi">
            <Input id="period_label" {...register("period_label")} />
            {errors.period_label && (
              <p className="text-destructive text-sm">
                {errors.period_label.message}
              </p>
            )}
          </Field>
          <Field id="period_start" label="Başlangıç">
            <Input id="period_start" type="date" {...register("period_start")} />
          </Field>
          <Field id="period_end" label="Bitiş">
            <Input id="period_end" type="date" {...register("period_end")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dönüşüm Hunisi</CardTitle>
          <CardDescription>
            Dönüşüm = sipariş ÷ ziyaret (otomatik hesaplanır)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Field id="visits" label="Ziyaret">
            <Input id="visits" inputMode="numeric" {...register("visits")} />
          </Field>
          <Field id="orders" label="Sipariş">
            <Input id="orders" inputMode="numeric" {...register("orders")} />
          </Field>
          <Field id="revenue" label="Ciro">
            <Input id="revenue" inputMode="decimal" {...register("revenue")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sepette Terk · Puan · Reklam</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Field id="cart_abandon_amount" label="Sepette Terk (tutar)">
            <Input
              id="cart_abandon_amount"
              inputMode="decimal"
              {...register("cart_abandon_amount")}
            />
          </Field>
          <Field id="cart_abandon_count" label="Sepette Terk (adet)">
            <Input
              id="cart_abandon_count"
              inputMode="numeric"
              {...register("cart_abandon_count")}
            />
          </Field>
          <Field id="rating" label="Puan (5 üzerinden)" hint="örn. 4.3">
            <Input id="rating" inputMode="decimal" {...register("rating")} />
          </Field>
          <Field id="ads_spend" label="Etsy Ads Harcama">
            <Input id="ads_spend" inputMode="decimal" {...register("ads_spend")} />
          </Field>
          <Field id="ads_revenue" label="Etsy Ads Ciro" hint="ROAS otomatik hesaplanır">
            <Input
              id="ads_revenue"
              inputMode="decimal"
              {...register("ads_revenue")}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trafik Kaynakları (ziyaret)</CardTitle>
          <CardDescription>İsteğe bağlı — kaynak bazında ziyaret</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Field id="src_etsy_app" label="Etsy App / Sayfa">
            <Input id="src_etsy_app" inputMode="numeric" {...register("src_etsy_app")} />
          </Field>
          <Field id="src_etsy_marketing" label="Etsy Marketing / SEO">
            <Input
              id="src_etsy_marketing"
              inputMode="numeric"
              {...register("src_etsy_marketing")}
            />
          </Field>
          <Field id="src_etsy_ads" label="Etsy Ads">
            <Input id="src_etsy_ads" inputMode="numeric" {...register("src_etsy_ads")} />
          </Field>
          <Field id="src_etsy_search" label="Etsy Arama">
            <Input
              id="src_etsy_search"
              inputMode="numeric"
              {...register("src_etsy_search")}
            />
          </Field>
          <Field id="src_direct" label="Direkt ve Diğer">
            <Input id="src_direct" inputMode="numeric" {...register("src_direct")} />
          </Field>
          <Field id="src_social" label="Sosyal Medya">
            <Input id="src_social" inputMode="numeric" {...register("src_social")} />
          </Field>
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
