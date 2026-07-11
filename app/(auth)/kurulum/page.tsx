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
    <div className="bg-muted/30 flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex justify-center">
            <Logo className="size-11" />
          </div>
          <CardTitle>
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
              <Link href="/panel" className="underline underline-offset-2">
                Vazgeç, panele dön
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
