"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Download,
  ExternalLink,
  Copy,
  Star,
  ChevronRight,
} from "lucide-react";

import {
  PHOTO_KIT,
  PHOTO_CONCEPTS,
  CAT_LABEL,
  SCENE_LABEL,
  MODEL_LABEL,
  type PhotoKitItem,
} from "@/lib/photo-kit/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GOLD = "var(--gold,#B89347)";
const GOLD_DEEP = "var(--gold-deep,#9A7A34)";
const LINE = "var(--line,#DED9CB)";

type TierFilter = "all" | "1" | "2" | "3";
type SceneFilter = "all" | PhotoKitItem["scene"];
type CatFilter = "all" | PhotoKitItem["c"];

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast.success("Prompt kopyalandı");
}

const SCENE_DOT: Record<PhotoKitItem["scene"], string> = {
  dark: "linear-gradient(135deg,#3a3a34,#121210)",
  light: "linear-gradient(135deg,#f3ece0,#d9cdb4)",
  silk: "linear-gradient(135deg,#e8cf9c,#c79b58)",
};

export function PhotoKitConsole() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [scene, setScene] = useState<SceneFilter>("all");
  const [cat, setCat] = useState<CatFilter>("all");

  const tierCounts = useMemo(
    () => ({
      1: PHOTO_KIT.filter((d) => d.tier === 1).length,
      2: PHOTO_KIT.filter((d) => d.tier === 2).length,
      3: PHOTO_KIT.filter((d) => d.tier === 3).length,
    }),
    [],
  );

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PHOTO_KIT.filter(
      (it) =>
        (tier === "all" || it.tier === Number(tier)) &&
        (scene === "all" || it.scene === scene) &&
        (cat === "all" || it.c === cat) &&
        (query === "" || it.t.toLowerCase().includes(query)),
    );
  }, [q, tier, scene, cat]);

  return (
    <div className="space-y-6 pb-16">
      {/* Metodoloji panelleri */}
      <div className="grid gap-4 md:grid-cols-3">
        <MethodPanel title="Kimlik Kilidi — En Kritik Kural">
          <p className="text-muted-foreground text-sm">
            Ürün <b className="text-foreground font-semibold">birebir aynı</b>{" "}
            kalmalı. Her prompt bunu img2img modeline zorlar:
          </p>
          <ul className="mt-3 space-y-2">
            <Bullet>
              Aracın <b className="text-foreground">reference / img2img</b>{" "}
              moduna gerçek Etsy fotoğrafını yükle — prompt bu referansı varsayar.
            </Bullet>
            <Bullet>
              Geometri, zincir/halka deseni, kabartma, taş sayısı-yeri, kilit ve
              kalınlık <b className="text-foreground">değişmez</b>. Sadece yüzey,
              arka plan, ışık ve kompozisyon değişir.
            </Bullet>
            <Bullet>
              Ayar (karat rengi) prompt&apos;ta açık yazılı;{" "}
              <b className="text-foreground">negatif</b> yanlış metali yasaklar.
            </Bullet>
          </ul>
        </MethodPanel>

        <MethodPanel title="Araç Ayarları (img2img)">
          <ul className="mt-1 space-y-2">
            <Bullet>
              <b className="text-foreground">Referans gücü / identity</b> yüksek
              (~0.75–0.9); ürün strüktürü korunur.
            </Bullet>
            <Bullet>
              <b className="text-foreground">Denoise / değişim</b> orta — sahne
              değişsin ama ürün bozulmasın.
            </Bullet>
            <Bullet>
              Kare <b className="text-foreground">1:1</b> ya da listing için{" "}
              <b className="text-foreground">4:5</b>; yüksek çözünürlük → upscale.
            </Bullet>
            <Bullet>
              Ürün başına <b className="text-foreground">3–4 varyasyon</b> üret,
              kabartması en net olanı seç.
            </Bullet>
            <Bullet>
              Higgsfield <b className="text-foreground">nano_banana_pro</b> ya da
              eşdeğer referanslı görsel modeli.
            </Bullet>
          </ul>
        </MethodPanel>

        <MethodPanel title="Sahne Sözlüğü">
          <div className="mt-1 divide-y" style={{ borderColor: LINE }}>
            {(["dark", "light", "silk"] as const).map((s) => (
              <div key={s} className="flex items-start gap-3 py-2.5 first:pt-1">
                <span
                  className="mt-0.5 size-7 shrink-0 rounded-lg border"
                  style={{
                    background: SCENE_DOT[s],
                    borderColor: "rgba(0,0,0,.1)",
                  }}
                />
                <div>
                  <p className="text-sm font-semibold">
                    {SCENE_LABEL[s]}{" "}
                    <span className="text-muted-foreground font-normal">
                      · {s}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {s === "dark" &&
                      "Siyah volkanik taş / arduvaz, sıcak yandan ışık, altın rim — dramatik lüks."}
                    {s === "light" &&
                      "Ekru keten + krem mermer, ferah gün ışığı — minimal ve zarif."}
                    {s === "silk" &&
                      "Şampanya-altın saten kıvrımlar, sıcak parıltı — editoryal ve feminen."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </MethodPanel>
      </div>

      {/* Araç çubuğu */}
      <div
        className="bg-background/80 sticky top-2 z-20 flex flex-wrap items-center gap-2.5 rounded-2xl border p-3 backdrop-blur-md"
        style={{ borderColor: LINE }}
      >
        <div className="relative min-w-[180px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün adı ara…"
            className="h-9 pl-9"
            aria-label="Ürün ara"
          />
        </div>

        <Segmented
          label="Öncelik"
          value={tier}
          onChange={(v) => setTier(v as TierFilter)}
          options={[
            { v: "all", label: "Tümü" },
            { v: "1", label: "T1", count: tierCounts[1] },
            { v: "2", label: "T2", count: tierCounts[2] },
            { v: "3", label: "T3", count: tierCounts[3] },
          ]}
        />
        <Segmented
          label="Sahne"
          value={scene}
          onChange={(v) => setScene(v as SceneFilter)}
          options={[
            { v: "all", label: "Sahne" },
            { v: "dark", label: "Lav" },
            { v: "light", label: "Keten" },
            { v: "silk", label: "İpek" },
          ]}
        />
        <Segmented
          label="Tür"
          value={cat}
          onChange={(v) => setCat(v as CatFilter)}
          options={[
            { v: "all", label: "Tür" },
            { v: "chain", label: "Zincir" },
            { v: "bracelet", label: "Bileklik" },
            { v: "earrings", label: "Küpe" },
            { v: "pendant", label: "Uç" },
            { v: "ring", label: "Yüzük" },
          ]}
        />

        <span className="text-muted-foreground ml-auto pr-1 text-xs tabular-nums">
          {list.length} / {PHOTO_KIT.length} listing
        </span>
      </div>

      {/* Kart ızgarası */}
      {list.length === 0 ? (
        <p
          className="text-muted-foreground rounded-2xl border border-dashed p-12 text-center text-sm"
          style={{ borderColor: LINE }}
        >
          Bu filtreyle eşleşen ürün yok.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((it) => (
            <ProductCard key={it.id} it={it} />
          ))}
        </div>
      )}

      {/* Ek konseptler */}
      <div className="pt-6">
        <div className="mb-4 space-y-1">
          <h3 className="text-xl font-semibold tracking-tight">
            Markaya Uyumlu Ek Konseptler
          </h3>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Kimlik kilidi aynı kalır; bu sahne eklerini herhangi bir flat-lay
            prompt&apos;un <em>sonuna</em> ekleyerek ürünü değiştirmeden farklı bir
            dünyada çekebilirsin. Sahne cümlesinin yerine yapıştır.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PHOTO_CONCEPTS.map((c) => (
            <div
              key={c.name}
              className="bg-card flex flex-col rounded-2xl border p-4"
              style={{ borderColor: LINE }}
            >
              <div
                className="mb-3 h-10 rounded-xl"
                style={{ background: c.bar }}
              />
              <p
                className="text-[10.5px] font-bold tracking-[0.14em] uppercase"
                style={{ color: GOLD_DEEP }}
              >
                {c.sub}
              </p>
              <p className="font-semibold">{c.name}</p>
              <p className="text-muted-foreground mt-1.5 flex-1 text-[13px]">
                {c.text}
              </p>
              <button
                type="button"
                onClick={() => copyText(c.prompt)}
                className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:border-[color:var(--gold,#B89347)]"
                style={{ borderColor: LINE }}
              >
                <Copy className="size-3.5" />
                Sahne eki kopyala
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MethodPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-card rounded-2xl border p-4"
      style={{ borderColor: LINE }}
    >
      <h3 className="flex items-center gap-2 font-semibold">
        <span
          className="size-2 rounded-full"
          style={{ background: GOLD }}
          aria-hidden
        />
        {title}
      </h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-muted-foreground flex gap-2.5 text-[13px] leading-relaxed">
      <span
        className="mt-[7px] size-1.5 shrink-0 rounded-full"
        style={{ background: "var(--jade,#2F5D50)" }}
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; label: string; count?: number }[];
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="bg-muted/50 inline-flex gap-0.5 rounded-xl border p-0.5"
      style={{ borderColor: LINE }}
    >
      {options.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[0.6rem] px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {o.count != null && (
              <span
                className="tabular-nums"
                style={{ color: active ? GOLD_DEEP : undefined }}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ProductCard({ it }: { it: PhotoKitItem }) {
  const tierColor =
    it.tier === 1 ? GOLD : it.tier === 2 ? "var(--jade,#2F5D50)" : LINE;
  return (
    <div
      className="bg-card relative flex flex-col overflow-hidden rounded-2xl border"
      style={{ borderColor: LINE }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: tierColor }}
      />
      {/* başlık + çipler */}
      <div className="border-b px-4 py-3.5 pl-5" style={{ borderColor: LINE }}>
        <p className="text-[15px] leading-snug font-semibold">{it.t}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {it.tier === 1 ? (
            <Badge
              className="gap-1 border-transparent text-white"
              style={{
                background: `linear-gradient(150deg, ${GOLD}, ${GOLD_DEEP})`,
              }}
            >
              <Star className="size-3" /> T1 Öncelik
            </Badge>
          ) : (
            <Badge variant="outline">T{it.tier}</Badge>
          )}
          <Badge
            variant="outline"
            className="gap-1"
            style={{ color: GOLD_DEEP, borderColor: `${GOLD}66` }}
          >
            {it.k}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <span
              className="size-2.5 rounded-[3px]"
              style={{ background: SCENE_DOT[it.scene] }}
              aria-hidden
            />
            {SCENE_LABEL[it.scene]}
          </Badge>
          <Badge variant="secondary">{CAT_LABEL[it.c]}</Badge>
          <Badge variant="outline">Model: {MODEL_LABEL[it.model]}</Badge>
        </div>
      </div>

      {/* istatistik */}
      <div
        className="bg-muted/30 flex gap-6 border-b px-4 py-2.5 pl-5"
        style={{ borderColor: LINE }}
      >
        <Stat n={it.u.toLocaleString("tr-TR")} l="Satış" />
        <Stat n={`$${it.pr}`} l="Fiyat" />
      </div>

      {/* referans aksiyonları */}
      <div className="flex gap-2 px-4 py-3 pl-5">
        <a
          href={it.img}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:border-[color:var(--gold,#B89347)]"
          style={{ borderColor: LINE }}
        >
          <Download className="size-3.5" /> Referansı indir
        </a>
        <a
          href={it.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:border-[color:var(--gold,#B89347)]"
          style={{ borderColor: LINE }}
        >
          <ExternalLink className="size-3.5" /> Etsy
        </a>
      </div>

      {/* promptlar */}
      <div className="flex flex-col gap-2 px-4 pt-1 pb-4 pl-5">
        <PromptBlock label="Flat-lay Prompt" text={it.p} tone="flat" defaultOpen />
        <PromptBlock label="Model / 2. Açı" text={it.mp} tone="model" />
        <PromptBlock label="Negatif" text={it.n} tone="neg" />
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-[15px] font-semibold tabular-nums">{n}</div>
      <div className="text-muted-foreground text-[10px] font-bold tracking-[0.12em] uppercase">
        {l}
      </div>
    </div>
  );
}

const TONE: Record<string, { bg: string; fg: string }> = {
  flat: { bg: "var(--gold-tint,#F3E9CF)", fg: "var(--gold-deep,#9A7A34)" },
  model: { bg: "var(--jade-tint,#DDE8E1)", fg: "var(--jade,#2F5D50)" },
  neg: { bg: "color-mix(in oklab,#b23b3b 15%,transparent)", fg: "#b23b3b" },
};

function PromptBlock({
  label,
  text,
  tone,
  defaultOpen,
}: {
  label: string;
  text: string;
  tone: "flat" | "model" | "neg";
  defaultOpen?: boolean;
}) {
  const t = TONE[tone];
  return (
    <details
      open={defaultOpen}
      className="group bg-muted/30 overflow-hidden rounded-xl border"
      style={{ borderColor: LINE }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[13px] font-semibold select-none [&::-webkit-details-marker]:hidden">
        <span
          className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase"
          style={{ background: t.bg, color: t.fg }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            copyText(text);
          }}
          className="text-muted-foreground hover:text-foreground ml-1 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold transition-colors hover:border-[color:var(--gold,#B89347)]"
          style={{ borderColor: LINE }}
        >
          <Copy className="size-3" /> Kopyala
        </button>
        <ChevronRight className="text-muted-foreground ml-auto size-4 transition-transform group-open:rotate-90" />
      </summary>
      <div className="px-3 pb-3">
        <p className="text-muted-foreground font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
      </div>
    </details>
  );
}
