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
      {/* Platform paneli (geniş ekran) — Spatial hero sahnesi: lavanta radyal
          zemin (body) üstünde blur'lu indigo/peri orb'lar + inci küreler
          (ref: Spatial .orbs — 360/300/220px blur(46px), pearl 44/30px),
          serif wordmark + indigo orb marka ve California Paradise em başlık. */}
      <div className="bg-background relative hidden overflow-hidden lg:block">
        <div aria-hidden className="absolute inset-0 overflow-hidden dark:opacity-40">
          <span className="absolute top-[60px] left-[2%] size-[360px] rounded-full bg-[oklch(0.66_0.20_285/0.45)] opacity-90 blur-[46px]" />
          <span className="absolute top-[180px] right-[4%] size-[300px] rounded-full opacity-60 blur-[46px] [background-image:var(--grad-holo)]" />
          <span className="absolute top-[340px] left-[40%] size-[220px] rounded-full bg-[oklch(0.66_0.20_285/0.45)] opacity-50 blur-[46px]" />
          <span className="absolute top-[300px] left-[14%] size-[120px] rounded-[60%_40%_50%_50%/50%] bg-white shadow-[0_20px_50px_rgba(80,80,120,0.12)]" />
          <span className="absolute top-[180px] left-[8%] size-[44px] rounded-full shadow-[var(--lift-sm)] [background:radial-gradient(circle_at_32%_28%,#ffffff,#e9e6f3_62%,#cfccdd_120%)]" />
          <span className="absolute top-[430px] right-[24%] size-[30px] rounded-full shadow-[var(--lift-sm)] [background:radial-gradient(circle_at_32%_28%,#ffffff,#e9e6f3_62%,#cfccdd_120%)]" />
        </div>
        {/* Dekoratif iridesan cam obje — cutout doktrini: yumuşak taban +
            keskin temas gölgesi çifti (ref: Spatial .obj / .cutout). */}
        <Image
          src="/brand/platform/holo-prism.webp"
          alt=""
          aria-hidden
          width={539}
          height={499}
          priority
          className="pointer-events-none absolute top-[13%] right-[7%] w-64 rotate-[8deg] select-none [filter:drop-shadow(0_14px_18px_rgba(50,46,86,0.42))_drop-shadow(0_2px_1px_rgba(66,62,98,0.34))] xl:w-80"
        />
        <div className="relative flex h-full flex-col justify-between p-10">
          {/* Marka — Spatial .navglass .brand: 22px indigo orb + serif
              wordmark (600 · 20px · -.01em), gap 10px. */}
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="size-[22px] shrink-0 rounded-full [background-image:var(--grad-holo-radial)] [box-shadow:0_0_24px_rgb(157_140_255/0.35),inset_0_1px_1px_rgb(255_255_255/0.9),inset_0_-2px_5px_rgb(91_76_196/0.35)]"
            />
            <span className="text-foreground text-xl leading-none font-semibold tracking-[-0.01em] [font-family:var(--font-serif)]">
              AMULETTA
            </span>
          </div>
          <div>
            {/* Editorial index etiketi — mono, uppercase; kısa vurgu çizgisi
                + sağa uzayan ince kural (.idx-bar / .idx-ln). */}
            <p className="idx">
              <span aria-hidden className="idx-bar" />
              Yönetim Platformu
              <span aria-hidden className="idx-ln" />
            </p>
            {/* Büyük sans başlık — Spatial hero h1 formu (700 · 1.02 ·
                -.025em); em = font-display (tek kullanım yeri). */}
            <h2 className="display-emboss text-foreground mt-4 font-sans text-7xl leading-[1.02] font-bold tracking-tight">
              <em className="text-primary font-medium italic [font-family:var(--font-display)]">
                Amuletta
              </em>
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
          {/* Kolofon — mono, hafif letterspaced (rakamlar tabular). */}
          <p className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] tabular-nums pl-10">
            © {new Date().getFullYear()} Amuletta · Gizli · İç Kullanım
          </p>
        </div>
      </div>

      {/* Giriş formu — cam kart, arkasındaki holo ambiyansın ÜSTÜNDE yüzer
          (kolon şeffaf; düz opak zemin yok). */}
      <div className="relative flex items-center justify-center p-6">
        {/* Cam form kartı (Card = Spatial glass + lift + 1px beyaz hairline)
            + köşe işaretleri: 46px · 2.5px oklch(0.78 0.09 285/.85) yalnız
            köşe yayları, radius 20px, ofset -30/-26px (ref: .hero-head .corner). */}
        <div className="relative w-full max-w-sm">
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
            {/* Marka wordmark'ı — Spatial serif brand dili (600 · -.01em). */}
            <CardTitle className="text-2xl tracking-[-0.01em] [font-family:var(--font-serif)]">
              AMULETTA
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
              {/* Liquid/04 lbtn.link formu: mürekkep metin; alt çizgi 1px,
                  hover'da soldan scaleX(0→1), .4s premium ease. */}
              <button
                type="button"
                onClick={() => setMode(signup ? "signin" : "signup")}
                className="text-foreground relative after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-[400ms] after:ease-[var(--ease-premium)] hover:after:scale-x-100"
              >
                {signup ? "Giriş yapın" : "Hesap oluşturun"}
              </button>
            </p>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
