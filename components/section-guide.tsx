import { Info, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Veri girişi yapılan bölümlerde bağlamsal kullanım kılavuzu — katlanabilir
 * (native <details>, istemci JS gerektirmez), erişilebilir ve sade. Başlığa
 * tıklayınca açılır; adımları/ipuçlarını `children` olarak verin.
 */
export function SectionGuide({
  title = "Nasıl kullanılır?",
  children,
  defaultOpen = false,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        // Zemine bastırılmış bilgi oluğu (nöromorfik pressed groove).
        "group nm-pressed rounded-[1.25rem]",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-[1.25rem] px-4 py-3 text-sm font-medium select-none">
        <Info className="text-primary size-4 shrink-0" />
        <span>{title}</span>
        <ChevronDown className="text-muted-foreground ml-auto size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="text-muted-foreground border-border/60 space-y-2 border-t px-4 py-3 text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_b]:text-foreground [&_b]:font-medium [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </details>
  );
}
