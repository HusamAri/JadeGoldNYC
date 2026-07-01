import { Rocket, CalendarClock, Target } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { AddTaskButton } from "@/components/etsy-updates/add-task-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  GROWTH_IMMEDIATE,
  GROWTH_PHASES,
  GROWTH_BENCHMARKS,
} from "@/lib/growth-roadmap";

export const metadata = { title: "Büyüme Stratejisi" };

export default function BuyumeStratejisiPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Büyüme Stratejisi"
        description="Etsy SEO + yapay zekâ arama (AEO) görünürlüğü için harici bir strateji notundan elenmiş, uygulanabilir plan"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="size-4" />
            İlk 48 Saat
          </CardTitle>
          <CardDescription>
            En yüksek etkili, hemen başlanabilecek adımlar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {GROWTH_IMMEDIATE.map((item, i) => (
            <div key={item.id} className={i > 0 ? "border-t pt-4" : undefined}>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{item.body}</p>
              {item.task && (
                <div className="mt-3">
                  <AddTaskButton task={item.task} />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {GROWTH_PHASES.map((phase) => (
        <Card key={phase.key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4" />
              {phase.title}
            </CardTitle>
            <CardDescription>{phase.goal}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {phase.items.map((item, i) => (
              <div key={item.id} className={i > 0 ? "border-t pt-4" : undefined}>
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{item.body}</p>
                {item.task && (
                  <div className="mt-3">
                    <AddTaskButton task={item.task} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4" />
            Kıyaslamalar
          </CardTitle>
          <CardDescription>
            Genel Etsy takı kategorisi ortalamaları — bu mağazaya özgü ölçüm
            değildir, hedef belirlemek için referans amaçlıdır.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {GROWTH_BENCHMARKS.map((b) => (
            <div key={b.metric} className="space-y-1">
              <p className="text-muted-foreground text-xs">{b.metric}</p>
              <p className="font-semibold">{b.target}</p>
              <p className="text-muted-foreground text-xs">{b.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Marka konumlandırması, slogan ve mağaza tanıtım metni için{" "}
        <a href="/marka-kilavuzu" className="underline">
          Marka Kılavuzu
        </a>{" "}
        sayfasındaki “Pazar Fırsatı & Konumlandırma” bölümüne bakın.
      </p>
    </div>
  );
}
