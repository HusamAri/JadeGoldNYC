"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireMembership } from "@/lib/auth";

/**
 * ÇÖZÜLEN UYARI → TAMAMLANMIŞ GÖREV izi.
 *
 * Uyarı Merkezi (getAlertCenter) her yüklendiğinde o an AÇIK olan uyarıların
 * sabit `key`leri `alert_state`'e yazılır. Daha önce görülmüş bir key ARTIK
 * gelmiyorsa (düzeltilip kaybolmuş) → o uyarı çözülmüş demektir; Görevler'e
 * TAMAMLANMIŞ bir görev ("Çözüldü: <başlık>") düşülür ve izleme satırı silinir.
 * Böylece "şu sorun şu tarihte çözüldü" izi görev geçmişinde kalıcı olur.
 *
 * İlk kez görülen uyarı görev ÜRETMEZ (yalnız kaydeder); yalnız KAYBOLAN üretir.
 * Silme sayesinde idempotent: aynı çözülme iki kez görev doğurmaz; uyarı
 * yeniden belirirse yeniden izlenir. Tüm sorgular org_id kilitli (RLS + eq).
 */

export interface CurrentAlert {
  key: string;
  title: string;
  severity: string;
}

/** Uyarı önem derecesi → görev önceliği (tasks CHECK: P0..P3). */
const SEVERITY_TO_PRIORITY: Record<string, string> = {
  kritik: "P0",
  onemli: "P1",
  bilgi: "P2",
};

/** Mağaza saat dilimindeki (NYC) gün (YYYY-MM-DD) — due_date'ler o takvimde. */
function nycDay(iso?: string): string {
  return (iso ? new Date(iso) : new Date()).toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

export async function reconcileAlertResolutions(
  current: CurrentAlert[],
): Promise<void> {
  const m = await requireMembership();
  const supabase = await createClient();
  const orgId = m.org_id;

  const nowIso = new Date().toISOString();
  const currentKeys = new Set(current.map((a) => a.key));

  // a) O an açık olan uyarıları alert_state'e upsert et (last_seen_at tazele).
  //    first_seen_at payload'da YOK → yalnız insert'te default now() alır,
  //    çakışmada dokunulmaz (ilk görülme korunur).
  if (current.length > 0) {
    const rows = current.map((a) => ({
      org_id: orgId,
      alert_key: a.key,
      title: a.title,
      severity: a.severity,
      last_seen_at: nowIso,
    }));
    const { error } = await supabase
      .from("alert_state")
      .upsert(rows, { onConflict: "org_id,alert_key" });
    if (error) console.error("[alert-resolution] upsert:", error.message);
  }

  // b) Org'un tüm izleme satırları — current sette OLMAYAN key'ler çözülmüştür.
  const { data: stored, error: fetchErr } = await supabase
    .from("alert_state")
    .select("id, alert_key, title, severity, first_seen_at")
    .eq("org_id", orgId);
  if (fetchErr) {
    console.error("[alert-resolution] fetch:", fetchErr.message);
    return;
  }
  const resolved = ((stored ?? []) as {
    id: string;
    alert_key: string;
    title: string | null;
    severity: string | null;
    first_seen_at: string;
  }[]).filter((r) => !currentKeys.has(r.alert_key));
  if (resolved.length === 0) return;

  // c) Her çözülen uyarı için TAMAMLANMIŞ görev ekle (status='done', progress=100).
  //    Tamamlanan görevin bitiş günü = termin (toRow konvansiyonu): done'da
  //    due_date = bugün (NYC). Görev insert'i zaten audit trigger'lı (0035) —
  //    ayrı logAudit gerekmez.
  const today = nycDay();
  const taskRows = resolved.map((r) => {
    const title = r.title ?? r.alert_key;
    const firstDay = nycDay(r.first_seen_at);
    return {
      org_id: orgId,
      title: `Çözüldü: ${title}`,
      description:
        `Uyarı otomatik çözüldü · ${title}\n` +
        `İlk görülme: ${firstDay} · Çözülme: ${today}`,
      status: "done",
      priority: SEVERITY_TO_PRIORITY[r.severity ?? ""] ?? "P2",
      progress: 100,
      due_date: today,
      created_by: null,
      icon: "checklist",
      color: "zumrut",
    };
  });
  const { error: insErr } = await supabase.from("tasks").insert(taskRows);
  if (insErr) {
    // Görev yazılamadıysa izleme satırını SİLME — bir sonraki yüklemede
    // yeniden denenir (çözülme kaydı boşa düşmesin).
    console.error("[alert-resolution] task insert:", insErr.message);
    return;
  }

  // d) İzleme satırlarını sil — idempotens: aynı çözülme tekrar görev üretmez.
  const { error: delErr } = await supabase
    .from("alert_state")
    .delete()
    .eq("org_id", orgId)
    .in(
      "id",
      resolved.map((r) => r.id),
    );
  if (delErr) console.error("[alert-resolution] delete:", delErr.message);

  revalidatePath("/gorevler");
}
