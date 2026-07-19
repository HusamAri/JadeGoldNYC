import { CalendarDays, Clapperboard, CircleCheck, Sparkles } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import {
  getSocialSummary,
  listSocialPosts,
} from "@/lib/db/queries/social";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { SocialCalendar } from "@/components/social/social-calendar";

export const metadata = { title: "Sosyal Medya" };

/**
 * Sosyal içerik takvimi — tüm şirketlerde aynı özellik.
 * İçerik org_id ile ayrılır: EON publishing calendar seed'li gelir;
 * Jade (ve diğerleri) boş takvim + içerik ekle ile başlar.
 */
export default async function SosyalPage() {
  const m = await requireMembership();
  const [posts, summary] = await Promise.all([
    listSocialPosts(m.org_id),
    getSocialSummary(m.org_id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sosyal Medya"
        eyebrow="İçerik takvimi"
        description="Instagram / TikTok planı — caption, hashtag, asset notu. Markaya özel içerik; panel özelliği ortak."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Toplam"
          value={String(summary.total)}
          icon={Clapperboard}
        />
        <KpiCard
          label="Plan / fikir"
          value={String(summary.planned)}
          icon={Sparkles}
        />
        <KpiCard
          label="7 gün içinde"
          value={String(summary.upcoming7d)}
          icon={CalendarDays}
        />
        <KpiCard
          label="Yayında"
          value={String(summary.published)}
          icon={CircleCheck}
        />
      </div>

      <SocialCalendar posts={posts} />
    </div>
  );
}
