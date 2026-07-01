"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { metricFormSchema, type MetricFormValues } from "@/lib/validations/metric";
import {
  createMetric,
  updateMetric,
  previewPeriodStats,
  type PeriodStatsPreview,
} from "@/app/(dashboard)/analizler/actions";
import { formatMoney } from "@/lib/money";
import { formatNumber } from "@/lib/format";
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
  const [previewPending, startPreviewTransition] = useTransition();
  const [preview, setPreview] = useState<PeriodStatsPreview | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
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

  function refreshPreview() {
    const { period_start, period_end } = getValues();
    if (!period_start.trim() && !period_end.trim()) {
      setPreview(null);
      return;
    }
    startPreviewTransition(async () => {
      const stats = await previewPeriodStats(period_start, period_end);
      setPreview(stats);
    });
  }

  // Düzenleme modunda dönem tarihleri zaten dolu geliyor — önizlemeyi ilk
  // yüklemede de göster, yalnızca tarih alanları blur edildiğinde değil.
  // (refreshPreview() çağırmıyoruz çünkü onun senkron setPreview(null) dalı
  // effect gövdesinde doğrudan setState'e yol açar; burada yalnızca asenkron
  // yol izleniyor.)
  useEffect(() => {
    const { period_start, period_end } = getValues();
    if (!period_start.trim() && !period_end.trim()) return;
    startPreviewTransition(async () => {
      const stats = await previewPeriodStats(period_start, period_end);
      setPreview(stats);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            <Input
              id="period_start"
              type="date"
              {...register("period_start", { onBlur: refreshPreview })}
            />
          </Field>
          <Field id="period_end" label="Bitiş">
            <Input
              id="period_end"
              type="date"
              {...register("period_end", { onBlur: refreshPreview })}
            />
          </Field>
        </CardContent>
        {(previewPending || preview) && (
          <CardContent className="pt-0">
            <p className="text-muted-foreground text-xs">
              {previewPending
                ? "Hesaplanıyor…"
                : preview &&
                  `Bu döneme göre otomatik hesaplanacak: ${formatNumber(preview.orders)} sipariş · ${formatMoney(preview.revenueCents)} ciro${
                    preview.avgRating != null
                      ? ` · ${preview.avgRating.toFixed(1)}★ (${formatNumber(preview.ratedCount)} yorum)`
                      : " · henüz puan yok"
                  }`}
            </p>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dönüşüm Hunisi</CardTitle>
          <CardDescription>
            Sipariş ve ciro dönem tarihine göre satış kayıtlarından otomatik hesaplanır
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Field id="visits" label="Ziyaret">
            <Input id="visits" inputMode="numeric" {...register("visits")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sepette Terk · Reklam</CardTitle>
          <CardDescription>Puan, yorum kayıtlarından otomatik hesaplanır</CardDescription>
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
