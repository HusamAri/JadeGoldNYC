"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

import {
  starSellerFormSchema,
  type StarSellerFormValues,
} from "@/lib/validations/star-seller";
import { upsertStarSellerSnapshot } from "@/app/(dashboard)/yildiz-satici/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StarSellerForm({
  snapshotId,
  defaultValues,
  autoRating,
}: {
  snapshotId?: string;
  defaultValues: StarSellerFormValues;
  autoRating: { avgRating: number | null; lowReviewCount: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, setValue } = useForm<StarSellerFormValues>({
    resolver: zodResolver(starSellerFormSchema),
    defaultValues,
  });

  function autofillRating() {
    if (autoRating.avgRating != null) {
      setValue("avg_review_rating", String(autoRating.avgRating));
    }
    setValue("low_review_count", String(autoRating.lowReviewCount));
    toast.success("Puan metrikleri yorum verisinden dolduruldu.");
  }

  function onSubmit(values: StarSellerFormValues) {
    startTransition(async () => {
      const res = await upsertStarSellerSnapshot(values, snapshotId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(snapshotId ? "Dönem güncellendi" : "Dönem kaydedildi");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dönem</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="period_label">Dönem etiketi</Label>
            <Input
              id="period_label"
              placeholder="örn. 1 May – 31 Tem 2026"
              {...register("period_label")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period_start">Başlangıç</Label>
            <Input id="period_start" type="date" {...register("period_start")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period_end">Bitiş</Label>
            <Input id="period_end" type="date" {...register("period_end")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="next_chance_on">Sonraki Star Seller şansı</Label>
            <Input
              id="next_chance_on"
              type="date"
              {...register("next_chance_on")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">Metrikler</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={autofillRating}>
            <Wand2 className="size-4" />
            Puanı yorumlardan doldur
          </Button>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="message_response_rate">Mesaj yanıt hızı (%)</Label>
            <Input
              id="message_response_rate"
              inputMode="decimal"
              placeholder="örn. 90"
              {...register("message_response_rate")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="on_time_shipping_rate">Zamanında kargo (%)</Label>
            <Input
              id="on_time_shipping_rate"
              inputMode="decimal"
              placeholder="örn. 98"
              {...register("on_time_shipping_rate")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avg_review_rating">Ortalama puan (0–5)</Label>
            <Input
              id="avg_review_rating"
              inputMode="decimal"
              placeholder="örn. 4.3"
              {...register("avg_review_rating")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="low_review_count">Düşük puan (≤3) sayısı</Label>
            <Input
              id="low_review_count"
              inputMode="numeric"
              placeholder="örn. 2"
              {...register("low_review_count")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="case_count">İtiraz sayısı</Label>
            <Input
              id="case_count"
              inputMode="numeric"
              placeholder="örn. 0"
              {...register("case_count")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order_count">Dönem sipariş sayısı</Label>
            <Input
              id="order_count"
              inputMode="numeric"
              placeholder="örn. 157"
              {...register("order_count")}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="note">Not</Label>
            <Textarea id="note" rows={2} {...register("note")} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : snapshotId ? "Dönemi Güncelle" : "Dönemi Kaydet"}
        </Button>
      </div>
    </form>
  );
}
