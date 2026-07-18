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
import { TASK_COLOR_BY_KEY, taskIconUrl } from "@/lib/task-style";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { TaskPriorityBadge } from "@/components/task-priority-badge";
import { TaskStatusBadge } from "@/components/task-status-badge";
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

  const jewel = task.color ? TASK_COLOR_BY_KEY.get(task.color) : null;
  const ink = jewel?.ink ?? "var(--gold-deep)";
  const progress =
    typeof task.progress === "number"
      ? Math.max(0, Math.min(100, task.progress))
      : null;

  return (
    <div className="relative z-0 max-w-3xl space-y-8">
      <GoldStream motif="check" />
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
          <div className="flex items-start gap-3">
            {/* Görevin kendi mücevher ikonu + rengi (maske ile boyanır). */}
            {task.icon && (
              <span
                aria-hidden
                className="mt-0.5 size-9 shrink-0 rounded-lg"
                style={{
                  backgroundColor: ink,
                  maskImage: `url(${taskIconUrl(task.icon)})`,
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  maskSize: "contain",
                  WebkitMaskImage: `url(${taskIconUrl(task.icon)})`,
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  WebkitMaskSize: "contain",
                }}
              />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
              {task.lane && (
                <Badge variant="secondary">{TASK_LANE_LABELS[task.lane]}</Badge>
              )}
            </div>
          </div>

          {progress !== null && (
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span className="tracking-wide uppercase">İlerleme</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{ width: `${progress}%`, backgroundColor: ink }}
                />
              </div>
            </div>
          )}

          {task.description && (
            <p className="text-sm whitespace-pre-wrap">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-3">
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
