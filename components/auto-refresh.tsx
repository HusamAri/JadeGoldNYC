"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Sayfa verisini belirli aralıkla yeniler ("canlı" izleme hissi). */
export function AutoRefresh({ intervalMs = 60000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
