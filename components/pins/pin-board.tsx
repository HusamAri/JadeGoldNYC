"use client";

/* eslint-disable @next/next/no-img-element -- pin cutout'ları küçük statik
   PNG'ler; next/image sarmalayıcısı burada boyut dansı yaratır. */

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { addPin, removePin } from "@/lib/actions/pins";
import type { PinSticker, TargetPin } from "@/lib/pins/meta";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * PIN PANOSU — bir yüzeye (görev/satış/olay/kayıt) iğnelenmiş emaye pinler.
 *
 * Gerçekçilik dili: her pin cutout'u kendi boyalı gölgesini taşır; üstüne
 * CSS kaldırma gölgesi + pin id'sinden türetilen DETERMİNİSTİK asimetri
 * (dönme/dikey kayma/bindirme) eklenir — aynı yere iğnelenen pinler gerçek
 * hayattaki gibi hafif dağınık, yan yana dizilir (kullanıcı kararı; ızgara
 * hizası bilerek YOK). Deterministik olduğu için SSR/istemci aynı çizer.
 *
 * Etkileşim: "+" kullanıcının KENDİ setini açar (setler hesaba özel);
 * kendi iğnelediği pine tıklamak kaldırır. Seti olmayan kullanıcı yalnız
 * mevcut pinleri görür.
 */

/** id → [0,1) — kripto gerektirmeyen küçük deterministik hash (FNV-1a). */
function hash01(s: string, salt: number): number {
  let h = 0x811c9dc5 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const SIZES = {
  sm: { h: 26, overlap: -7, plus: "size-5" },
  md: { h: 42, overlap: -11, plus: "size-6" },
  lg: { h: 60, overlap: -15, plus: "size-7" },
} as const;

export function PinBoard({
  targetType,
  targetId,
  pins,
  myStickers,
  meId,
  size = "md",
  className,
  quietReveal,
}: {
  targetType: "task" | "sale" | "event" | "audit";
  targetId: string;
  pins: TargetPin[];
  /** Kullanıcının kendi seti — boşsa "+" hiç görünmez (salt izleme). */
  myStickers: PinSticker[];
  /** Aktif kullanıcı id'si — yalnız KENDİ pinleri tıkla-kaldır olur. */
  meId?: string;
  size?: keyof typeof SIZES;
  className?: string;
  /**
   * Sakin mod: '+' düğmesi (pin olmasa bile) gizli başlar, verilen ebeveyn
   * grup hover sınıfıyla belirir (ör. "group-hover/tlrow:opacity-100") —
   * yoğun satır yüzeylerinde her satırda artı dursun istemeyiz.
   */
  quietReveal?: string;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const s = SIZES[size];

  const pinEl = (p: TargetPin, i: number) => {
    const rot = (hash01(p.id, 1) - 0.5) * 24; // -12°..12°
    const dy = (hash01(p.id, 2) - 0.5) * (s.h * 0.22);
    const mine = meId != null && p.pinned_by === meId;
    const style = {
      marginLeft: i === 0 ? 0 : s.overlap,
      transform: `rotate(${rot.toFixed(1)}deg) translateY(${dy.toFixed(1)}px)`,
      zIndex: i,
    } as const;
    const img = (
      <img
        src={p.src}
        alt={p.label}
        style={{ height: s.h }}
        className="w-auto max-w-none select-none [filter:drop-shadow(0_2px_2px_rgb(48_42_60/0.28))_drop-shadow(0_7px_10px_rgb(48_42_60/0.22))] dark:[filter:drop-shadow(0_2px_3px_rgb(0_0_0/0.5))_drop-shadow(0_8px_14px_rgb(0_0_0/0.4))]"
      />
    );
    if (!mine)
      return (
        <span
          key={p.id}
          title={`${p.label}${p.by_name ? ` · ${p.by_name}` : ""}`}
          className="relative shrink-0 transition-transform duration-300 ease-[var(--ease-premium)] hover:z-10 hover:-translate-y-0.5 hover:scale-110"
          style={style}
        >
          {img}
        </span>
      );
    return (
      <button
        key={p.id}
        type="button"
        title={`${p.label} — kaldırmak için tıkla`}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await removePin({ pinId: p.id, path: pathname });
            if (r.error) toast.error(r.error);
          })
        }
        className="relative shrink-0 cursor-pointer border-0 bg-transparent p-0 transition-transform duration-300 ease-[var(--ease-premium)] hover:z-10 hover:-translate-y-0.5 hover:scale-110 disabled:opacity-60"
        style={style}
      >
        {img}
      </button>
    );
  };

  return (
    <span
      className={cn(
        "group/pins inline-flex items-center align-middle",
        className,
      )}
      // İğneleme yüzeyinin satır tıklamalarını (Link'li kartlar) yutmasın.
      onClick={(e) => e.stopPropagation()}
    >
      {pins.map(pinEl)}
      {myStickers.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Pin iğnele"
              title="Pin iğnele"
              className={cn(
                "text-muted-foreground/60 hover:text-foreground hover:bg-secondary/60 ml-1 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-dashed border-[color:var(--glass-border)] bg-transparent transition-[color,background-color,opacity] duration-300",
                s.plus,
                // Sakin yüzey: pin yoksa görünür; pin varsa hover'da belirir.
                quietReveal
                  ? cn("opacity-0 focus-visible:opacity-100", quietReveal)
                  : pins.length > 0 &&
                      "opacity-0 group-hover/pins:opacity-100 focus-visible:opacity-100",
              )}
            >
              <Plus className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-muted-foreground font-mono text-[0.65rem] tracking-[0.14em] uppercase">
              Pin setin
            </DropdownMenuLabel>
            <div className="grid grid-cols-4 gap-1 p-1.5">
              {myStickers.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  title={st.label}
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await addPin({
                        targetType,
                        targetId,
                        stickerId: st.id,
                        path: pathname,
                      });
                      if (r.error) toast.error(r.error);
                    })
                  }
                  className="hover:bg-secondary/60 flex aspect-square cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-1.5 transition-[background-color,transform] duration-200 hover:scale-105 disabled:opacity-50"
                >
                  <img
                    src={st.src}
                    alt={st.label}
                    className="max-h-full max-w-full object-contain [filter:drop-shadow(0_2px_4px_rgb(48_42_60/0.25))]"
                  />
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </span>
  );
}
