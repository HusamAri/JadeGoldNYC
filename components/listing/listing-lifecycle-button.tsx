"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  archiveListing,
  restoreListing,
} from "@/app/(dashboard)/listing-onerileri/actions";
import { Button } from "@/components/ui/button";

/** Arşivle / arşivden çıkar — tek küçük buton (Etsy'ye dokunmaz, panel görünürlüğü). */
export function ListingLifecycleButton({
  id,
  mode,
}: {
  id: string;
  mode: "archive" | "restore";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const res =
        mode === "archive" ? await archiveListing(id) : await restoreListing(id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "archive" ? "Arşivlendi" : "Arşivden çıkarıldı");
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="icon" disabled={pending} onClick={run}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : mode === "archive" ? (
        <Archive className="size-4" />
      ) : (
        <ArchiveRestore className="size-4" />
      )}
      <span className="sr-only">
        {mode === "archive" ? "Arşivle" : "Arşivden çıkar"}
      </span>
    </Button>
  );
}
