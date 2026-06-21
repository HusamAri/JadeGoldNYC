"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  reviewFormSchema,
  type ReviewFormValues,
} from "@/lib/validations/review";
import { createReview, updateReview } from "@/app/(dashboard)/yorumlar/actions";
import { REVIEW_STATUSES } from "@/lib/constants";
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

export function ReviewForm({
  mode,
  reviewId,
  defaultValues,
}: {
  mode: "create" | "edit";
  reviewId?: string;
  defaultValues: ReviewFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, control } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues,
  });

  function onSubmit(values: ReviewFormValues) {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createReview(values)
          : await updateReview(reviewId!, values);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Yorum eklendi" : "Güncellendi");
      router.push("/yorumlar");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="buyer_name">Alıcı Adı</Label>
            <Input id="buyer_name" {...register("buyer_name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Puan (1–5)</Label>
            <Input
              id="rating"
              type="number"
              min={1}
              max={5}
              step={1}
              inputMode="numeric"
              placeholder="örn. 5"
              {...register("rating")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review_date">Yorum Tarihi</Label>
            <Input id="review_date" type="date" {...register("review_date")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">Dil (örn. tr, en)</Label>
            <Input id="language" {...register("language")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <Label htmlFor="review_text">Yorum Metni</Label>
          <Textarea id="review_text" rows={4} {...register("review_text")} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
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
                    {REVIEW_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="internal_note">İç Not (yalnız ekip görür)</Label>
            <Textarea id="internal_note" rows={3} {...register("internal_note")} />
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
