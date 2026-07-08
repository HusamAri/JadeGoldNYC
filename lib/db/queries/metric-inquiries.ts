import { createClient } from "@/lib/supabase/server";

export type InquiryKind = "data" | "visual" | "opinion" | "vote";
export type InquiryStatus = "open" | "review" | "resolved";

export interface InquiryResponse {
  id: string;
  userId: string;
  authorName: string | null;
  body: string | null;
  option: string | null;
  createdAt: string;
}

export interface MetricInquiry {
  id: string;
  scenarioId: string | null;
  title: string;
  body: string | null;
  kind: InquiryKind;
  options: string[] | null;
  status: InquiryStatus;
  dataValue: string | null;
  createdAt: string;
  responses: InquiryResponse[];
  /** Çatallandıysa hedef playbook senaryosu + sonuç notu */
  branchedToScenario: string | null;
  branchNote: string | null;
}

type InquiryRow = {
  id: string;
  scenario_id: string | null;
  title: string;
  body: string | null;
  kind: InquiryKind;
  options: string[] | null;
  status: InquiryStatus;
  data_value: string | null;
  branched_to_scenario: string | null;
  branch_note: string | null;
  created_at: string;
  metric_inquiry_responses: {
    id: string;
    user_id: string;
    author_name: string | null;
    body: string | null;
    option: string | null;
    created_at: string;
  }[];
};

/** Org'daki tüm metrik soruları (yanıtlarıyla) + üye sayısı. */
export async function listMetricInquiries(orgId: string): Promise<{
  inquiries: MetricInquiry[];
  memberCount: number;
}> {
  const supabase = await createClient();
  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("metric_inquiries")
      .select(
        "id, scenario_id, title, body, kind, options, status, data_value, branched_to_scenario, branch_note, created_at, metric_inquiry_responses(id, user_id, author_name, body, option, created_at)",
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId),
  ]);

  const memberCount = count ?? 1;
  const inquiries = ((data ?? []) as unknown as InquiryRow[]).map((r) => ({
    id: r.id,
    scenarioId: r.scenario_id,
    title: r.title,
    body: r.body,
    kind: r.kind,
    options: r.options,
    status: r.status,
    dataValue: r.data_value,
    createdAt: r.created_at,
    responses: (r.metric_inquiry_responses ?? [])
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((x) => ({
        id: x.id,
        userId: x.user_id,
        authorName: x.author_name,
        body: x.body,
        option: x.option,
        createdAt: x.created_at,
      })),
    branchedToScenario: r.branched_to_scenario,
    branchNote: r.branch_note,
  }));

  return { inquiries, memberCount };
}
