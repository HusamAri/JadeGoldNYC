import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/task-form";
import { listAssignableUsers } from "@/lib/db/queries/tasks";
import type { TaskFormValues } from "@/lib/validations/task";

export const metadata = { title: "Yeni Görev" };

export default async function YeniGorevPage() {
  const members = await listAssignableUsers();
  const defaultValues: TaskFormValues = {
    title: "",
    description: "",
    status: "todo",
    priority: "P1",
    lane: "",
    assignee_id: "",
    effort: "",
    due_date: "",
    notes: "",
  };

  return (
    <div>
      <PageHeader
        title="Yeni Görev"
        description="Bir işi göreve dönüştürün ve bir kişiye atayın"
      />
      <TaskForm mode="create" defaultValues={defaultValues} members={members} />
    </div>
  );
}
