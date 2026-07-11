"use client";

import { useActionState, useState } from "react";
import { Building2, Gem, ShieldCheck, type LucideIcon } from "lucide-react";

import { signIn, signUp, type SignInState } from "@/lib/actions/session";
import { Logo } from "@/components/layout/logo";
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
      {/* Platform paneli (geniş ekran) — Artifact kimliği: derin çivit
          mürekkep zemin, faset elmas mark, isim + slogan. Marka görseli/
          videosu yok; platform şirket-nötrdür. */}
      <div className="relative hidden overflow-hidden bg-[oklch(0.2_0.03_268)] lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(820px 520px at 82% -10%, oklch(0.5 0.11 280 / 0.35), transparent 60%), radial-gradient(700px 460px at -8% 108%, oklch(0.45 0.08 250 / 0.28), transparent 55%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
              className="size-10 text-[oklch(0.82_0.09_282)]"
              aria-hidden
            >
              <path d="M12 3 20.5 9.5 12 21 3.5 9.5Z" />
              <path d="M3.5 9.5h17" />
              <path d="M12 3 8.4 9.5 12 21l3.6-11.5Z" />
            </svg>
            <span className="text-xl font-semibold tracking-[0.32em]">
              ARTIFACT
            </span>
          </div>
          <div>
            <h2 className="text-3xl leading-tight font-semibold">
              Yönetim Platformu
            </h2>
            <p className="mt-3 max-w-md text-white/75">
              Satış, maliyet, performans ve şirket hafızası — tüm
              şirketleriniz tek platformda.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              <Value icon={Building2} label="Çok Şirketli" />
              <Value icon={Gem} label="Etsy & ShipStation" />
              <Value icon={ShieldCheck} label="Şirket Hafızası" />
            </div>
          </div>
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Artifact · Gizli · İç Kullanım
          </p>
        </div>
      </div>

      {/* Giriş formu */}
      <div className="bg-muted/30 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex justify-center">
              <Logo className="size-11" />
            </div>
            <CardTitle className="text-lg tracking-[0.3em]">
              ARTIFACT
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
