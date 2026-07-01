"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, ArrowRightLeft } from "lucide-react";

import {
  moveTask,
  assignTask,
  handoverTask,
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
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { LiquidTabs } from "@/components/tasks/liquid-tabs";
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
  const [handoverTo, setHandoverTo] = useState("");
  const [handoverNote, setHandoverNote] = useState("");

  const handoverCandidates = members.filter(
    (u) => u.user_id !== task.assignee_id,
  );
  const memberByUserId = new Map(members.map((u) => [u.user_id, u]));

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

  function submitHandover(e: React.FormEvent) {
    e.preventDefault();
    const text = handoverNote.trim();
    if (!handoverTo || !text) return;
    startTransition(async () => {
      const res = await handoverTask(task.id, handoverTo, text);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setHandoverTo("");
      setHandoverNote("");
      toast.success("Görev devredildi");
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
            <LiquidTabs
              items={TASK_STATUSES}
              value={task.status}
              onChange={(s) => run(() => moveTask(task.id, s))}
              indicatorClassName="bg-primary"
              activeTextClassName="text-primary-foreground"
              disabled={pending}
            />
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
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="size-4" />
            Görevi Devret
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Kendi bölümünüzü tamamladığınızda, ne yaptığınızı not düşerek
            görevi bir sonraki kişiye devredin.
          </p>
          <form onSubmit={submitHandover} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="handover-to">Kime</Label>
              <Select value={handoverTo} onValueChange={setHandoverTo}>
                <SelectTrigger id="handover-to" className="w-full sm:w-72">
                  <SelectValue placeholder="Üye seçin" />
                </SelectTrigger>
                <SelectContent>
                  {handoverCandidates.length === 0 ? (
                    <div className="text-muted-foreground px-2 py-1.5 text-sm">
                      Devredilecek başka üye yok
                    </div>
                  ) : (
                    handoverCandidates.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.full_name || "İsimsiz üye"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="handover-note">Tamamlanan bölüm / not</Label>
              <Textarea
                id="handover-note"
                rows={2}
                value={handoverNote}
                onChange={(e) => setHandoverNote(e.target.value)}
                placeholder="Ne tamamladınız, sıradaki kişi ne bilmeli?"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={pending || !handoverTo || !handoverNote.trim()}
              >
                Devret
              </Button>
            </div>
          </form>
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
            <ul className="space-y-4">
              {notes.map((n) => {
                const author = n.author_id
                  ? memberByUserId.get(n.author_id)
                  : undefined;
                return (
                  <li key={n.id} className="flex items-start gap-3">
                    <UserAvatar
                      src={author?.avatar_url}
                      name={author?.full_name ?? n.author_label}
                      className="size-12 shrink-0"
                    />
                    <div className="nm-raised-sm min-w-0 flex-1 rounded-2xl rounded-tl-sm p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {n.author_label ?? "Üye"}
                          {n.kind === "handover" && (
                            <Badge variant="warning" className="gap-1">
                              <ArrowRightLeft className="size-3" />
                              Devir
                            </Badge>
                          )}
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
                      <p className="mt-1 text-sm whitespace-pre-wrap">
                        {n.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
