"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  GitBranch,
  Loader2,
  MessageCircleQuestion,
  Plus,
  Vote,
  Eye,
  Database,
  MessagesSquare,
} from "lucide-react";

import type {
  MetricInquiry,
  InquiryKind,
} from "@/lib/db/queries/metric-inquiries";
import {
  createInquiry,
  respondInquiry,
  resolveInquiry,
  branchInquiry,
} from "@/app/(dashboard)/analizler/aksiyon-plani/actions";
import { PLAYBOOK } from "@/lib/metrics-playbook/playbook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  InquiryKind,
  { label: string; icon: React.ElementType; note: string }
> = {
  data: {
    label: "Veri",
    icon: Database,
    note: "Objektif veri — ilk giriş soruyu ANINDA incelemeye çeker.",
  },
  visual: {
    label: "Görsel kontrol",
    icon: Eye,
    note: "Anlık: ilk yanıtla incelemeye düşer; sonraki bakışlar da anında eklenir.",
  },
  opinion: {
    label: "Görüş",
    icon: MessagesSquare,
    note: "Anlık: ilk görüşle incelemeye düşer; görüşler gelmeye devam eder.",
  },
  vote: {
    label: "Oylama",
    icon: Vote,
    note: "Anlık: ilk oyla incelemeye düşer; oy dağılımı canlı güncellenir.",
  },
};

export function InquiryBoard({
  inquiries,
  memberCount,
  currentUserId,
}: {
  inquiries: MetricInquiry[];
  memberCount: number;
  currentUserId: string;
}) {
  const open = inquiries.filter((i) => i.status === "open");
  const review = inquiries.filter((i) => i.status === "review");
  const resolved = inquiries.filter((i) => i.status === "resolved");

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <MessageCircleQuestion className="size-5 text-[color:var(--jade,#2F5D50)]" />
          Ekibe Sorulanlar
        </h3>
        <NewInquiryForm />
      </div>

      {inquiries.length === 0 ? (
        <p className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm">
          Açık soru yok. Senaryolardaki &quot;Ekibe sor&quot; ile ya da yukarıdaki
          &quot;Yeni Soru&quot; ile başlat.
        </p>
      ) : (
        <div className="space-y-6">
          {review.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[color:var(--gold-deep,#9A7A34)]">
                İncelemeye döndü ({review.length}) — sonuçlar hazır
              </p>
              {review.map((i) => (
                <InquiryCard
                  key={i.id}
                  inquiry={i}
                  memberCount={memberCount}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
          {open.length > 0 && (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm font-semibold">
                Yanıt bekleyenler ({open.length})
              </p>
              {open.map((i) => (
                <InquiryCard
                  key={i.id}
                  inquiry={i}
                  memberCount={memberCount}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
          {resolved.length > 0 && (
            <details>
              <summary className="text-muted-foreground cursor-pointer text-sm font-semibold select-none">
                Kapatılanlar ({resolved.length})
              </summary>
              <div className="mt-3 space-y-3">
                {resolved.map((i) => (
                  <InquiryCard
                    key={i.id}
                    inquiry={i}
                    memberCount={memberCount}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function InquiryCard({
  inquiry,
  memberCount,
  currentUserId,
}: {
  inquiry: MetricInquiry;
  memberCount: number;
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const meta = KIND_META[inquiry.kind];
  const Icon = meta.icon;
  const myResponse = inquiry.responses.find((r) => r.userId === currentUserId);
  const answered = inquiry.responses.length;

  function respond(option?: string) {
    start(async () => {
      const r = await respondInquiry({
        inquiryId: inquiry.id,
        body: body || undefined,
        option,
      });
      if (r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(
        r.movedToReview
          ? "Yanıt alındı — soru incelemeye döndü."
          : "Yanıt alındı.",
      );
      setBody("");
      router.refresh();
    });
  }

  // Oylama dağılımı
  const voteCounts = new Map<string, number>();
  if (inquiry.kind === "vote") {
    for (const r of inquiry.responses) {
      if (r.option) voteCounts.set(r.option, (voteCounts.get(r.option) ?? 0) + 1);
    }
  }

  return (
    <div
      className={cn(
        "bg-card nm-raised-sm rounded-[1.75rem] border p-4",
        inquiry.status === "review"
          ? "border-[color:var(--gold,#B89347)]"
          : "border-transparent",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon className="size-4 text-[color:var(--jade,#2F5D50)]" />
        <p className="font-semibold">{inquiry.title}</p>
        <Badge variant="outline">{meta.label}</Badge>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {answered}/{memberCount} üye yanıtladı
        </span>
      </div>
      {inquiry.body && (
        <p className="text-muted-foreground mt-1.5 text-[13px]">{inquiry.body}</p>
      )}
      <p className="text-muted-foreground mt-1 text-[11px]">{meta.note}</p>

      {/* Yanıtlar */}
      {inquiry.responses.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {inquiry.kind === "vote" ? (
            <div className="space-y-1">
              {(inquiry.options ?? []).map((o) => {
                const n = voteCounts.get(o) ?? 0;
                const shareWidth =
                  answered > 0 ? Math.round((n / answered) * 100) : 0;
                return (
                  <div key={o} className="flex items-center gap-2 text-sm">
                    <span className="w-40 shrink-0 truncate sm:w-56">{o}</span>
                    <div className="nm-pressed h-2 flex-1 overflow-hidden rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${shareWidth}%`,
                          background: "var(--gold,#B89347)",
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground w-6 text-right text-xs tabular-nums">
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            inquiry.responses.map((r) => (
              <div
                key={r.id}
                className="bg-muted/30 rounded-lg px-3 py-2 text-[13px]"
              >
                <span className="font-semibold">
                  {r.authorName ?? "Üye"}:
                </span>{" "}
                {r.body ?? r.option}
              </div>
            ))
          )}
        </div>
      )}

      {/* Yanıt verme */}
      {inquiry.status !== "resolved" && (
        <div className="mt-3">
          {inquiry.kind === "vote" ? (
            <div className="flex flex-wrap gap-2">
              {(inquiry.options ?? []).map((o) => (
                <Button
                  key={o}
                  type="button"
                  size="sm"
                  variant={myResponse?.option === o ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => respond(o)}
                >
                  {o}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  myResponse
                    ? "Yanıtını güncelle…"
                    : inquiry.kind === "data"
                      ? "Veriyi buraya gir (tek giriş yeter)…"
                      : "Görüşünü yaz…"
                }
                rows={2}
                className="text-sm"
              />
              <Button
                type="button"
                disabled={pending || !body.trim()}
                onClick={() => respond()}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Gönder"
                )}
              </Button>
            </div>
          )}
          {myResponse && (
            <p className="text-muted-foreground mt-1 text-[11px]">
              Yanıtladın{inquiry.kind === "vote" ? ` (${myResponse.option})` : ""} —
              tekrar gönderirsen güncellenir.
            </p>
          )}
        </div>
      )}

      {/* İnceleme kapanışı: düz kapat YA DA farklı senaryoya çatalla */}
      {inquiry.status === "review" && (
        <div className="mt-3 space-y-3 border-t pt-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-medium">
              {inquiry.kind === "data" && inquiry.dataValue
                ? "Veri alındı — değerlendirmeye işle, gerekirse çatalla."
                : "Yanıtlar akıyor — sonucu değerlendir: kapat ya da işaret ettiği senaryoya çatalla."}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await resolveInquiry(inquiry.id);
                  if (r.error) toast.error(r.error);
                  else {
                    toast.success("Soru kapatıldı.");
                    router.refresh();
                  }
                })
              }
            >
              <CheckCircle2 className="size-4" /> Kapat
            </Button>
          </div>
          <BranchForm inquiry={inquiry} />
        </div>
      )}

      {/* Çatallanmış kapanış özeti */}
      {inquiry.status === "resolved" && inquiry.branchedToScenario && (
        <div className="mt-3 rounded-lg border-l-2 border-[color:var(--jade,#2F5D50)] bg-[color:var(--jade-tint,#DDE8E1)]/40 px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <GitBranch className="size-3.5" />
            Çatallandı →{" "}
            {PLAYBOOK.find((p) => p.id === inquiry.branchedToScenario)?.title ??
              inquiry.branchedToScenario}
          </p>
          {inquiry.branchNote && (
            <p className="text-muted-foreground mt-0.5 text-[12px] whitespace-pre-wrap">
              {inquiry.branchNote}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Çatallanma formu: yanıtlar farklı bir senaryoya işaret ediyorsa hedef
 * senaryo seçilir; sonuç notu, gelen yanıtların özetiyle önceden doldurulur
 * ("sonuç yorumlar belirtilerek çatallanır").
 */
function BranchForm({ inquiry }: { inquiry: MetricInquiry }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [scenarioId, setScenarioId] = useState("");
  const defaultNote = inquiry.responses
    .map((r) => `${r.authorName ?? "Üye"}: ${r.body ?? r.option ?? ""}`)
    .join("\n");
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => {
          setNote(defaultNote);
          setOpen(true);
        }}
      >
        <GitBranch className="size-4" /> Farklı senaryoya çatalla
      </Button>
    );
  }

  return (
    <div
      className="space-y-2 rounded-xl border p-3"
      style={{ borderColor: "var(--line,#DED9CB)" }}
    >
      <select
        value={scenarioId}
        onChange={(e) => setScenarioId(e.target.value)}
        className="bg-background h-9 w-full rounded-lg border px-3 text-sm"
        style={{ borderColor: "var(--line,#DED9CB)" }}
        aria-label="Hedef senaryo"
      >
        <option value="">Yanıtların işaret ettiği senaryoyu seç…</option>
        {PLAYBOOK.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="font-mono text-xs"
        placeholder="Sonuç notu — gelen yanıtların özeti (karta işlenir)"
      />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !scenarioId || !note.trim()}
          onClick={() =>
            start(async () => {
              const r = await branchInquiry({
                inquiryId: inquiry.id,
                scenarioId,
                note,
              });
              if (r.error) {
                toast.error(r.error);
                return;
              }
              toast.success(
                "Çatallandı — hedef senaryo yanıt notlarıyla tetiklendi.",
              );
              setOpen(false);
              router.refresh();
            })
          }
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <GitBranch className="size-4" />
          )}
          Çatalla
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          Vazgeç
        </Button>
      </div>
    </div>
  );
}

function NewInquiryForm() {
  const router = useRouter();
  const [openForm, setOpenForm] = useState(false);
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [kind, setKind] = useState<InquiryKind>("opinion");
  const [options, setOptions] = useState("");

  if (!openForm) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpenForm(true)}>
        <Plus className="size-4" /> Yeni Soru
      </Button>
    );
  }

  return (
    <div
      className="bg-card w-full rounded-2xl border p-4"
      style={{ borderColor: "var(--line,#DED9CB)" }}
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Soru başlığı"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as InquiryKind)}
          className="bg-background h-10 rounded-lg border px-3 text-sm"
          style={{ borderColor: "var(--line,#DED9CB)" }}
          aria-label="Soru türü"
        >
          <option value="opinion">Görüş (herkes)</option>
          <option value="vote">Oylama (herkes)</option>
          <option value="visual">Görsel kontrol (herkes)</option>
          <option value="data">Veri isteği (tek giriş)</option>
        </select>
      </div>
      <Textarea
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        placeholder="Açıklama / neye bakılacak"
        rows={2}
        className="mt-2 text-sm"
      />
      {kind === "vote" && (
        <Input
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          placeholder="Seçenekler (virgülle: Evet, Hayır, Kararsız)"
          className="mt-2"
        />
      )}
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await createInquiry({
                title,
                body: bodyText,
                kind,
                options: options.split(",").map((s) => s.trim()),
              });
              if (r.error) {
                toast.error(r.error);
                return;
              }
              toast.success("Soru ekibe açıldı.");
              setOpenForm(false);
              setTitle("");
              setBodyText("");
              setOptions("");
              router.refresh();
            })
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : "Sor"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpenForm(false)}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
