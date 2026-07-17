"use client";

import { useEffect, useRef } from "react";

import { reconcileAlertResolutions } from "@/app/(dashboard)/panel/alert-resolution-actions";
import type { Alert } from "@/lib/db/queries/alerts";

/**
 * ÇÖZÜLEN UYARI İZLEYİCİSİ — görsel çıktı YOK, yalnız yan etki.
 *
 * Panel'de Uyarı Merkezi render edilirken mount olur ve o an açık uyarıların
 * key'lerini sunucuya bildirir; sunucu kaybolan (çözülmüş) uyarıları Görevler'e
 * TAMAMLANMIŞ görev olarak yazar (alert-resolution-actions). Mount başına BİR
 * kez çağrılır — StrictMode'un çift-mount'una karşı ref guard. Hata olursa
 * sessiz (yalnız konsola) — kullanıcıyı rahatsız etme.
 */
export function AlertResolutionTracker({ alerts }: { alerts: Alert[] }) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void reconcileAlertResolutions(
      alerts.map((a) => ({ key: a.key, title: a.title, severity: a.severity })),
    ).catch((e) => console.error("[alert-resolution] tracker:", e));
  }, [alerts]);

  return null;
}
