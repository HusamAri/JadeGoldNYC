"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { inviteMember } from "@/app/(dashboard)/ayarlar/ekip/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function InviteForm() {
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    startTransition(async () => {
      const res = await inviteMember(email);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Davet gönderildi");
      setEmail("");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="email"
            placeholder="ornek@eposta.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="sm:max-w-xs"
          />
          <Button type="submit" disabled={pending}>
            <UserPlus className="size-4" />
            {pending ? "Gönderiliyor…" : "Davet Gönder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
