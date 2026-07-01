import { notFound } from "next/navigation";

import { getTask, listAssignableUsers } from "@/lib/db/queries/tasks";
import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/task-form";
import type { TaskFormValues } from "@/lib/validations/task";

export const metadata = { title: "Görevi Düzenle" };

export default async function GorevDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, members] = await Promise.all([
    getTask(id),
    listAssignableUsers(),
  ]);
  if (!task) notFound();

  const defaultValues: TaskFormValues = {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    lane: task.lane ?? "",
    assignee_id: task.assignee_id ?? "",
    effort: task.effort ?? "",
    due_date: task.due_date ?? "",
    notes: task.notes ?? "",
  };

  return (
    <div>
      <PageHeader title="Görevi Düzenle" description={task.title} />
      <TaskForm
        mode="edit"
        taskId={task.id}
        defaultValues={defaultValues}
        members={members}
      />
    </div>
  );
}
