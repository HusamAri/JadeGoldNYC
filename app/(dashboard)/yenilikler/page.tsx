import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { whatsNewByCategory, type WhatsNewCategory } from "@/lib/whats-new";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { GoldStream } from "@/components/brand/gold-stream";
import { NewStar } from "@/components/whats-new-badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Neler Yeni" };

const SECTIONS: {
  key: WhatsNewCategory;
  title: string;
  desc: string;
}[] = [
  {
    key: "feature",
    title: "Yeni Özellikler",
    desc: "Panele eklenen yeni yetenekler",
  },
  {
    key: "ux",
    title: "Kullanıcı Deneyimi İyileştirmeleri",
    desc: "Arayüz, akış ve kullanım iyileştirmeleri",
  },
];

export default function YeniliklerPage() {
  return (
    <div className="relative z-0 max-w-3xl space-y-8 pb-28">
      <GoldStream motif="star" />
      <PageHeader
        title="Neler Yeni"
        description="Panelde şimdiye dek yaptığımız tüm iyileştirmeler ve yeni özellikler"
      />

      {SECTIONS.map((s) => {
        const items = whatsNewByCategory(s.key);
        if (items.length === 0) return null;
        return (
          <section key={s.key} className="space-y-3">
            <div>
              <h2 className="font-serif text-xl leading-tight">{s.title}</h2>
              <p className="text-muted-foreground text-sm">{s.desc}</p>
            </div>
            <div className="space-y-3">
              {items.map((e) => {
                const Icon = e.icon;
                return (
                  <Card key={e.id}>
                    <CardContent className="flex gap-4">
                      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[oklch(0.62_0.09_86)]/15 text-[oklch(0.5_0.09_86)] ring-1 ring-[oklch(0.62_0.09_86)]/20 dark:text-[oklch(0.82_0.11_86)]">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{e.title}</h3>
                          {e.isNew && <NewStar />}
                          <span className="text-muted-foreground ml-auto shrink-0 text-xs tabular-nums">
                            {formatDate(e.date)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {e.description}
                        </p>
                        {e.href && (
                          <Link
                            href={e.href}
                            className="text-primary mt-2 inline-flex items-center gap-0.5 text-xs font-medium hover:underline"
                          >
                            Aç
                            <ArrowUpRight className="size-3" />
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
