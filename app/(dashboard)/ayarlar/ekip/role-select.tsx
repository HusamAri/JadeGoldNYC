"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateMemberRole } from "@/app/(dashboard)/ayarlar/ekip/actions";
import { ROLES } from "@/lib/constants";
import type { Role } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function RoleSelect({
  memberRowId,
  role,
}: {
  memberRowId: string;
  role: Role;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onChange(value: string) {
    const newRole = value as Role;
    if (newRole === role) return;
    startTransition(async () => {
      const res = await updateMemberRole(memberRowId, newRole);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Rol güncellendi");
      router.refresh();
    });
  }

  return (
    <Select value={role} onValueChange={onChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
