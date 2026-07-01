"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { taskFormSchema, type TaskFormValues } from "@/lib/validations/task";
import { createTask, updateTask } from "@/app/(dashboard)/gorevler/actions";
import { TASK_STATUSES, TASK_PRIORITIES, TASK_LANES } from "@/lib/constants";
import type { AssignableUser } from "@/lib/db/queries/tasks";
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

function memberLabel(u: AssignableUser): string {
  return u.full_name || "İsimsiz üye";
}

export function TaskForm({
  mode,
  taskId,
  defaultValues,
  members,
}: {
  mode: "create" | "edit";
  taskId?: string;
  defaultValues: TaskFormValues;
  members: AssignableUser[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, control } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues,
  });

  function onSubmit(values: TaskFormValues) {
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createTask(values)
          : await updateTask(taskId!, values);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Görev eklendi" : "Görev güncellendi");
      router.push(
        mode === "create" ? "/gorevler" : `/gorevler/${taskId}`,
      );
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" {...register("title")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="priority">Öncelik</Label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue placeholder="Öncelik" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
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
                    {TASK_STATUSES.map((s) => (
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
            <Label htmlFor="lane">Şerit</Label>
            <Controller
              control={control}
              name="lane"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value : NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <SelectTrigger id="lane" className="w-full">
                    <SelectValue placeholder="Şerit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Yok</SelectItem>
                    {TASK_LANES.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignee_id">Atanan</Label>
            <Controller
              control={control}
              name="assignee_id"
              render={({ field }) => (
                <Select
                  value={field.value ? field.value : NONE}
                  onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                >
                  <SelectTrigger id="assignee_id" className="w-full">
                    <SelectValue placeholder="Atanan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Atanmamış</SelectItem>
                    {members.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {memberLabel(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="effort">Efor</Label>
            <Input id="effort" placeholder="örn. ½ gün" {...register("effort")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">Termin</Label>
            <Input id="due_date" type="date" {...register("due_date")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          <Label htmlFor="notes">Not (özet)</Label>
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
