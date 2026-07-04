"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquarePlus, Send, Loader2, X } from "lucide-react";

import { addPin, addComment } from "@/app/(dashboard)/tasarimlar/pano/actions";
import type { DesignPin } from "@/lib/db/queries/design-boards";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Line {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function BoardCanvas({
  boardId,
  imageUrl,
  pins,
}: {
  boardId: string;
  imageUrl: string;
  pins: DesignPin[];
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const [lines, setLines] = useState<Line[]>([]);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [activePin, setActivePin] = useState<string | null>(null);

  const recompute = useCallback(() => {
    const container = containerRef.current;
    const imgWrap = imageWrapRef.current;
    if (!container || !imgWrap) return;
    const c = container.getBoundingClientRect();
    const i = imgWrap.getBoundingClientRect();
    const next: Line[] = [];
    for (const p of pins) {
      const card = cardRefs.current.get(p.id);
      if (!card) continue;
      const r = card.getBoundingClientRect();
      next.push({
        id: p.id,
        x1: i.left - c.left + p.x * i.width,
        y1: i.top - c.top + p.y * i.height,
        x2: r.left - c.left,
        y2: r.top - c.top + Math.min(22, r.height / 2),
      });
    }
    setLines(next);
  }, [pins]);

  useLayoutEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    recompute();
    const ro = new ResizeObserver(() => recompute());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", recompute);
    window.addEventListener("scroll", recompute, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
      window.removeEventListener("scroll", recompute, true);
    };
  }, [recompute]);

  function onImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!adding || !imageWrapRef.current) return;
    const rect = imageWrapRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    setPending({ x, y });
    setAdding(false);
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Button
          type="button"
          variant={adding ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setAdding((a) => !a);
            setPending(null);
          }}
        >
          <MessageSquarePlus className="size-4" />
          {adding ? "Görselde bir nokta seç…" : "Yorum ekle"}
        </Button>
        <span className="text-muted-foreground text-xs tabular-nums">
          {pins.length} not
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        {/* Görsel + pinler */}
        <div className="min-w-0">
          <div
            ref={imageWrapRef}
            onClick={onImageClick}
            className={cn(
              "relative w-full overflow-hidden rounded-2xl border",
              adding && "ring-primary cursor-crosshair ring-2",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Tasarım panosu"
              draggable={false}
              className="block w-full select-none"
            />
            {pins.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin(p.id);
                  cardRefs.current
                    .get(p.id)
                    ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
                }}
                style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                className={cn(
                  "absolute flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-white transition-transform",
                  "bg-[oklch(0.58_0.1_66)] shadow-[0_2px_6px_rgba(30,22,4,0.5)]",
                  activePin === p.id && "scale-125 ring-[oklch(0.85_0.12_86)]",
                )}
              >
                {i + 1}
              </button>
            ))}
            {pending && (
              <span
                style={{ left: `${pending.x * 100}%`, top: `${pending.y * 100}%` }}
                className="jg-star-neon absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
              />
            )}
          </div>
        </div>

        {/* Yorumlar — görselin dışında, boş alanda */}
        <div className="space-y-3">
          {pending && (
            <PendingComposer
              boardId={boardId}
              pos={pending}
              onCancel={() => setPending(null)}
              onDone={() => {
                setPending(null);
                router.refresh();
              }}
            />
          )}
          {pins.length === 0 && !pending && (
            <p className="text-muted-foreground rounded-2xl border border-dashed p-6 text-center text-sm">
              Henüz not yok. <b>&quot;Yorum ekle&quot;</b> ile görselde bir nokta
              seçip yorum yazın.
            </p>
          )}
          {pins.map((p, i) => (
            <PinCard
              key={p.id}
              index={i + 1}
              pin={p}
              boardId={boardId}
              active={activePin === p.id}
              onActivate={() => setActivePin(p.id)}
              cardRef={(el) => {
                if (el) cardRefs.current.set(p.id, el);
                else cardRefs.current.delete(p.id);
              }}
              onReplied={() => router.refresh()}
            />
          ))}
        </div>

        {/* Leader-line'lar — pin'den kartına ince çizgi (yalnız iki-kolon) */}
        <svg
          className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
          aria-hidden
        >
          {lines.map((l) => (
            <g key={l.id}>
              <path
                d={`M ${l.x1} ${l.y1} L ${l.x2} ${l.y2}`}
                fill="none"
                stroke="oklch(0.62 0.09 86)"
                strokeWidth={activePin === l.id ? 2 : 1.25}
                strokeOpacity={activePin === l.id ? 0.95 : 0.45}
              />
              <circle
                cx={l.x1}
                cy={l.y1}
                r={2.5}
                fill="oklch(0.62 0.09 86)"
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function PendingComposer({
  boardId,
  pos,
  onDone,
  onCancel,
}: {
  boardId: string;
  pos: { x: number; y: number };
  onDone: () => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const text = body.trim();
    if (!text) return;
    start(async () => {
      const res = await addPin({ boardId, x: pos.x, y: pos.y, body: text });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="ring-primary/40 space-y-2 rounded-2xl border p-3 ring-2">
      <div className="text-muted-foreground text-xs font-medium">
        Yeni not — seçilen noktaya
      </div>
      <textarea
        autoFocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Bu nokta hakkında yorumun…"
        rows={3}
        className="border-input bg-background focus-visible:ring-ring/60 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4" />
          İptal
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={pending || !body.trim()}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Ekle
        </Button>
      </div>
    </div>
  );
}

function PinCard({
  index,
  pin,
  boardId,
  active,
  onActivate,
  cardRef,
  onReplied,
}: {
  index: number;
  pin: DesignPin;
  boardId: string;
  active: boolean;
  onActivate: () => void;
  cardRef: (el: HTMLElement | null) => void;
  onReplied: () => void;
}) {
  const [reply, setReply] = useState("");
  const [pending, start] = useTransition();

  function submit() {
    const text = reply.trim();
    if (!text) return;
    start(async () => {
      const res = await addComment({ boardId, pinId: pin.id, body: text });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setReply("");
      onReplied();
    });
  }

  return (
    <div
      ref={cardRef}
      onClick={onActivate}
      className={cn(
        "bg-card rounded-2xl border p-3 transition-shadow",
        active
          ? "ring-[oklch(0.62_0.09_86)]/60 ring-2"
          : "shadow-[var(--shadow-raised-sm)]",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-full bg-[oklch(0.58_0.1_66)] text-[10px] font-bold text-white">
          {index}
        </span>
        <span className="text-muted-foreground text-xs">
          {pin.comments.length} mesaj
        </span>
      </div>

      <ul className="space-y-2">
        {pin.comments.map((c) => (
          <li key={c.id} className="text-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{c.author_name ?? "Bilinmeyen"}</span>
              <span className="text-muted-foreground text-[11px] tabular-nums">
                {formatDateTime(c.created_at)}
              </span>
            </div>
            <p className="text-foreground/90 whitespace-pre-wrap">{c.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-2.5 flex items-center gap-1.5">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Yanıtla…"
          className="border-input bg-background focus-visible:ring-ring/60 h-8 min-w-0 flex-1 rounded-full border px-3 text-sm outline-none focus-visible:ring-2"
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 shrink-0"
          onClick={submit}
          disabled={pending || !reply.trim()}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          <span className="sr-only">Yanıtla</span>
        </Button>
      </div>
    </div>
  );
}
