# AI Gateway — Jade Gold NYC

Panel, **Vercel AI Gateway** üzerinden LLM çağrıları için hazır altyapıya sahiptir.
Tek sağlayıcıya bağlı kalmadan model slug'ı (`<sağlayıcı>/<model>`) ile çalışır;
ayrı bir sağlayıcı paketi gerekmez.

## Durum

Şu an **altyapı kurulu, özellik bağlı değil**. `lib/ai.ts` anahtar girilene kadar
**inert**'tir (Etsy entegrasyonu gibi) — çağrı yapılırsa `AINotConfiguredError` döner.

## Yapılandırma

| Ortam | Değişken | Nasıl |
|---|---|---|
| Local geliştirme | `AI_GATEWAY_API_KEY` | Vercel → AI Gateway → API Keys'ten üret, `.env.local`'e koy |
| Vercel (prod) | `VERCEL_OIDC_TOKEN` | Deploy sonrası **otomatik** enjekte edilir; anahtara gerek yok |
| (opsiyonel) | `AI_MODEL` | Varsayılan modeli değiştirir (örn. `openai/gpt-5.5`) |

> Anahtarları **asla** koda/sohbete koymayın; yalnızca env. Sızan anahtarı Vercel'den
> hemen **rotate** edin.

## Kullanım

```ts
import { aiGenerateText, isAIConfigured } from "@/lib/ai";

// Server action / route handler içinde:
if (!isAIConfigured()) {
  // UI'da "AI yapılandırılmamış" durumunu göster
}
const ozet = await aiGenerateText({
  system: "Sen bir Etsy mağaza analistisin.",
  prompt: "Şu yorumları temalara ayır: ...",
});
```

Varsayılan model: `anthropic/claude-sonnet-4.6` (güçlü ve hızlı). Tam slug'ları
Vercel AI Gateway model kataloğundan doğrulayın.

## İlk özellik adayları (bağlanmayı bekliyor)

- **Yorum tema & duygu analizi** (Yorumlar modülü) — en doğal başlangıç
- **Rapor özeti** (Raporlar) — dönem verisini yönetici özetine çevir
- **Ürün açıklaması üretici** — Etsy başlık/açıklama taslağı
