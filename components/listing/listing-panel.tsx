import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Listing detayında uzun bölümleri katlar — native <details>, JS yok.
 * Özet satırında idx dili + kuyruk (varyant sayısı, eksik gram vb.) kalır;
 * içerik yalnız açılınca yer kaplar. Scroll yükünü burada keseriz.
 */
export function ListingPanel({
  n,
  name,
  tail,
  defaultOpen = false,
  children,
  className,
  id,
}: {
  /** "01", "04" … */
  n: string;
  name: string;
  tail?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <details
      id={id}
      open={defaultOpen}
      className={cn("group/lp scroll-mt-24", className)}
    >
      <Card className="overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-4 select-none [&::-webkit-details-marker]:hidden">
          <div aria-hidden className="idx min-w-0 flex-1">
            <span>
              Listing / {n} · {name}
            </span>
            <span className="idx-bar" />
            <span className="idx-ln" />
            {tail && <span className="normal-case">{tail}</span>}
          </div>
          <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open/lp:rotate-180" />
        </summary>
        <CardContent className="border-border/50 space-y-4 border-t pt-4">
          {children}
        </CardContent>
      </Card>
    </details>
  );
}
