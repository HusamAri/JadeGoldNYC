import Image from "next/image";

import { getActiveOrg } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * ORG AMBLEM SİSTEMİ — her şirketin paneli KENDİ işaretini taşır (marka
 * görselleri org'a aittir; hardcode yok, aktif org'dan çözülür):
 *   · Jade Gold  → altın JG monogramı (mevcut vektör: monogram-jg.svg)
 *   · Seselka    → S& monogramı (sıcak gri + kiremit nokta; şeffaf PNG)
 *   · EON        → çerçeveli EON monogramı (marka kılavuzundan çıkarıldı)
 *   · diğer/yok  → Amuletta platform işareti (nötr düşüş)
 *
 * Üç editoryal yüzey:
 *   <OrgEmblemBackdrop /> — DEV arka plan filigranı: sağ-alt negatif alanda,
 *     kısmen kadraj dışına taşan, çok düşük opaklıkta işaret (her sayfada).
 *   <OrgEmblemSignature /> — köşe imzası: viewport sağ-alt köşesinde küçük,
 *     sakin işaret (negatif alanda; tıklamayı engellemez).
 *   <OrgEmblemMini /> — satır içi mini işaret (PageHeader idx kuyruğu).
 */

interface EmblemDef {
  src: string;
  alt: string;
  /** Görselin doğal en/boy oranına uyan kap sınıfı (object-contain ile). */
  ratio: string;
  /** Koyu tema düzeltmesi — ör. koyu mürekkepli işaret ters çevrilir. */
  darkFix?: string;
}

function emblemFor(slug: string | null | undefined): EmblemDef {
  const s = slug ?? "";
  if (s.startsWith("jade"))
    return {
      src: "/brand/logo/monogram-jg.svg",
      alt: "Jade Gold NYC",
      ratio: "aspect-[839/640]",
    };
  if (s.startsWith("seselka"))
    return {
      src: "/brand/orgs/seselka-mark.png",
      alt: "Seselka Home",
      ratio: "aspect-[1139/1266]",
    };
  if (s.startsWith("eon"))
    return {
      src: "/brand/orgs/eon-monogram.svg",
      alt: "EON",
      ratio: "aspect-square",
      // Monogram #1C1C1C mürekkep — koyu zeminde ters çevrilir.
      darkFix: "dark:invert",
    };
  return {
    src: "/brand/platform/app-icon/amuletta-mark.svg",
    alt: "Amuletta",
    ratio: "aspect-square",
    darkFix: "dark:invert",
  };
}

/**
 * DEV arka plan filigranı — sağ-alt negatif alanda, kadrajdan hafif taşar;
 * içerikle yarışmasın diye çok düşük opaklık + negatif z (holo-drift -10,
 * lux-grain -9'un üstünde, içeriğin altında). Üst kenarı yumuşak maske ile
 * zemine erir (sert kesik yok — editorial, "basılı filigran" hissi).
 */
export async function OrgEmblemBackdrop() {
  const org = await getActiveOrg();
  const e = emblemFor(org?.slug);
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed -right-[6vw] -bottom-[8vh] -z-[8] h-[62vh] select-none",
        e.ratio,
        "opacity-[0.05] dark:opacity-[0.07]",
        "[mask-image:radial-gradient(120%_120%_at_70%_75%,#000_45%,transparent_92%)]",
      )}
    >
      <Image
        src={e.src}
        alt=""
        fill
        sizes="60vh"
        priority={false}
        className={cn("object-contain", e.darkFix)}
      />
    </div>
  );
}

/**
 * Köşe imzası — viewport sağ-alt köşesinde küçük, sakin işaret. Sabit durur
 * (scroll'la kaybolmaz), tıklamayı engellemez; dar ekranda gizlenir (köşe
 * mobilde değerli).
 */
export async function OrgEmblemSignature() {
  const org = await getActiveOrg();
  const e = emblemFor(org?.slug);
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed right-5 bottom-4 z-[5] hidden h-9 select-none sm:block",
        e.ratio,
        "opacity-35 dark:opacity-30",
      )}
    >
      <Image
        src={e.src}
        alt=""
        fill
        sizes="48px"
        className={cn("object-contain", e.darkFix)}
      />
    </div>
  );
}

/** Satır içi mini işaret — PageHeader idx kuyruğunda org imzası. */
export async function OrgEmblemMini() {
  const org = await getActiveOrg();
  const e = emblemFor(org?.slug);
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block h-[15px] shrink-0 align-middle",
        e.ratio,
        "opacity-60 dark:opacity-55",
      )}
    >
      <Image
        src={e.src}
        alt=""
        fill
        sizes="20px"
        className={cn("object-contain", e.darkFix)}
      />
    </span>
  );
}
