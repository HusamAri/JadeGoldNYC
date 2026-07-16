"use client";

import { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { taskFormSchema, type TaskFormValues } from "@/lib/validations/task";
import { createTask, updateTask } from "@/app/(dashboard)/gorevler/actions";
import { TASK_STATUSES, TASK_PRIORITIES, TASK_LANES } from "@/lib/constants";
import { TASK_COLORS, TASK_ICONS, taskIconUrl } from "@/lib/task-style";
import type { AssignableUser } from "@/lib/db/queries/tasks";
import { cn } from "@/lib/utils";
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

      {/* Görünüm & ilerleme: ikon (renk skalasıyla boyanır) + isimli renk + % */}
      <Card>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Renk (isimli skala)</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {TASK_COLORS.map((c) => {
                    const active = field.value === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        title={c.name}
                        onClick={() => field.onChange(active ? "" : c.key)}
                        className={cn(
                          "flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
                          active
                            ? "border-transparent text-white shadow-[var(--lift-sm)]"
                            : "border-border text-muted-foreground hover:border-foreground/40 hover:shadow-[var(--lift-sm)]",
                        )}
                        style={active ? { backgroundColor: c.ink } : undefined}
                      >
                        <span
                          className="inline-block size-3 rounded-full border border-white/50"
                          style={{ backgroundColor: c.ink }}
                        />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Görev ikonu</Label>
            <Controller
              control={control}
              name="icon"
              render={({ field: iconField }) => (
                <Controller
                  control={control}
                  name="color"
                  render={({ field: colorField }) => {
                    const ink =
                      TASK_COLORS.find((c) => c.key === colorField.value)?.ink ??
                      "oklch(0.45 0.05 285)";
                    return (
                      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
                        {TASK_ICONS.map((ic) => {
                          const active = iconField.value === ic.key;
                          return (
                            <button
                              key={ic.key}
                              type="button"
                              title={ic.label}
                              aria-pressed={active}
                              onClick={() =>
                                iconField.onChange(active ? "" : ic.key)
                              }
                              className={cn(
                                "nm-pressed flex aspect-square cursor-pointer items-center justify-center rounded-xl transition-all active:scale-90",
                                active
                                  ? // Seçim anında minik pop — icon-pop native scale anime eder
                                    "ring-ring/70 shadow-[var(--shadow-pressed),0_0_10px_var(--pit-glow)] ring-2 motion-safe:animate-[icon-pop_0.35s_var(--ease-premium)]"
                                  : "opacity-70 hover:scale-[1.08] hover:opacity-100",
                              )}
                            >
                              <span
                                aria-hidden
                                // Renk skalası değişince tüm ikonlar yumuşakça yeniden mürekkeplenir
                                className="inline-block size-6 transition-[background-color] duration-500"
                                style={{
                                  backgroundColor: ink,
                                  maskImage: `url(${taskIconUrl(ic.key)})`,
                                  maskSize: "contain",
                                  maskRepeat: "no-repeat",
                                  maskPosition: "center",
                                  WebkitMaskImage: `url(${taskIconUrl(ic.key)})`,
                                  WebkitMaskSize: "contain",
                                  WebkitMaskRepeat: "no-repeat",
                                  WebkitMaskPosition: "center",
                                }}
                              />
                              <span className="sr-only">{ic.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  }}
                />
              )}
            />
            <p className="text-muted-foreground text-xs">
              İkon, seçtiğin renk skalasındaki mürekkeple boyanır; zaman
              çizelgesi ve görev listelerinde görünür.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="progress">İlerleme (%) — süren görevlerde</Label>
            <Input
              id="progress"
              inputMode="numeric"
              placeholder="örn. 40"
              className="w-32"
              {...register("progress")}
            />
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
