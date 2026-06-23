"use client";

import { useActionState } from "react";
import { Building2, Gem, ShieldCheck, type LucideIcon } from "lucide-react";

import { signIn, type SignInState } from "@/lib/actions/session";
import { Logo } from "@/components/layout/logo";
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

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Marka paneli (geniş ekran) */}
      <BrandTile
        src={BRAND_LOGIN_HERO}
        rounded={false}
        scrim
        className="hidden lg:block"
      >
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div className="flex w-max items-center gap-3 rounded-2xl bg-black/25 px-3 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <Logo />
            <span className="font-semibold tracking-wide">
              JADE GOLD · NEW YORK
            </span>
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
            <CardTitle className="text-xl">Jade Gold NYC</CardTitle>
            <CardDescription>Yönetim paneline giriş yapın</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ornek@jadegoldnyc.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {state.error && (
                <p className="text-destructive text-sm" role="alert">
                  {state.error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Giriş yapılıyor…" : "Giriş yap"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
