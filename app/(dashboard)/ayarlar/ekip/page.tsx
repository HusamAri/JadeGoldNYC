import { UsersRound } from "lucide-react";

import { requireMembership } from "@/lib/auth";
import { listOrgMembers } from "@/lib/db/queries/team";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/data-table/delete-button";
import { RoleSelect } from "./role-select";
import { InviteForm } from "./invite-form";
import { removeMember } from "./actions";

export const metadata = { title: "Ekip" };

export default async function EkipPage() {
  const m = await requireMembership();
  const members = await listOrgMembers(m.org_id);
  const isOwner = m.role === "owner";

  return (
    <div className="max-w-3xl">
      <PageHeader title="Ekip" description="Organizasyon üyeleri ve roller" />

      <div className="space-y-4">
        {isOwner && <InviteForm />}

        <Card>
          <CardContent>
            {members.length === 0 ? (
              <EmptyState
                icon={UsersRound}
                title="Üye yok"
                description="Organizasyonda henüz üye bulunmuyor."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Üye</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Katılma Tarihi</TableHead>
                    {isOwner && (
                      <TableHead className="w-1 text-right">İşlem</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((mem) => (
                    <TableRow key={mem.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            src={mem.avatar_url}
                            name={mem.full_name}
                            email={mem.email}
                          />
                          <span className="font-medium">
                            {mem.full_name || mem.email || "İsim eklenmedi"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {mem.email ?? "—"}
                      </TableCell>
                      <TableCell>
                        {isOwner ? (
                          <RoleSelect memberRowId={mem.id} role={mem.role} />
                        ) : (
                          <Badge variant="secondary">
                            {ROLE_LABELS[mem.role]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(mem.created_at)}</TableCell>
                      {isOwner && (
                        <TableCell className="text-right">
                          <DeleteButton
                            action={removeMember}
                            id={mem.id}
                            title="Üyeyi kaldır"
                            description="Bu üye organizasyondan kaldırılacak. Bu işlem geri alınamaz."
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
