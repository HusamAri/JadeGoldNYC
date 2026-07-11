"use client";

import { useActionState, useState } from "react";
import { Building2, Gem, ShieldCheck, type LucideIcon } from "lucide-react";

import { signIn, signUp, type SignInState } from "@/lib/actions/session";
import { Logo } from "@/components/layout/logo";
import { AnimatedLogo } from "@/components/brand/animated-logo";
import { BrandTile } from "@/components/brand/brand-tile";
import { BRAND_LOGIN_HERO } from "@/lib/brand-assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: SignInState = {};

function Value({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-white/90">
      <Icon className="size-4" />
      {label}
    </div>
  );
}

function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const signup = mode === "signup";
  const [state, formAction, pending] = useActionState(
    signup ? signUp : signIn,
    initialState,
  );

  if (state.confirmEmail) {
    return (
      <p className="text-sm leading-relaxed" role="status">
        Hesabınız oluşturuldu. E-postanıza gelen doğrulama bağlantısına
        tıklayın; ardından giriş yapıp şirketinizi kurabilirsiniz.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {signup && (
        <div className="space-y-2">
          <Label htmlFor="full_name">Ad Soyad</Label>
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            placeholder="Adınız Soyadınız"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ornek@sirketiniz.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={signup ? 8 : undefined}
          required
        />
      </div>
      {state.error && (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? signup
            ? "Hesap oluşturuluyor…"
            : "Giriş yapılıyor…"
          : signup
            ? "Hesap oluştur"
            : "Giriş yap"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const signup = mode === "signup";

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Marka paneli (geniş ekran) */}
      <BrandTile
        src={BRAND_LOGIN_HERO}
        video="/brand/video/atolye-el-isciligi.mp4"
        rounded={false}
        scrim
        className="hidden lg:block"
      >
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="w-max rounded-2xl bg-black/25 px-4 py-2.5 ring-1 ring-white/15 backdrop-blur-sm">
            <AnimatedLogo
              src="/brand/logo/logo-primary.svg"
              viewBox="150 772 1744 507"
              alt="Jade Gold NYC"
              className="h-14"
            />
          </div>
          <div>
            <h2 className="text-3xl leading-tight font-semibold">
              Yönetim Paneli
            </h2>
            <p className="mt-3 max-w-md text-white/80">
              Satış, maliyet, performans ve şirket hafızası — mağazanızın tüm
              süreçleri tek panelde.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <Value icon={Building2} label="New York" />
              <Value icon={Gem} label="10K & 14K Som Altın" />
              <Value icon={ShieldCheck} label="Şirket Hafızası" />
            </div>
          </div>
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Jade Gold NYC · Gizli · İç Kullanım
          </p>
        </div>
      </BrandTile>

      {/* Giriş formu */}
      <div className="bg-muted/30 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex justify-center lg:hidden">
              <Logo className="size-11" />
            </div>
            <CardTitle className="flex justify-center">
              <AnimatedLogo
                src="/brand/logo/logo-wordmark.svg"
                viewBox="187 872 1656 304"
                animate
                alt="Jade Gold NYC"
                className="h-9"
              />
            </CardTitle>
            <CardDescription>
              {signup
                ? "Hesap oluşturun — sonra şirketinizi site içinden kurarsınız"
                : "Yönetim paneline giriş yapın"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* key: mod değişince form + aksiyon durumu sıfırlansın */}
            <AuthForm key={mode} mode={mode} />
            <p className="text-muted-foreground text-center text-sm">
              {signup ? "Zaten hesabınız var mı? " : "Hesabınız yok mu? "}
              <button
                type="button"
                onClick={() => setMode(signup ? "signin" : "signup")}
                className="text-foreground underline underline-offset-2"
              >
                {signup ? "Giriş yapın" : "Hesap oluşturun"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
