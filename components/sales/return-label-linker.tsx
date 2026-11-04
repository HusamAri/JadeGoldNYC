"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Unlink } from "lucide-react";

import {
  linkLedgerEntryToSale,
  unlinkSaleCost,
} from "@/app/(dashboard)/satislar/maliyet/actions";
import type { UnlinkedLabelEntry } from "@/lib/db/queries/sale-costs";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * İade/kargo etiketini siparişe ELLE bağla. Etsy API etiket↔sipariş bağı
 * vermez; gidiş etiketi zamanla otomatik eşlenir, iade etiketi (alıcı paketi
 * taratınca kesilir) eşlenemez → adaylar yakınlık sırasıyla listelenir.
 */
export function ReturnLabelLinker({
  saleId,
  candidates,
  linked,
  canEdit,
}: {
  saleId: string;
  candidates: UnlinkedLabelEntry[];
  linked: {
    id: string;
    description: string;
    amount_cents: number;
    currency: string;
    kind: string | null;
  }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  function link(entryId: number, isReturn: boolean) {
    setBusy(String(entryId));
    startTransition(async () => {
      const res = await linkLedgerEntryToSale(
        entryId,
        saleId,
        isReturn ? "return_label" : "shipping_label",
      );
      setBusy(null);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Etiket siparişe bağlandı");
      router.refresh();
    });
  }

  function unlink(costId: string) {
    setBusy(costId);
    startTransition(async () => {
      const res = await unlinkSaleCost(costId);
      setBusy(null);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Bağ çözüldü; kayıt aylık özete döndü");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-muted-foreground text-xs">
          Etsy API iade etiketini siparişe bağlı vermez; ledger&apos;daki
          bağlanmamış etiket kayıtlarından seçin.
        </p>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setOpen((v) => !v)}
          >
            <Link2 />
            {open ? "Adayları gizle" : `Etiket bağla (${candidates.length} aday)`}
          </Button>
        )}
      </div>

      {linked.length > 0 && (
        <ul className="space-y-1">
          {linked.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate">
                <Badge variant="secondary" className="mr-2">
                  {l.kind === "return_label" ? "İade etiketi" : "Etiket"}
                </Badge>
                {l.description}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono tabular-nums">
                  {formatMoney(l.amount_cents, l.currency)}
                </span>
                {canEdit && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={pending && busy === l.id}
                    onClick={() => unlink(l.id)}
                    title="Bağı çöz"
                  >
                    <Unlink className="size-3.5" />
                    <span className="sr-only">Bağı çöz</span>
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="nm-pressed max-h-72 overflow-auto rounded-[1.25rem] p-3">
          {candidates.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              ±45 gün içinde bağlanmamış etiket kaydı yok.
            </p>
          ) : (
            <ul className="divide-border/60 divide-y">
              {candidates.map((c) => (
                <li
                  key={c.entry_id}
                  className="flex items-center justify-between gap-3 py-1.5 text-xs"
                >
                  <span className="flex items-center gap-2">
                    <Badge variant={c.is_return ? "destructive" : "outline"}>
                      {c.is_return ? "İADE" : "gidiş"}
                    </Badge>
                    <span>{formatDate(c.entry_date)}</span>
                    <span className="text-muted-foreground font-mono">
                      {c.ledger_type} · #{c.entry_id}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono tabular-nums">
                      {formatMoney(c.amount_cents, c.currency)}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending && busy === String(c.entry_id)}
                      onClick={() => link(c.entry_id, c.is_return)}
                    >
                      Bağla
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
