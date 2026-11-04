import type { ReactNode } from "react";
import Link from "next/link";
import {
  Plug,
  Truck,
  UserRound,
  UsersRound,
  Scale,
  ScrollText,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { PageHeader } from "@/components/page-header";
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
};

/**
 * Ayarlar — V7 "düz liste" yapısı: kimlik satırı (şirket, para birimi, rol,
 * senkron), ardından iki hairline liste (Bağlantılar, Operasyon). Cam,
 * kabartma, orb, hareket yok; canlı bağlantı yalnız asit noktayla işaretlenir.
 */
export function SettingsHub(props: SettingsHubProps) {
  const liveCount =
    (props.etsyConnected ? 1 : 0) + (props.shipStationConfigured ? 1 : 0);

  const connections: Tile[] = [
    {
      href: "/ayarlar/etsy",
      title: "Etsy",
      description: "Mağaza bağlantısı, sipariş ve ürün senkronu",
      icon: Plug,
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
      status: {
        live: props.shipStationConfigured,
        label: props.shipStationConfigured ? "Bağlı" : "Bağlı değil",
      },
    },
  ];

  const operations: Tile[] = [
    { href: "/ayarlar/ekip", title: "Ekip", description: "Üyeler, roller ve davetler", icon: UsersRound },
    { href: "/ayarlar/altin", title: "Altın maliyet", description: "Alım fiyatı, işçilik ve fiyat kaynağı", icon: Scale },
    { href: "/ayarlar/profil", title: "Profil", description: "Ad ve fotoğraf", icon: UserRound },
    { href: "/kayitlar", title: "Şirket hafızası", description: "Her değişikliğin denetim kaydı (kim, ne zaman, neyi)", icon: ScrollText },
  ];

  return (
    <div className="flex flex-col gap-8 pb-24">
      <PageHeader
        eyebrow="Sistem · Ayarlar"
        meta={`${liveCount}/2 bağlantı aktif`}
        title="Ayarlar"
        size="md"
        description="Bağlantılar, ekip, maliyet ve profil tek listede. Canlı bağlantı asit noktayla işaretlidir."
        action={
          <Link
            href="/ayarlar/profil"
            className="jg-focus-outline flex items-center gap-3 rounded-full border border-[color:var(--rule)] py-1.5 pr-4 pl-1.5 transition-colors hover:border-[color:var(--hairline)]"
          >
            <UserAvatar src={props.avatarUrl} name={props.profileName} email={props.profileEmail} className="size-8" />
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium leading-tight">{props.profileName || "Profili tamamla"}</span>
              <span className="mono-label block truncate normal-case tracking-[0.04em]">{props.profileEmail ?? "—"}</span>
            </span>
            <ArrowUpRight className="text-muted-foreground size-4" />
          </Link>
        }
      />

      {/* Kimlik satırı — dört mono hücre */}
      <dl className="mono-label grid grid-cols-2 gap-x-8 gap-y-3 border-b border-[color:var(--rule)] pb-5 sm:grid-cols-4">
        <Meta label="Aktif şirket" value={props.orgName} />
        <Meta label="Para birimi" value={props.currency} />
        <Meta label="Rol" value={props.role} />
        <Meta label="Senkron" value={props.etsyConnected ? (props.etsyLastSync ?? "Bağlı") : "Etsy kapalı"} />
      </dl>

      <Section num="A" title="Bağlantılar" note="entegrasyon durumu">
        {connections.map((t) => (
          <Row key={t.href} tile={t} />
        ))}
      </Section>

      <Section num="B" title="Operasyon" note="ekip · maliyet · profil · kayıt">
        {operations.map((t) => (
          <Row key={t.href} tile={t} />
        ))}
      </Section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt>{label}</dt>
      <dd className="text-foreground mt-1 truncate text-[13px] normal-case tracking-normal">{value}</dd>
    </div>
  );
}

function Section({ num, title, note, children }: { num: string; title: string; note: string; children: ReactNode }) {
  return (
    <section>
      <div className="sec-h">
        <span className="num">{num}</span>
        <h2>{title}</h2>
        <span className="mono-label right">{note}</span>
      </div>
      <ul>{children}</ul>
    </section>
  );
}

function Row({ tile }: { tile: Tile }) {
  const Icon = tile.icon;
  const live = tile.status?.live;
  return (
    <li>
      <Link
        href={tile.href}
        className="group jg-focus-outline grid grid-cols-[auto_1fr_auto] items-center gap-x-5 border-b border-[color:var(--rule-2)] py-4 transition-colors hover:bg-[color:var(--bezel)]/60"
      >
        <span className="text-muted-foreground flex size-9 items-center justify-center">
          <Icon className="size-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2.5">
            <span className="h-serif text-[20px] leading-tight">{tile.title}</span>
            {tile.status && (
              <span className="mono-label flex items-center gap-1.5">
                <i className={cn("inline-block size-1.5 rounded-full", live ? "bg-neon shadow-[0_0_6px_var(--neon-glow)]" : "bg-[color:var(--rule)]")} />
                {tile.status.label}
              </span>
            )}
          </span>
          <span className="text-ink-2 mt-0.5 block text-xs">
            {tile.description}
            {tile.status?.detail ? ` · son senkron ${tile.status.detail}` : ""}
          </span>
        </span>
        <ArrowUpRight className="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
      </Link>
    </li>
  );
}
