"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CircleCheck,
  CircleHelp,
  ClipboardPlus,
  Loader2,
  MessageCircleQuestion,
  ChevronRight,
} from "lucide-react";

import type { ScenarioResult } from "@/lib/metrics-playbook/evaluate";
import type {
  PlaybookAction,
  PlaybookInquiry,
} from "@/lib/metrics-playbook/playbook";
import {
  addActionAsTask,
  createInquiry,
} from "@/app/(dashboard)/analizler/aksiyon-plani/actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEV_LABEL = { critical: "Kritik", warning: "Uyarı", info: "Bilgi" };

export function ScenarioBoard({ results }: { results: ScenarioResult[] }) {
  const triggered = results.filter((r) => r.status === "triggered");
  const noData = results.filter((r) => r.status === "no-data");
  const ok = results.filter((r) => r.status === "ok");

  return (
    <div className="space-y-6">
      {triggered.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="size-5 text-[color:var(--gold-deep,#9A7A34)]" />
            Tetiklenen senaryolar
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {triggered.map((r) => (
              <ScenarioCard key={r.scenario.id} r={r} defaultOpen />
            ))}
          </div>
        </section>
      )}

      {noData.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <CircleHelp className="text-muted-foreground size-5" />
            Veri bekleyen senaryolar
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {noData.map((r) => (
              <ScenarioCard key={r.scenario.id} r={r} />
            ))}
          </div>
        </section>
      )}

      {ok.length > 0 && (
        <details className="group/ok">
          <summary className="bg-card nm-raised-sm flex cursor-pointer list-none items-center gap-3 rounded-[1.75rem] px-5 py-4 select-none [&::-webkit-details-marker]:hidden">
            <CircleCheck className="size-5 text-emerald-600" />
            <span className="font-semibold">Sağlıklı senaryolar</span>
            <span className="text-muted-foreground text-sm tabular-nums">
              {ok.length} senaryo
            </span>
            <ChevronRight className="text-muted-foreground ml-auto size-5 transition-transform group-open/ok:rotate-90" />
          </summary>
          <div className="grid gap-4 pt-4 lg:grid-cols-2">
            {ok.map((r) => (
              <ScenarioCard key={r.scenario.id} r={r} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ScenarioCard({
  r,
  defaultOpen,
}: {
  r: ScenarioResult;
  defaultOpen?: boolean;
}) {
  const s = r.scenario;
  const tone =
    r.status === "triggered"
      ? s.severity === "critical"
        ? "border-[color:#b23b3b]"
        : "border-[color:var(--gold,#B89347)]"
      : "border-transparent";

  return (
    <div className={cn("bg-card nm-raised-sm rounded-[1.75rem] border p-4", tone)}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{s.title}</p>
        <Badge
          variant={r.status === "triggered" ? "default" : "outline"}
          className={cn(
            r.status === "triggered" &&
              s.severity === "critical" &&
              "border-transparent bg-[color:#b23b3b] text-white",
            r.status === "triggered" &&
              s.severity !== "critical" &&
              "bg-accent text-accent-foreground border-transparent",
          )}
        >
          {r.status === "triggered"
            ? SEV_LABEL[s.severity]
            : r.status === "no-data"
              ? "Veri eksik"
              : "Sağlıklı"}
        </Badge>
        <span className="text-muted-foreground ml-auto text-[11px]">
          {s.dataset}
        </span>
      </div>
      <p className="text-muted-foreground mt-1.5 text-[13px]">{r.detail}</p>
      {r.affected && r.affected.length > 0 && (
        <p className="text-muted-foreground mt-1 text-xs">
          Etkilenen: <i>{r.affected.join(" · ")}</i>
        </p>
      )}
      <p className="text-muted-foreground mt-1 text-xs">
        Tetik: {s.trigger}
      </p>

      {/* Ekip yanıtlarından çatallanan sorular — sonuç yorumlarıyla */}
      {r.branchNotes && r.branchNotes.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {r.branchNotes.map((b, i) => (
            <div
              key={i}
              className="rounded-lg border-l-2 border-[color:var(--jade,#2F5D50)] bg-[color:var(--jade-tint,#DDE8E1)]/40 px-3 py-2"
            >
              <p className="text-xs font-semibold">
                Çatallanan soru: {b.fromTitle}
              </p>
              <p className="text-muted-foreground text-[12px] whitespace-pre-wrap">
                {b.note}
              </p>
            </div>
          ))}
        </div>
      )}

      {(r.status === "triggered" || r.status === "no-data") && (
        <details className="mt-3" open={defaultOpen}>
          <summary className="cursor-pointer text-sm font-semibold select-none">
            Doğrulanmış aksiyonlar ({s.actions.length})
            {s.inquiries.length > 0 && ` · Ekibe sorulacaklar (${s.inquiries.length})`}
          </summary>
          <div className="mt-2 space-y-2">
            {s.actions.map((a) => (
              <ActionRow key={a.title} action={a} scenarioTitle={s.title} />
            ))}
            {s.inquiries.map((q) => (
              <InquiryRow key={q.title} inquiry={q} scenarioId={s.id} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ActionRow({
  action,
  scenarioTitle,
}: {
  action: PlaybookAction;
  scenarioTitle: string;
}) {
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);

  return (
    <div className="bg-muted/30 flex items-start gap-3 rounded-xl border border-[color:var(--line,#DED9CB)] p-3">
      <Badge variant="outline" className="mt-0.5 shrink-0">
        {action.priority}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{action.title}</p>
        <p className="text-muted-foreground text-[12.5px]">{action.detail}</p>
        <p className="text-muted-foreground mt-0.5 text-[11px]">
          Kaynak: {action.source}
        </p>
      </div>
      <button
        type="button"
        disabled={pending || added}
        onClick={() =>
          start(async () => {
            const r = await addActionAsTask({
              title: action.title,
              detail: action.detail,
              source: action.source,
              priority: action.priority,
              scenarioTitle,
            });
            if (r.error) toast.error(r.error);
            else {
              setAdded(true);
              toast.success("Görev eklendi — Görevler panosunda.");
            }
          })
        }
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors pointer-coarse:min-h-10",
          added
            ? "border-transparent bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
            : "border-[color:var(--line,#DED9CB)] hover:border-[color:var(--gold,#B89347)]",
        )}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ClipboardPlus className="size-3.5" />
        )}
        {added ? "Eklendi" : "Göreve ekle"}
      </button>
    </div>
  );
}

function InquiryRow({
  inquiry,
  scenarioId,
}: {
  inquiry: PlaybookInquiry;
  scenarioId: string;
}) {
  const [pending, start] = useTransition();
  const [asked, setAsked] = useState(false);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--line,#DED9CB)] p-3">
      <MessageCircleQuestion className="mt-0.5 size-4 shrink-0 text-[color:var(--jade,#2F5D50)]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{inquiry.title}</p>
        <p className="text-muted-foreground text-[12.5px]">{inquiry.body}</p>
        <p className="text-muted-foreground mt-0.5 text-[11px]">
          Tür:{" "}
          {inquiry.kind === "data"
            ? "Veri (tek giriş yeter)"
            : inquiry.kind === "vote"
              ? "Oylama (tüm üyeler)"
              : inquiry.kind === "visual"
                ? "Görsel kontrol (tüm üyeler)"
                : "Görüş (tüm üyeler)"}
        </p>
      </div>
      <button
        type="button"
        disabled={pending || asked}
        onClick={() =>
          start(async () => {
            const r = await createInquiry({
              title: inquiry.title,
              body: inquiry.body,
              kind: inquiry.kind,
              options: inquiry.options,
              scenarioId,
            });
            if (r.error) toast.error(r.error);
            else {
              setAsked(true);
              toast.success("Soru ekibe açıldı — aşağıdaki bölümde.");
            }
          })
        }
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors pointer-coarse:min-h-10",
          asked
            ? "border-transparent bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
            : "border-[color:var(--line,#DED9CB)] hover:border-[color:var(--gold,#B89347)]",
        )}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <MessageCircleQuestion className="size-3.5" />
        )}
        {asked ? "Soruldu" : "Ekibe sor"}
      </button>
    </div>
  );
}
