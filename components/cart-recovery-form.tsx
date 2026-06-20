"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  cartRecoveryFormSchema,
  type CartRecoveryFormValues,
} from "@/lib/validations/cart-recovery";
import {
  createCartRecovery,
  updateCartRecovery,
} from "@/app/(dashboard)/sepet-kurtarma/actions";
import { CART_STATUSES } from "@/lib/constants";
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

export function CartRecoveryForm({
  mode,
  recoveryId,
  defaultValues,
}: {
  mode: "create" | "edit";
  recoveryId?: string;
  defaultValues: CartRecoveryFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, control } = useForm<CartRecoveryFormValues>({
    resolver: zodResolver(cartRecoveryFormSchema),
    defaultValues,
  });

  function onSubmit(values: CartRecoveryFormValues) {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createCartRecovery(values)
          : await updateCartRecovery(recoveryId!, values);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Sepet eklendi" : "Güncellendi");
      router.push("/sepet-kurtarma");
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
            <Label htmlFor="buyer_email">Alıcı E-posta</Label>
            <Input id="buyer_email" {...register("buyer_email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cart_value">Sepet Değeri</Label>
            <Input id="cart_value" inputMode="decimal" {...register("cart_value")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="abandoned_at">Terk Tarihi</Label>
            <Input id="abandoned_at" type="date" {...register("abandoned_at")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="item_summary">Ürünler (özet)</Label>
            <Input id="item_summary" {...register("item_summary")} />
          </div>
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
                    {CART_STATUSES.map((s) => (
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
            <Label htmlFor="incentive">Teşvik (örn. %10 kupon)</Label>
            <Input id="incentive" {...register("incentive")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recovered_value">Kazanılan Tutar</Label>
            <Input
              id="recovered_value"
              inputMode="decimal"
              {...register("recovered_value")}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="action_taken">Yapılan Aksiyon</Label>
            <Input id="action_taken" {...register("action_taken")} />
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
