"use server";

import { revalidatePath } from "next/cache";

import { requireMembership } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/queries/profile";
import type { InquiryKind } from "@/lib/db/queries/metric-inquiries";

const PATH = "/analizler/aksiyon-plani";

/** Ekibe yeni soru aç (görüş/oylama/görsel kontrol/veri isteği). */
export async function createInquiry(input: {
  title: string;
  body?: string;
  kind: InquiryKind;
  options?: string[];
  scenarioId?: string | null;
}): Promise<{ error?: string }> {
  const m = await requireMembership();
  const title = input.title.trim();
  if (!title) return { error: "Başlık gerekli." };
  if (!["data", "visual", "opinion", "vote"].includes(input.kind))
    return { error: "Geçersiz tür." };
  const options =
    input.kind === "vote"
      ? (input.options ?? []).map((o) => o.trim()).filter(Boolean)
      : null;
  if (input.kind === "vote" && (options?.length ?? 0) < 2)
    return { error: "Oylama için en az 2 seçenek girin." };

  const supabase = await createClient();
  const { error } = await supabase.from("metric_inquiries").insert({
    org_id: m.org_id,
    scenario_id: input.scenarioId ?? null,
    title,
    body: input.body?.trim() || null,
    kind: input.kind,
    options,
    created_by: m.user_id,
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/**
 * Soruya yanıt ver — ANLIK MOD: hiçbir türde tüm üyeler BEKLENMEZ.
 * İlk yanıt soruyu anında 'review'a çeker; sonraki yanıtlar/güncellemeler
 * incelemedeyken de anlık akmaya devam eder (kişi başına tek yanıt, upsert).
 * kind='data'da girilen değer data_value olarak saklanır (objektif veri).
 */
export async function respondInquiry(input: {
  inquiryId: string;
  body?: string;
  option?: string;
}): Promise<{ error?: string; movedToReview?: boolean }> {
  const m = await requireMembership();
  const body = input.body?.trim() || null;
  const option = input.option?.trim() || null;
  if (!body && !option) return { error: "Yanıt boş olamaz." };

  const supabase = await createClient();
  const { data: inq } = await supabase
    .from("metric_inquiries")
    .select("id, kind, status, options")
    .eq("org_id", m.org_id)
    .eq("id", input.inquiryId)
    .maybeSingle();
  const inquiry = inq as {
    id: string;
    kind: InquiryKind;
    status: string;
    options: string[] | null;
  } | null;
  if (!inquiry) return { error: "Soru bulunamadı." };
  if (inquiry.status === "resolved")
    return { error: "Bu soru kapatılmış." };
  if (inquiry.kind === "vote" && option && !inquiry.options?.includes(option))
    return { error: "Geçersiz seçenek." };

  const profile = await getProfile(supabase, m.user_id);

  const { error } = await supabase.from("metric_inquiry_responses").upsert(
    {
      inquiry_id: inquiry.id,
      org_id: m.org_id,
      user_id: m.user_id,
      author_name: profile?.full_name ?? null,
      body,
      option,
    },
    { onConflict: "inquiry_id,user_id" },
  );
  if (error) return { error: error.message };

  // ANLIK MOD: ilk yanıt soruyu hemen incelemeye çeker (üye beklenmez).
  // Veri türünde girilen değer data_value'ya yazılır; diğer türlerde de
  // sonradan gelen yanıtlar incelemedeyken akmaya devam eder.
  const movedToReview = inquiry.status === "open";
  await supabase
    .from("metric_inquiries")
    .update(
      inquiry.kind === "data"
        ? { status: "review", data_value: body ?? option }
        : { status: "review" },
    )
    .eq("org_id", m.org_id)
    .eq("id", inquiry.id)
    .eq("status", "open");

  revalidatePath(PATH);
  return { movedToReview };
}

/** İncelemedeki soruyu kapat (sonuç değerlendirmeye işlendi). */
export async function resolveInquiry(
  inquiryId: string,
): Promise<{ error?: string }> {
  const m = await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase
    .from("metric_inquiries")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("org_id", m.org_id)
    .eq("id", inquiryId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/**
 * ÇATALLANMA: incelemedeki yanıtlar farklı bir senaryoya işaret ediyorsa,
 * soru sonuç yorumları not edilerek o senaryoya çatallanır. Soru kapanır;
 * hedef senaryo panoda "ekip girdisiyle tetiklendi" olarak (yanıt özetiyle)
 * canlanır ve doğrulanmış aksiyonları göreve eklenebilir hâle gelir.
 */
export async function branchInquiry(input: {
  inquiryId: string;
  scenarioId: string;
  note: string;
}): Promise<{ error?: string }> {
  const m = await requireMembership();
  const note = input.note.trim();
  if (!input.scenarioId) return { error: "Hedef senaryo seçin." };
  if (!note) return { error: "Sonuç notu gerekli (yanıtların özeti)." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("metric_inquiries")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      branched_to_scenario: input.scenarioId,
      branch_note: note.slice(0, 2000),
    })
    .eq("org_id", m.org_id)
    .eq("id", input.inquiryId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return {};
}

/**
 * Önerilen playbook aksiyonunu Görevler panosuna ekler. Görev açıklamasına
 * senaryo bağlamı ve doğrulama kaynağı yazılır (şirket hafızası).
 */
export async function addActionAsTask(input: {
  title: string;
  detail: string;
  source: string;
  priority: "P0" | "P1" | "P2" | "P3";
  scenarioTitle: string;
}): Promise<{ error?: string }> {
  const m = await requireMembership();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    org_id: m.org_id,
    title: input.title.slice(0, 200),
    description: `${input.detail}\n\nSenaryo: ${input.scenarioTitle}\nKaynak: ${input.source} (Aksiyon Planı)`.slice(
      0,
      2000,
    ),
    status: "todo",
    priority: input.priority,
    created_by: m.user_id,
  });
  if (error) return { error: error.message };
  revalidatePath(PATH);
  revalidatePath("/gorevler");
  return {};
}
