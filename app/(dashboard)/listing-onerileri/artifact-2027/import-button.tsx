"use client";
import { useState, useTransition } from "react";
import { importArtifact2027 } from "./actions";
import { Button } from "@/components/ui/button";
export function ImportButton() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return <div className="space-y-3"><Button disabled={pending} onClick={() => start(async () => {
    const result = await importArtifact2027(); setMessage(result.message);
  })}>{pending ? "Kaydediliyor…" : "20 öneriyi kaydet ve doğrula"}</Button><p role="status">{message}</p></div>;
}
