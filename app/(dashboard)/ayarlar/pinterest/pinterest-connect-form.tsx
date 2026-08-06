"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PinterestConnectForm({
  configured,
  connected,
}: {
  configured: boolean;
  connected: boolean;
}) {
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!configured) return;
        window.location.href = "/api/pinterest/connect";
      }}
    >
      <Button type="submit" disabled={!configured}>
        <ExternalLink className="size-4" />
        {connected ? "Yeniden bağlan" : "Pinterest'e bağlan"}
      </Button>
      {connected && (
        <span className="text-muted-foreground text-xs">
          Yeniden bağlanmak mevcut izni tazeler; pano/pin verisi kaybolmaz.
        </span>
      )}
    </form>
  );
}
