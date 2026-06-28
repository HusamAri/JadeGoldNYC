"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { runRetroactiveGoldCosts } from "./actions";

export function RetroactiveButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await runRetroactiveGoldCosts();
      if (result.error) {
        setMessage(`Hata: ${result.error}`);
      } else if (result.processed === 0) {
        setMessage("Islenecek yeni satis bulunamadi.");
      } else {
        setMessage(
          `${result.processed} kalem islendi${result.skipped ? `, ${result.skipped} atlandi` : ""}.`,
        );
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-muted-foreground text-sm">{message}</span>
      )}
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={isPending}
      >
        <RefreshCw className={isPending ? "animate-spin" : ""} />
        {isPending ? "Hesaplaniyor..." : "Geriye Donuk Hesapla"}
      </Button>
    </div>
  );
}
