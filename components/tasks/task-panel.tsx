"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import {
  moveTask,
  assignTask,
  addTaskNote,
  deleteTaskNote,
} from "@/app/(dashboard)/gorevler/actions";
import { TASK_STATUSES } from "@/lib/constants";
import type { TaskWithAssignee, TaskNote } from "@/lib/types";
import type { AssignableUser } from "@/lib/db/queries/tasks";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "__none__";

export function TaskPanel({
  task,
  notes,
  members,
}: {
  task: TaskWithAssignee;
  notes: TaskNote[];
  members: AssignableUser[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");

  function run(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function submitNote(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    startTransition(async () => {
      const res = await addTaskNote(task.id, text);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setBody("");
      toast.success("Not eklendi");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-6">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Durum
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TASK_STATUSES.map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={task.status === s.value ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => run(() => moveTask(task.id, s.value))}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Atanan
            </p>
            <Select
              value={task.assignee_id ?? NONE}
              onValueChange={(v) =>
                run(() => assignTask(task.id, v === NONE ? null : v))
              }
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Atanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Atanmamış</SelectItem>
                {members.map((u) => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.full_name || "İsimsiz üye"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={submitNote} className="space-y-2">
            <Label htmlFor="note">Yeni not</Label>
            <Textarea
              id="note"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="İlerleme, karar veya çözüm notu…"
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={pending || !body.trim()}>
                Not ekle
              </Button>
            </div>
          </form>

          {notes.length === 0 ? (
            <p className="text-muted-foreground text-sm">Henüz not yok.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className="nm-raised-sm rounded-2xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {n.author_label ?? "Üye"}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-2 text-xs">
                      {formatDateTime(n.created_at, "d MMM HH:mm")}
                      <button
                        type="button"
                        onClick={() =>
                          run(() => deleteTaskNote(n.id, task.id))
                        }
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Notu sil"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </div>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
