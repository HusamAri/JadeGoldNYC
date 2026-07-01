"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ListPlus } from "lucide-react";
import { toast } from "sonner";

import { createTask } from "@/app/(dashboard)/gorevler/actions";
import { Button } from "@/components/ui/button";
import type { EtsyUpdateTask } from "@/lib/etsy-updates";

export function AddTaskButton({ task }: { task: EtsyUpdateTask }) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  function onClick() {
    startTransition(async () => {
      const res = await createTask({
        title: task.title,
        description: task.description,
        status: "todo",
        priority: task.priority,
        lane: task.lane ?? "",
        assignee_id: "",
        effort: task.effort,
        due_date: "",
        notes: "",
      });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setAdded(true);
      toast.success("Göreve eklendi");
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={added ? "secondary" : "outline"}
      disabled={pending || added}
      onClick={onClick}
    >
      {added ? <CheckCircle2 className="size-4" /> : <ListPlus className="size-4" />}
      {added ? "Göreve eklendi" : "Görev olarak ekle"}
    </Button>
  );
}
