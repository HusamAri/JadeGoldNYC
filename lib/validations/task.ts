import { z } from "zod";

export const taskStatusEnum = z.enum(["todo", "doing", "done"]);
export const taskPriorityEnum = z.enum(["P0", "P1", "P2", "P3"]);
/** Şerit; boş string = atanmamış (action'da null'a çevrilir). */
export const taskLaneField = z.enum(["A", "B", "owner", ""]);

/** Görev formu. assignee_id boş = atanmamış; due_date boş = tarihsiz. */
export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Başlık gerekli").max(200),
  description: z.string().trim().max(2000),
  status: taskStatusEnum,
  priority: taskPriorityEnum,
  lane: taskLaneField,
  assignee_id: z.string().trim().max(64),
  effort: z.string().trim().max(80),
  due_date: z.string().trim().max(20),
  notes: z.string().trim().max(2000),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

/** Göreve eklenen tekil not (iş birliği akışı). */
export const taskNoteSchema = z.object({
  body: z.string().trim().min(1, "Not boş olamaz").max(2000),
});

export type TaskNoteValues = z.infer<typeof taskNoteSchema>;

/** Devir: görevi başka bir üyeye atarken zorunlu tamamlanma notu. */
export const taskHandoverSchema = z.object({
  to_user_id: z.string().trim().min(1, "Devredilecek üye seçin"),
  body: z.string().trim().min(1, "Tamamlanan bölüm için bir not gerekli").max(2000),
});

export type TaskHandoverValues = z.infer<typeof taskHandoverSchema>;

/** Hızlı Kanban aksiyonları için durum doğrulaması. */
export const taskStatusSchema = taskStatusEnum;
