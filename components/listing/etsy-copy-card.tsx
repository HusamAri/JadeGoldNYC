"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Etsy'ye kopyala — manuel listing açma akışı için alan alan kopya panosu.
 *
 * Kullanıcı terminal/API akışı yerine Etsy UI'da elle listing açtığında
 * (Shop Manager → Add a listing) her alanı tek tıkla panoya alır. Açıklama
 * SUNUCUDA temizlenmiş gelir (iç `[EON …]` künyesi sökülmüş — push script'in
 * stripInternalTrailer paritesi); burada yalnız gösterim + kopya vardır.
 */
export interface EtsyCopyField {
  label: string;
  value: string;
  /** Çok satırlı alan (açıklama) — textarea ile gösterilir. */
  multiline?: boolean;
  /** Etiket yanında küçük ipucu (ör. karakter sayısı, "virgülle yapıştır"). */
  hint?: string;
}

function CopyFieldRow({ field }: { field: EtsyCopyField }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(field.value);
    } catch {
      // Güvensiz bağlam / izin reddi: sessiz unhandled-rejection yerine söyle.
      toast.error("Panoya kopyalanamadı — metni elle seçip kopyalayın.");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium">{field.label}</span>
        {field.hint && (
          <span className="text-muted-foreground text-xs">{field.hint}</span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto h-7 gap-1.5 px-3 text-xs"
          onClick={copy}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Kopyalandı" : "Kopyala"}
        </Button>
      </div>
      {field.multiline ? (
        <textarea
          readOnly
          value={field.value}
          rows={Math.min(12, Math.max(3, field.value.split("\n").length + 1))}
          className="border-input bg-transparent w-full resize-y rounded-lg border px-3 py-2 font-mono text-xs leading-relaxed"
        />
      ) : (
        <input
          readOnly
          value={field.value}
          className="border-input bg-transparent w-full rounded-lg border px-3 py-2 font-mono text-xs"
        />
      )}
    </div>
  );
}

export function EtsyCopyCard({
  fields,
  setupNote,
}: {
  fields: EtsyCopyField[];
  /** İç künyeden gelen varyasyon/kişiselleştirme kurulum notu (kopyalanmaz,
   *  Etsy'de varyasyonları elle kurarken yol gösterir). */
  setupNote?: string | null;
}) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Etsy&apos;de elle listing açarken (Shop Manager → Add a listing) her
        alanı tek tıkla kopyalayıp karşılığına yapıştırın. Açıklama iç nottan
        arındırılmış halidir — Etsy&apos;ye giden metinle birebir aynı.
      </p>
      {fields.map((f) => (
        <CopyFieldRow key={f.label} field={f} />
      ))}
      {setupNote && (
        <p className="text-muted-foreground border-l-2 pl-3 text-xs leading-relaxed">
          <span className="text-foreground font-medium">Kurulum notu: </span>
          {setupNote}
        </p>
      )}
    </div>
  );
}
