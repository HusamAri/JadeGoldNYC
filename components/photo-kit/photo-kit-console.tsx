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
  Check,
  Circle,
  PartyPopper,
} from "lucide-react";

import {
  PHOTO_KIT,
  PHOTO_CONCEPTS,
  CAT_LABEL,
  SCENE_LABEL,
  MODEL_LABEL,
  type PhotoKitItem,
} from "@/lib/photo-kit/types";
import { setPhotoProduced } from "@/app/(dashboard)/gorsel-uretim/actions";
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
    const ok = document.execCommand("copy");
    ta.remove();
    if (!ok) {
      toast.error("Kopyalanamadı — metni elle seçip kopyalayın.");
      return;
    }
  }
  toast.success("Prompt kopyalandı");
}

const SCENE_DOT: Record<PhotoKitItem["scene"], string> = {
  dark: "linear-gradient(135deg,#3a3a34,#121210)",
  light: "linear-gradient(135deg,#f3ece0,#d9cdb4)",
  silk: "linear-gradient(135deg,#e8cf9c,#c79b58)",
};

export function PhotoKitConsole({ producedIds }: { producedIds: number[] }) {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [scene, setScene] = useState<SceneFilter>("all");
  const [cat, setCat] = useState<CatFilter>("all");
  const [done, setDone] = useState<Set<number>>(() => new Set(producedIds));

  const tierCounts = useMemo(
    () => ({
      1: PHOTO_KIT.filter((d) => d.tier === 1).length,
      2: PHOTO_KIT.filter((d) => d.tier === 2).length,
      3: PHOTO_KIT.filter((d) => d.tier === 3).length,
    }),
    [],
  );

  const doneCount = done.size;
  const total = PHOTO_KIT.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  function toggleDone(id: number, next: boolean) {
    // iyimser güncelleme
    setDone((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
    setPhotoProduced(id, next)
      .then((res) => {
        if (res.error) {
          toast.error(res.error);
          setDone((prev) => {
            const s = new Set(prev);
            if (next) s.delete(id);
            else s.add(id);
            return s;
          });
        }
      })
      .catch(() => {
        toast.error("Kaydedilemedi, tekrar deneyin.");
        setDone((prev) => {
          const s = new Set(prev);
          if (next) s.delete(id);
          else s.add(id);
          return s;
        });
      });
  }

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

  // Üretilenler ana kuyruğu kalabalıklaştırmasın: iki ayrı bölüm.
  const pending = useMemo(
    () => list.filter((it) => !done.has(it.id)),
    [list, done],
  );
  const completed = useMemo(
    () => list.filter((it) => done.has(it.id)),
    [list, done],
  );

  return (
    <div className="space-y-6 pb-16">
      {/* İlerleme */}
      <div className="bg-card nm-raised-sm rounded-[1.75rem] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold">Üretim İlerlemesi</p>
          <p className="text-muted-foreground text-sm tabular-nums">
            <b className="text-foreground">{doneCount}</b> / {total} üretildi ·{" "}
            {total - doneCount} kaldı
          </p>
        </div>
        <div
          className="bg-muted mt-3 h-2.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Üretim ilerlemesi"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DEEP})`,
            }}
          />
        </div>
      </div>
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
                      "Siyah volkanik taş, sıcak yandan ışık, altın rim — dramatik lüks."}
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

      {/* Araç çubuğu — sticky ofseti topbar'ın (h-16) altında kalacak kadar;
          mobilde 4-5 satıra sardığı için sabitlenmez (ekranı yemesin). */}
      <div
        className="bg-background/80 z-20 flex flex-wrap items-center gap-2.5 rounded-2xl border p-3 backdrop-blur-md sm:sticky sm:top-[4.5rem]"
        style={{ borderColor: LINE }}
      >
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
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
            { v: "all", label: "Tümü" },
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
            { v: "all", label: "Tümü" },
            { v: "chain", label: "Zincir" },
            { v: "bracelet", label: "Bileklik" },
            { v: "earrings", label: "Küpe" },
            { v: "pendant", label: "Uç" },
            { v: "ring", label: "Yüzük" },
          ]}
        />
        <span className="text-muted-foreground ml-auto pr-1 text-xs tabular-nums">
          {/* Filtre etkinken sayılar filtre kapsamındadır; üstteki ilerleme
              çubuğu ise her zaman geneli gösterir — karışmasın diye etiketle */}
          {tier !== "all" || scene !== "all" || cat !== "all" || q.trim() !== ""
            ? "filtrede: "
            : ""}
          {pending.length} kalan · {completed.length} üretildi
        </span>
      </div>

      {/* Üretim kuyruğu — yalnız üretilMEyenler; üretilenler alt bölümde */}
      {list.length === 0 ? (
        <p className="text-muted-foreground nm-pressed rounded-2xl p-12 text-center text-sm">
          Bu filtreyle eşleşen ürün yok.
        </p>
      ) : pending.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed p-12 text-center"
          style={{ borderColor: "var(--jade,#2F5D50)" }}
        >
          <PartyPopper
            className="mx-auto mb-3 size-8"
            style={{ color: "var(--jade,#2F5D50)" }}
          />
          <p className="font-semibold">
            Bu filtredeki tüm görseller üretildi!
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Üretilenler aşağıdaki bölümde — yanlış işaretlediysen oradan geri
            alabilirsin.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pending.map((it) => (
            <ProductCard
              key={it.id}
              it={it}
              done={false}
              onToggle={toggleDone}
            />
          ))}
        </div>
      )}

      {/* Üretilenler — ayrı, katlanabilir bölüm (varsayılan kapalı) */}
      {completed.length > 0 && (
        <details className="group/done">
          <summary
            className="bg-card nm-raised-sm flex cursor-pointer list-none items-center gap-3 rounded-[1.75rem] px-5 py-4 select-none [&::-webkit-details-marker]:hidden"
            aria-label={`Üretilenler bölümünü aç/kapat (${completed.length} listing)`}
          >
            <span
              className="flex size-8 items-center justify-center rounded-full text-white"
              style={{ background: "var(--jade,#2F5D50)" }}
              aria-hidden
            >
              <Check className="size-4" />
            </span>
            <span className="font-semibold">Üretilenler</span>
            <span className="text-muted-foreground text-sm tabular-nums">
              {completed.length} listing
            </span>
            <ChevronRight className="text-muted-foreground ml-auto size-5 transition-transform group-open/done:rotate-90" />
          </summary>
          <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-3">
            {completed.map((it) => (
              <ProductCard
                key={it.id}
                it={it}
                done
                onToggle={toggleDone}
              />
            ))}
          </div>
        </details>
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
              className="bg-card nm-raised-sm flex flex-col rounded-[1.75rem] p-4"
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
                className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors pointer-coarse:min-h-11 hover:border-[color:var(--gold,#B89347)]"
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
    <div className="bg-card nm-raised-sm rounded-[1.75rem] p-4">
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
      className="nm-pressed flex min-w-0 max-w-full flex-wrap gap-0.5 rounded-xl p-1"
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
              "inline-flex items-center gap-1.5 rounded-[0.6rem] px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all pointer-coarse:min-h-10 pointer-coarse:px-3",
              active
                ? "nm-raised-sm text-foreground"
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

function ProductCard({
  it,
  done,
  onToggle,
}: {
  it: PhotoKitItem;
  done: boolean;
  onToggle: (id: number, next: boolean) => void;
}) {
  const tierColor = done
    ? "var(--jade,#2F5D50)"
    : it.tier === 1
      ? GOLD
      : it.tier === 2
        ? "var(--jade,#2F5D50)"
        : LINE;
  return (
    <div
      className={cn(
        // content-visibility: 118 kart tek seferde boyanmasın (kaydırınca render)
        "bg-card nm-raised-sm relative flex flex-col overflow-hidden rounded-[1.75rem] border transition-opacity [content-visibility:auto] [contain-intrinsic-size:auto_540px]",
        done && "opacity-75",
      )}
      style={{ borderColor: done ? "var(--jade,#2F5D50)" : "transparent" }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: tierColor }}
      />
      {/* başlık + çipler */}
      <div className="border-b px-4 py-3.5 pl-5" style={{ borderColor: LINE }}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] leading-snug font-semibold">{it.t}</p>
          {done && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
              style={{ background: "var(--jade,#2F5D50)" }}
            >
              <Check className="size-3" /> Üretildi
            </span>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {it.tier === 1 ? (
            // Altın zeminde koyu metin — beyaz/altın 2.9:1 AA'yı geçmez.
            <Badge className="bg-accent text-accent-foreground gap-1 border-transparent">
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
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors pointer-coarse:min-h-11 hover:border-[color:var(--gold,#B89347)]"
          style={{ borderColor: LINE }}
        >
          <Download className="size-3.5" /> Referansı indir
        </a>
        <a
          href={it.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors pointer-coarse:min-h-11 hover:border-[color:var(--gold,#B89347)]"
          style={{ borderColor: LINE }}
        >
          <ExternalLink className="size-3.5" /> Etsy
        </a>
      </div>

      {/* promptlar */}
      <div className="flex flex-col gap-2 px-4 pt-1 pb-3 pl-5">
        <PromptBlock label="Flat-lay Prompt" text={it.p} tone="flat" defaultOpen />
        <PromptBlock label="Model / 2. Açı" text={it.mp} tone="model" />
        <PromptBlock label="Negatif" text={it.n} tone="neg" />
      </div>

      {/* üretildi işareti */}
      <div className="mt-auto px-4 pb-4 pl-5">
        <button
          type="button"
          aria-pressed={done}
          onClick={() => onToggle(it.id, !done)}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors",
            done
              ? "border-transparent text-white"
              : "hover:border-[color:var(--gold,#B89347)]",
          )}
          style={
            done
              ? { background: "var(--jade,#2F5D50)" }
              : { borderColor: LINE }
          }
        >
          {done ? (
            <>
              <Check className="size-4" /> Üretildi — geri al
            </>
          ) : (
            <>
              <Circle className="size-4" /> Üretildi olarak işaretle
            </>
          )}
        </button>
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
  // Kopyala düğmesi <summary> İÇİNDE DEĞİL (iç içe etkileşimli öğe ekran
  // okuyucuyu bozar): details'in kardeşi olarak başlık satırının üstüne
  // mutlak konumlanır; klavye sırası da doğal kalır.
  return (
    <div className="relative">
      <details
        open={defaultOpen}
        className="group bg-muted/30 overflow-hidden rounded-xl border"
        style={{ borderColor: LINE }}
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 pr-28 text-[13px] font-semibold select-none [&::-webkit-details-marker]:hidden">
          <span
            className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase"
            style={{ background: t.bg, color: t.fg }}
          >
            {label}
          </span>
          <ChevronRight className="text-muted-foreground ml-auto size-4 transition-transform group-open:rotate-90" />
        </summary>
        <div className="px-3 pb-3">
          <p className="text-muted-foreground font-mono text-[12px] leading-relaxed break-words whitespace-pre-wrap">
            {text}
          </p>
        </div>
      </details>
      <button
        type="button"
        onClick={() => copyText(text)}
        className="text-muted-foreground hover:text-foreground bg-card absolute top-1.5 right-9 inline-flex min-h-7 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold transition-colors pointer-coarse:min-h-10 pointer-coarse:px-3 hover:border-[color:var(--gold,#B89347)]"
        style={{ borderColor: LINE }}
        aria-label={`${label} metnini kopyala`}
      >
        <Copy className="size-3" /> Kopyala
      </button>
    </div>
  );
}
