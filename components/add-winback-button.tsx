"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
  addWinbackToTracking,
  type WinbackCandidateInput,
} from "@/app/(dashboard)/sepet-kurtarma/actions";
import { Button } from "@/components/ui/button";

export function AddWinbackButton({
  candidate,
}: {
  candidate: WinbackCandidateInput;
}) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const router = useRouter();

  function onClick() {
    startTransition(async () => {
      const res = await addWinbackToTracking(candidate);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setAdded(true);
      toast.success("Takibe alındı");
      router.refresh();
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
      {added ? <CheckCircle2 className="size-4" /> : <UserPlus className="size-4" />}
      {added ? "Takipte" : "Takibe Al"}
    </Button>
  );
}
