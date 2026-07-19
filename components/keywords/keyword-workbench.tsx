"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

import {
  researchKeywordsAction,
  saveKeywordAction,
  removeSavedKeywordAction,
} from "@/app/(dashboard)/anahtar-kelime/actions";
import type { KeywordCandidate } from "@/lib/keywords/types";
import type { KeywordIdeaRow } from "@/lib/db/queries/keyword-ideas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ApiCredentialGuide,
  KEYWORD_API_GUIDES,
} from "@/components/setup/api-credential-guide";

const SOURCE_LABEL: Record<string, string> = {
  rule: "kural",
  ai: "AI",
  dataforseo: "talep",
  google_ads: "google",
  etsy: "etsy",
  manual: "manuel",
};

export function KeywordWorkbench({
  products,
  saved,
  initialSources,
}: {
  products: { id: string; title: string }[];
  saved: KeywordIdeaRow[];
  /** Sunucudan gelen anlık kaynak durumu — sayfa açılır açılmaz rehber görünsün. */
  initialSources: { ai: boolean; demand: boolean };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [seed, setSeed] = useState("");
  const [productId, setProductId] = useState<string>("");
  const [candidates, setCandidates] = useState<KeywordCandidate[]>([]);
  const [sources, setSources] = useState(initialSources);
  const savedSet = new Set(saved.map((s) => s.keyword.toLowerCase()));

  function onResearch() {
    if (!seed.trim() && !productId) {
      toast.error("Bir tohum kelime girin veya ürün seçin.");
      return;
    }
    startTransition(async () => {
      const res = await researchKeywordsAction(seed, productId || null);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCandidates(res.data.candidates);
      setSources(res.data.sources);
      if (res.data.candidates.length === 0)
        toast.info("Aday bulunamadı — farklı bir tohum deneyin.");
    });
  }

  function onSave(c: KeywordCandidate) {
    startTransition(async () => {
      const res = await saveKeywordAction(c, seed, productId || null);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Kaydedildi");
      router.refresh();
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      const res = await removeSavedKeywordAction(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Çıkarıldı");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Arama formu */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Tohum kelime (ör. gold cuban chain)"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onResearch();
                }
              }}
            />
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="border-input bg-transparent focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] sm:w-64"
            >
              <option value="">Ürün bağlamı (opsiyonel)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title.length > 48 ? p.title.slice(0, 48) + "…" : p.title}
                </option>
              ))}
            </select>
            <Button onClick={onResearch} disabled={pending}>
              <Search className="size-4" />
              Araştır
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Kaynaklar:</span>
            <Badge variant={sources.demand ? "success" : "secondary"}>
              talep {sources.demand ? "bağlı" : "kapalı"}
            </Badge>
            <Badge variant={sources.ai ? "success" : "secondary"}>
              <Sparkles className="size-3" />
              AI {sources.ai ? "açık" : "kapalı"}
            </Badge>
            {!sources.demand && !sources.ai && (
              <span className="text-muted-foreground">
                Şu an yalnız kural motoru çalışıyor.
              </span>
            )}
          </div>

          {(!sources.demand || !sources.ai) && (
            <ApiCredentialGuide
              items={[
                ...(!sources.ai ? [KEYWORD_API_GUIDES.ai] : []),
                ...(!sources.demand ? [KEYWORD_API_GUIDES.demand] : []),
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Adaylar */}
      {candidates.length > 0 && (
        <Card>
          <CardContent className="space-y-3">
            <h3 className="font-semibold">Aday anahtar kelimeler</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="py-1.5 pr-3 font-medium">Anahtar kelime</th>
                    <th className="px-3 py-1.5 font-medium">Kaynak</th>
                    <th className="px-3 py-1.5 text-right font-medium">Hacim</th>
                    <th className="px-3 py-1.5 text-right font-medium">Rekabet</th>
                    <th className="px-3 py-1.5 text-right font-medium">Skor</th>
                    <th className="py-1.5 pl-3 text-right font-medium">Kaydet</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => {
                    const isSaved = savedSet.has(c.keyword.toLowerCase());
                    return (
                      <tr key={c.keyword} className="border-t">
                        <td className="py-2 pr-3 font-medium">{c.keyword}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">
                            {SOURCE_LABEL[c.source] ?? c.source}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {c.searchVolume == null
                            ? "—"
                            : c.searchVolume.toLocaleString("tr-TR")}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {c.competition == null
                            ? "—"
                            : `${Math.round(c.competition * 100)}%`}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {Math.round(c.score)}
                        </td>
                        <td className="py-2 pl-3 text-right">
                          {isSaved ? (
                            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                              <Check className="size-3.5" /> kayıtlı
                            </span>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              disabled={pending}
                              onClick={() => onSave(c)}
                              title="Kaydet"
                            >
                              <Plus className="size-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kaydedilenler */}
      <Card>
        <CardContent className="space-y-3">
          <h3 className="font-semibold">
            Kaydedilen anahtar kelimeler{" "}
            <span className="text-muted-foreground font-normal tabular-nums">
              ({saved.length})
            </span>
          </h3>
          {saved.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Henüz kayıt yok. Yukarıdan araştırın ve beğendiklerinizi kaydedin;
              sonra listing başlık/etiketlerinde kullanın.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {saved.map((s) => (
                <span
                  key={s.id}
                  className="group bg-secondary/60 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
                >
                  <span>{s.keyword}</span>
                  {s.search_volume != null && (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {s.search_volume.toLocaleString("tr-TR")}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(s.id)}
                    disabled={pending}
                    className="text-muted-foreground hover:text-destructive"
                    title="Çıkar"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
