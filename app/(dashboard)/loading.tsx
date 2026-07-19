import { FrostOverlayStatic } from "@/components/layout/frost-overlay";

/**
 * Dashboard route geçişleri — buzlu örtü + Amuletta mark motion.
 */
export default function DashboardLoading() {
  return <FrostOverlayStatic mode="loading" label="Panel yükleniyor…" />;
}
