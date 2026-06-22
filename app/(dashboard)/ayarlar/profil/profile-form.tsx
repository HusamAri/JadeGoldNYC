"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";

import { updateProfile, type ProfileState } from "./actions";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ProfileState = {};

export function ProfileForm({
  fullName,
  avatarUrl,
  email,
}: {
  fullName: string;
  avatarUrl: string | null;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, initial);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) toast.success("Profil güncellendi");
    else if (state.error) toast.error(state.error);
  }, [state]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPreview(URL.createObjectURL(f));
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex items-center gap-4">
        <UserAvatar
          src={preview}
          name={fullName}
          email={email}
          className="size-16 text-lg"
        />
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="size-4" />
            Fotoğraf seç
          </Button>
          <p className="text-muted-foreground mt-1.5 text-xs">
            PNG / JPG · en fazla 3 MB
          </p>
          <input
            ref={fileRef}
            type="file"
            name="avatar"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Ad Soyad</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={fullName}
          placeholder="Adınız Soyadınız"
          maxLength={120}
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" value={email} disabled readOnly />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </form>
  );
}
