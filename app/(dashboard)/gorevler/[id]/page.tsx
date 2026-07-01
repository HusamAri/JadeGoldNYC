import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import {
  getTask,
  listTaskNotes,
  listAssignableUsers,
} from "@/lib/db/queries/tasks";
import { TASK_PRIORITY_LABELS, TASK_LANE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { TaskPriorityBadge } from "@/components/task-priority-badge";
import { TaskPanel } from "@/components/tasks/task-panel";
import { DeleteButton } from "@/components/data-table/delete-button";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteTask } from "../actions";

export const metadata = { title: "Görev" };

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className="font-medium">{children}</div>
    </div>
  );
}

export default async function GorevDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [task, notes, members] = await Promise.all([
    getTask(id),
    listTaskNotes(id),
    listAssignableUsers(),
  ]);
  if (!task) notFound();

  const assigneeName = task.assignee
    ? task.assignee.full_name || "İsimsiz üye"
    : "Atanmamış";

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={task.title}
        description={TASK_PRIORITY_LABELS[task.priority]}
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/gorevler/${task.id}/duzenle`}>
                <Pencil />
                Düzenle
              </Link>
            </Button>
            <DeleteButton
              action={deleteTask}
              id={task.id}
              redirectTo="/gorevler"
              variant="button"
              title="Görevi sil"
            />
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <TaskPriorityBadge priority={task.priority} />
            {task.lane && (
              <Badge variant="secondary">{TASK_LANE_LABELS[task.lane]}</Badge>
            )}
          </div>

          {task.description && (
            <p className="text-sm whitespace-pre-wrap">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Meta label="Atanan">
              <span className="flex items-center gap-2">
                {task.assignee && (
                  <UserAvatar
                    src={task.assignee.avatar_url}
                    name={task.assignee.full_name}
                    className="size-6"
                  />
                )}
                {assigneeName}
              </span>
            </Meta>
            <Meta label="Efor">{task.effort ?? "—"}</Meta>
            <Meta label="Termin">
              {task.due_date ? formatDate(task.due_date) : "—"}
            </Meta>
          </div>

          {task.notes && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Özet not
              </p>
              <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <TaskPanel task={task} notes={notes} members={members} />
    </div>
  );
}
