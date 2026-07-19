"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Store,
  Plug,
  Truck,
  UserRound,
  UsersRound,
  Scale,
  Sparkles,
  Rocket,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

export type SettingsHubProps = {
  orgName: string;
  currency: string;
  role: string;
  etsyConnected: boolean;
  etsyLastSync: string | null;
  shipStationConfigured: boolean;
  profileName: string | null;
  profileEmail: string | null;
  avatarUrl: string | null;
};

type Tile = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status?: { live: boolean; label: string; detail?: string | null };
  featured?: boolean;
};

const ease = [0.32, 0.72, 0, 1] as const;

export function SettingsHub(props: SettingsHubProps) {
  const reduce = useReducedMotion();
  const liveCount =
    (props.etsyConnected ? 1 : 0) + (props.shipStationConfigured ? 1 : 0);

  const connections: Tile[] = [
    {
      href: "/ayarlar/etsy",
      title: "Etsy",
      description: "Mağaza bağlantısı, sipariş ve ürün senkronu",
      icon: Plug,
      featured: true,
      status: {
        live: props.etsyConnected,
        label: props.etsyConnected ? "Canlı" : "Kapalı",
        detail: props.etsyLastSync,
      },
    },
    {
      href: "/ayarlar/shipstation",
      title: "ShipStation",
      description: "Gönderi maliyeti, postaj ve takip senkronu",
      icon: Truck,
      featured: true,
      status: {
        live: props.shipStationConfigured,
        label: props.shipStationConfigured ? "Hazır" : "Bekliyor",
      },
    },
  ];

  const operations: Tile[] = [
    {
      href: "/ayarlar/ekip",
      title: "Ekip",
      description: "Üyeler, roller ve davetler",
      icon: UsersRound,
    },
    {
      href: "/ayarlar/altin",
      title: "Altın maliyet",
      description: "Alım fiyatı, işçilik ve fiyat kaynağı",
      icon: Scale,
    },
    {
      href: "/ayarlar/profil",
      title: "Profil",
      description: "Ad ve fotoğraf",
      icon: UserRound,
    },
  ];

  const strategy: Tile[] = [
    {
      href: "/ayarlar/etsy-guncellemeleri",
      title: "Etsy güncellemeleri",
      description: "Platformdan elenmiş öneriler",
      icon: Sparkles,
    },
    {
      href: "/ayarlar/buyume-stratejisi",
      title: "Büyüme stratejisi",
      description: "90 günlük SEO + AEO planı",
      icon: Rocket,
    },
  ];

  return (
    <div className="settings-hub relative isolate pb-24">
      {/* Atmosphere — soft neon orbs + grain; fixed overlay for perf */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-8 h-[420px] overflow-hidden"
      >
        <div className="absolute -top-24 left-[8%] size-[280px] rounded-full bg-[radial-gradient(circle,rgb(169_155_255/0.28),transparent_68%)] blur-2xl dark:bg-[radial-gradient(circle,rgb(169_155_255/0.35),transparent_68%)]" />
        <div className="absolute top-10 right-[4%] size-[220px] rounded-full bg-[radial-gradient(circle,rgb(90_169_240/0.22),transparent_70%)] blur-2xl" />
        <div className="absolute top-28 left-[42%] size-[180px] rounded-full bg-[radial-gradient(circle,rgb(240_164_78/0.18),transparent_70%)] blur-2xl" />
      </div>

      {/* Editorial index */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="relative mb-8 space-y-4"
      >
        <div aria-hidden className="idx">
          <span>Ayarlar</span>
          <span className="idx-bar" />
          <span className="idx-ln" />
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-2">
            <h1 className="h-display display-emboss text-4xl md:text-5xl">
              Marka <em>odası</em>
            </h1>
            <p className="text-engraved text-muted-foreground text-sm leading-relaxed">
              Bağlantılar, ekip ve maliyet tek yüzeyde. Cam + kabartma paneller;
              canlı bağlantılar neon nabızla işaretlenir.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PulseChip
              live={liveCount > 0}
              label={`${liveCount}/2 bağlantı aktif`}
            />
            <span className="text-muted-foreground font-mono text-[10px] tracking-[0.18em] uppercase">
              {props.role}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Hero identity — double bezel */}
      <motion.section
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.06, ease }}
        className="relative mb-10"
      >
        <div className="rounded-[2rem] border border-black/[0.06] bg-[linear-gradient(145deg,rgb(255_255_255/0.55),rgb(163_177_198/0.18))] p-1.5 shadow-[var(--shadow-hover)] dark:border-white/5 dark:bg-white/[0.03] dark:shadow-[0_28px_60px_rgb(0_0_0/0.45),0_0_40px_rgb(169_155_255/0.12)]">
          <div className="relative overflow-hidden rounded-[calc(2rem-0.375rem)] border border-[color:var(--glass-border)] [background-color:var(--glass-strong)] [background-image:var(--glass-sheen),var(--glass-tint)] shadow-[var(--glass-highlight),var(--glass-depth),var(--lift)] [backdrop-filter:var(--glass-filter)] dark:[background-color:var(--lume-panel)] dark:[background-image:radial-gradient(120%_90%_at_12%_-20%,oklch(0.45_0.12_278/0.35),transparent_55%),linear-gradient(180deg,oklch(1_0_0/0.04),transparent)] dark:shadow-[var(--lume-hi),var(--lift),0_0_48px_rgb(169_155_255/0.18)]">
            <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <span className="nm-raised flex size-12 items-center justify-center rounded-2xl dark:bg-white/5 dark:shadow-[var(--lume-hi),var(--lume-glow)]">
                    <Store className="size-5 text-[color:var(--gold-deep,#8a6a2f)] dark:text-[#e8ebff]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-muted-foreground font-mono text-[10px] tracking-[0.2em] uppercase">
                      Aktif şirket
                    </p>
                    <h2 className="h-display text-2xl tracking-tight md:text-3xl">
                      {props.orgName}
                    </h2>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MetaCell label="Para birimi" value={props.currency} />
                  <MetaCell label="Rol" value={props.role} capitalize />
                  <MetaCell
                    label="Senkron"
                    value={
                      props.etsyConnected
                        ? props.etsyLastSync ?? "Bağlı"
                        : "Etsy kapalı"
                    }
                  />
                </dl>
              </div>

              <Link
                href="/ayarlar/profil"
                className="group relative flex items-center gap-4 rounded-[1.4rem] border border-white/40 bg-white/35 p-4 shadow-[var(--shadow-raised-sm)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[var(--lume-hi),0_16px_40px_rgb(0_0_0/0.35)]"
              >
                <div className="relative">
                  <UserAvatar
                    src={props.avatarUrl}
                    name={props.profileName}
                    email={props.profileEmail}
                    className="size-14 shadow-[var(--lift-sm)] ring-2 ring-white/50 dark:ring-white/15"
                  />
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgb(52_211_153/0.85)] ring-2 ring-white dark:ring-[#262935]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {props.profileName || "Profili tamamla"}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {props.profileEmail ?? "—"}
                  </p>
                </div>
                <ArrowUpRight className="text-muted-foreground size-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.section>

      <Section
        title="Bağlantılar"
        subtitle="Canlı nabız: entegrasyon durumu neon ile okunur."
        delay={0.1}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {connections.map((t, i) => (
            <SettingsTile key={t.href} tile={t} index={i} large />
          ))}
        </div>
      </Section>

      <Section
        title="Operasyon"
        subtitle="Ekip, maliyet ve kişisel profil."
        delay={0.16}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {operations.map((t, i) => (
            <SettingsTile key={t.href} tile={t} index={i} />
          ))}
        </div>
      </Section>

      <Section
        title="Strateji"
        subtitle="Platform sinyalleri ve büyüme planı."
        delay={0.22}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {strategy.map((t, i) => (
            <SettingsTile key={t.href} tile={t} index={i} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  delay,
  children,
}: {
  title: string;
  subtitle: string;
  delay: number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay, ease }}
      className="relative mb-10 space-y-4"
    >
      <div>
        <h3 className="h-display text-xl md:text-2xl">{title}</h3>
        <p className="text-muted-foreground mt-1 max-w-[48ch] text-sm">
          {subtitle}
        </p>
      </div>
      {children}
    </motion.section>
  );
}

function SettingsTile({
  tile,
  index,
  large,
}: {
  tile: Tile;
  index: number;
  large?: boolean;
}) {
  const reduce = useReducedMotion();
  const Icon = tile.icon;
  const live = tile.status?.live;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay: index * 0.05, ease }}
    >
      <Link
        href={tile.href}
        className={cn(
          "group relative block rounded-[1.75rem] border border-black/[0.06] bg-[linear-gradient(145deg,rgb(255_255_255/0.5),rgb(163_177_198/0.16))] p-1.5 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] active:scale-[0.985] dark:border-white/5 dark:bg-white/[0.03]",
          large && "min-h-[168px]",
          live &&
            "shadow-[0_0_0_1px_rgb(52_211_153/0.25),0_0_28px_rgb(52_211_153/0.18)] dark:shadow-[0_0_0_1px_rgb(52_211_153/0.35),0_0_36px_rgb(52_211_153/0.28)]",
        )}
      >
        <div
          className={cn(
            "relative h-full overflow-hidden rounded-[calc(1.75rem-0.375rem)] border border-[color:var(--glass-border)] [background-color:var(--glass)] [background-image:var(--nm-convex),var(--glass-sheen)] shadow-[var(--shadow-raised),var(--glass-highlight)] [backdrop-filter:var(--glass-filter-sm)] dark:border-white/10 dark:[background-color:var(--lume-panel)] dark:[background-image:linear-gradient(160deg,oklch(1_0_0/0.06),transparent_45%)] dark:shadow-[var(--lume-hi),0_18px_40px_rgb(0_0_0/0.4)] dark:[backdrop-filter:none]",
            live &&
              "border-emerald-400/35 shadow-[var(--shadow-raised),0_0_24px_rgb(52_211_153/0.22)] dark:border-emerald-300/40 dark:shadow-[var(--lume-hi),var(--lume-glow),0_18px_40px_rgb(0_0_0/0.4),0_0_32px_rgb(52_211_153/0.35)]",
          )}
        >
          {/* Neon edge lamp */}
          {tile.status && (
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute -inset-x-4 -top-8 h-16 blur-2xl transition-opacity duration-700",
                live
                  ? "bg-[radial-gradient(ellipse_at_center,rgb(52_211_153/0.45),transparent_70%)] opacity-90"
                  : "bg-[radial-gradient(ellipse_at_center,rgb(148_163_184/0.25),transparent_70%)] opacity-50",
              )}
            />
          )}

          <div
            className={cn(
              "relative flex h-full flex-col gap-4 p-5",
              large && "p-6",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-2xl shadow-[var(--shadow-raised-sm)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105",
                  "[background-image:var(--nm-convex)] dark:bg-white/5 dark:shadow-[var(--lume-hi)]",
                  live && "dark:shadow-[var(--lume-hi),var(--lume-glow)]",
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    live
                      ? "text-emerald-600 dark:text-emerald-300 dark:[filter:drop-shadow(0_0_8px_rgb(110_231_183/0.7))]"
                      : "text-foreground/80",
                  )}
                />
              </span>
              <div className="flex items-center gap-2">
                {tile.status && (
                  <PulseChip
                    live={Boolean(live)}
                    label={tile.status.label}
                    compact
                  />
                )}
                <span className="nm-pressed flex size-8 items-center justify-center rounded-full dark:bg-black/30 dark:shadow-[var(--lume-pit)]">
                  <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>

            <div className="mt-auto space-y-1">
              <h4
                className={cn(
                  "font-semibold tracking-tight",
                  large ? "text-xl" : "text-base",
                )}
              >
                {tile.title}
              </h4>
              <p className="text-muted-foreground text-sm leading-snug">
                {tile.description}
              </p>
              {tile.status?.detail && (
                <p className="text-muted-foreground/80 pt-1 font-mono text-[10px] tracking-wide">
                  Son sync · {tile.status.detail}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function MetaCell({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="nm-pressed rounded-2xl px-3 py-2.5 dark:bg-black/25 dark:shadow-[var(--lume-pit)]">
      <dt className="text-muted-foreground font-mono text-[9px] tracking-[0.16em] uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 text-sm font-semibold tabular-nums",
          capitalize && "capitalize",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function PulseChip({
  live,
  label,
  compact,
}: {
  live: boolean;
  label: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        live
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-700 shadow-[0_0_18px_rgb(52_211_153/0.25)] dark:text-emerald-200 dark:shadow-[0_0_22px_rgb(52_211_153/0.35)]"
          : "border-black/10 bg-black/[0.03] text-muted-foreground dark:border-white/10 dark:bg-white/5",
      )}
    >
      <span className="relative flex size-1.5">
        {live && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex size-1.5 rounded-full",
            live ? "bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153)]" : "bg-slate-400",
          )}
        />
      </span>
      {label}
    </span>
  );
}
