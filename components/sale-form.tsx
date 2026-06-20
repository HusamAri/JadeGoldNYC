"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { saleFormSchema, type SaleFormValues } from "@/lib/validations/sale";
import { createSale, updateSale } from "@/app/(dashboard)/satislar/actions";
import { SALE_STATUSES } from "@/lib/constants";
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

export function SaleForm({
  mode,
  saleId,
  defaultValues,
}: {
  mode: "create" | "edit";
  saleId?: string;
  defaultValues: SaleFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues,
  });

  function onSubmit(values: SaleFormValues) {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createSale(values)
          : await updateSale(saleId!, values);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Satış eklendi" : "Satış güncellendi");
      router.push(
        mode === "create" ? "/satislar" : `/satislar/${res?.id ?? saleId}`,
      );
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="order_no">Sipariş No</Label>
            <Input id="order_no" {...register("order_no")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Durum</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_STATUSES.map((s) => (
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
            <Label htmlFor="order_date">Sipariş Tarihi</Label>
            <Input id="order_date" type="date" {...register("order_date")} />
            {errors.order_date && (
              <p className="text-destructive text-sm">
                {errors.order_date.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Para Birimi</Label>
            <Input id="currency" maxLength={3} {...register("currency")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer_name">Alıcı Adı</Label>
            <Input id="buyer_name" {...register("buyer_name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyer_email">Alıcı E-posta</Label>
            <Input id="buyer_email" {...register("buyer_email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ship_country">Teslimat Ülkesi</Label>
            <Input id="ship_country" {...register("ship_country")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="item_total">Ürün Toplamı</Label>
            <Input id="item_total" inputMode="decimal" {...register("item_total")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping">Kargo</Label>
            <Input id="shipping" inputMode="decimal" {...register("shipping")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax">Vergi</Label>
            <Input id="tax" inputMode="decimal" {...register("tax")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount">İndirim</Label>
            <Input id="discount" inputMode="decimal" {...register("discount")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="etsy_fees">Etsy Ücretleri</Label>
            <Input id="etsy_fees" inputMode="decimal" {...register("etsy_fees")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grand_total">Genel Toplam</Label>
            <Input
              id="grand_total"
              inputMode="decimal"
              placeholder="Boşsa otomatik hesaplanır"
              {...register("grand_total")}
            />
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
