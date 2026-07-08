import Link from "next/link";
import { ArrowLeft, BookOpenCheck } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { listMetrics } from "@/lib/db/queries/metrics";
import {
  listProductMetrics,
  listProductPeriods,
} from "@/lib/db/queries/product-metrics";
import { listMetricInquiries } from "@/lib/db/queries/metric-inquiries";
import { getEtsyInsights } from "@/lib/db/queries/etsy-insights";
import {
  evaluatePlaybook,
  collectRecentBranches,
} from "@/lib/metrics-playbook/evaluate";
import { PLAYBOOK_SOURCES } from "@/lib/metrics-playbook/playbook";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ScenarioBoard } from "@/components/action-plan/scenario-board";
import { InquiryBoard } from "@/components/action-plan/inquiry-board";

export const metadata = { title: "Aksiyon Planı" };

export default async function AksiyonPlaniPage() {
  const m = await requireMembership();

  const [metrics, periods, inquiryData, insights] = await Promise.all([
    listMetrics(),
    listProductPeriods(),
    listMetricInquiries(m.org_id),
    getEtsyInsights(m.org_id),
  ]);
  const latestPeriod = periods[0];
  const productMetrics = latestPeriod
    ? await listProductMetrics(latestPeriod)
    : [];

  // Son 30 günde çatallanan sorular: hedef senaryoyu (sonuç notlarıyla) tetikler
  const branches = collectRecentBranches(inquiryData.inquiries);

  const results = evaluatePlaybook({
    metrics,
    productMetrics,
    shopSnapshots: insights.snapshots,
    branches,
  });
  const triggered = results.filter((r) => r.status === "triggered").length;
  const noData = results.filter((r) => r.status === "no-data").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metrik Aksiyon Planı"
        description={`Etsy verilerin araştırmayla doğrulanmış senaryo matrisine göre değerlendirildi: ${triggered} senaryo tetiklendi · ${noData} senaryo veri bekliyor. Eksik/öznel bilgiler ekibe sorulur — yanıtlar ANLIK işlenir (ilk yanıt soruyu incelemeye çeker, kimse beklenmez); yanıtlar farklı bir senaryoya işaret ederse sonuç notlarıyla o senaryoya çatallanır. Önerilen her aksiyon tek tuşla Görevler'e eklenir.`}
        action={
          <Button asChild variant="outline">
            <Link href="/analizler">
              <ArrowLeft />
              Performans
            </Link>
          </Button>
        }
      />

      <ScenarioBoard results={results} />

      <InquiryBoard
        inquiries={inquiryData.inquiries}
        memberCount={inquiryData.memberCount}
        currentUserId={m.user_id}
      />

      <footer className="text-muted-foreground border-t pt-4 text-xs">
        <p className="mb-1.5 flex items-center gap-1.5 font-semibold">
          <BookOpenCheck className="size-3.5" />
          Aksiyonların doğrulama kaynakları
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {PLAYBOOK_SOURCES.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground underline underline-offset-2"
              >
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
