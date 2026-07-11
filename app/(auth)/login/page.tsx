"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
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
    <div className="text-foreground/80 flex items-center gap-2.5 text-sm">
      <span className="nm-pressed flex size-8 items-center justify-center rounded-xl">
        <Icon className="text-muted-foreground size-4" />
      </span>
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
      {/* Platform paneli (geniş ekran) — NeumorphGlass kahraman: off-white
          yüzey, arkada yumuşak holo ışıma, nöromorfik "A" karosu ve
          California Paradise display başlık. Görünümün tek kroması holo. */}
      <div className="bg-background relative hidden overflow-hidden lg:block">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(760px 520px at 78% 8%, rgb(212 198 255 / 0.55), transparent 62%), radial-gradient(640px 460px at 8% 92%, rgb(182 220 255 / 0.45), transparent 58%), radial-gradient(520px 380px at 52% 55%, rgb(255 201 230 / 0.28), transparent 60%)",
          }}
        />
        {/* Dekoratif iridesan cam obje — referanslardaki gibi cutout;
            Higgsfield render + Adobe Photoshop API arka plan kaldırma. */}
        <Image
          src="/brand/platform/holo-prism.webp"
          alt=""
          aria-hidden
          width={539}
          height={499}
          priority
          className="pointer-events-none absolute top-[13%] right-[7%] w-64 rotate-[8deg] select-none drop-shadow-[0_34px_54px_rgba(120,100,200,0.38)] xl:w-80"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <span className="nm-raised-sm text-foreground flex size-11 items-center justify-center rounded-2xl pt-1 text-2xl [font-family:var(--font-display)]">
              A
            </span>
            <span className="text-muted-foreground text-sm font-semibold tracking-[0.32em]">
              ARTIFACT
            </span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">
              Yönetim Platformu
            </p>
            <h2 className="text-foreground mt-4 text-7xl leading-none [font-family:var(--font-display)]">
              Artifact
            </h2>
            <p className="text-muted-foreground mt-5 max-w-md">
              Satış, maliyet, performans ve şirket hafızası — tüm
              şirketleriniz tek platformda.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              <Value icon={Building2} label="Çok Şirketli" />
              <Value icon={Gem} label="Etsy & ShipStation" />
              <Value icon={ShieldCheck} label="Şirket Hafızası" />
            </div>
          </div>
          <p className="text-muted-foreground/70 text-xs">
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
