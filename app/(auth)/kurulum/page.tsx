import Link from "next/link";

import { requireUser, getMembership } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";
import { SetupForm } from "@/app/(auth)/kurulum/setup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Şirket Kurulumu" };

/**
 * Site içinden şirket kurulum sihirbazı. İki giriş yolu:
 *  1) Yeni kullanıcı (davetsiz kayıt) — hiçbir şirkete üye değil, buraya
 *     yönlendirilir ve kendi şirketini kurar.
 *  2) Mevcut kullanıcı — şirket seçicideki "Yeni şirket kur" ile ikinci
 *     (üçüncü…) şirketini ekler; kurulum sonrası aktif şirket yenisi olur.
 */
export default async function KurulumPage() {
  await requireUser();
  const membership = await getMembership();
  const hasOrg = membership != null;

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      {/* Spatial hero dili — lavanta ambiyans (auth layout) üstünde cam kart
          + köşe işaretleri (46px · 2.5px oklch(0.78 0.09 285/.85) · r20). */}
      <div className="relative w-full max-w-md">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-[26px] -left-[30px] hidden size-[46px] rounded-tl-[20px] border-t-[2.5px] border-l-[2.5px] border-[oklch(0.78_0.09_285/0.85)] sm:block dark:border-[oklch(0.78_0.09_285/0.45)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-[26px] -right-[30px] hidden size-[46px] rounded-tr-[20px] border-t-[2.5px] border-r-[2.5px] border-[oklch(0.78_0.09_285/0.85)] sm:block dark:border-[oklch(0.78_0.09_285/0.45)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-[26px] -left-[30px] hidden size-[46px] rounded-bl-[20px] border-b-[2.5px] border-l-[2.5px] border-[oklch(0.78_0.09_285/0.85)] sm:block dark:border-[oklch(0.78_0.09_285/0.45)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-[30px] -bottom-[26px] hidden size-[46px] rounded-br-[20px] border-r-[2.5px] border-b-[2.5px] border-[oklch(0.78_0.09_285/0.85)] sm:block dark:border-[oklch(0.78_0.09_285/0.45)]"
        />
        <Card className="sheen-sweep w-full">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex justify-center">
            <Logo className="size-11" />
          </div>
          {/* Serif başlık — lab h2 dili (serif 500, sıkı tracking). */}
          <CardTitle className="text-2xl font-medium tracking-[-0.02em] [font-family:var(--font-serif)]">
            {hasOrg ? "Yeni şirket kur" : "Şirketinizi kurun"}
          </CardTitle>
          <CardDescription>
            {hasOrg
              ? "Panele ikinci bir şirket eklersiniz; kurulumdan sonra aktif şirket yenisi olur, şirket seçiciden geçiş yapabilirsiniz."
              : "Panel bu şirket altında çalışır: satışlar, maliyetler, ekip ve entegrasyonlar (Etsy, ShipStation) şirkete özeldir. Maliyet kategorileri otomatik hazırlanır; Etsy bağlantısını kurulumdan sonra Ayarlar'dan yaparsınız."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SetupForm />
          {hasOrg && (
            <p className="text-muted-foreground text-center text-sm">
              {/* Liquid/04 lbtn.link formu — alt çizgi soldan çizilir. */}
              <Link
                href="/panel"
                className="text-foreground relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-[400ms] after:ease-[var(--ease-premium)] hover:after:scale-x-100"
              >
                Vazgeç, panele dön
              </Link>
            </p>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
