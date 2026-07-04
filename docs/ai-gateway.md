# AI — Jade Gold NYC

Panel'in LLM çağrıları için **iki sağlayıcı** desteği vardır (`lib/ai.ts`):

1. **Google Gemini** (ücretsiz kota) — `GOOGLE_GENERATIVE_AI_API_KEY` (veya
   `GEMINI_API_KEY`) tanımlıysa **ÖNCELİKLİ** kullanılır. Anahtar
   [aistudio.google.com](https://aistudio.google.com) → "Get API key" ile ücretsiz
   alınır. (Fatura hesabı bağlıysa proje ücretli Tier'a geçer — bkz. ücret notu.)
2. **Vercel AI Gateway** — Gemini anahtarı yoksa devreye girer; tek sağlayıcıya
   bağlı kalmadan model slug'ı (`<sağlayıcı>/<model>`) ile çalışır.

## Durum

**Bağlı ve kullanımda.** Yorum yanıtlama (Yorumlar modülü) AI taslağı için bunu
kullanır. Hiçbir sağlayıcı yapılandırılmamışsa `lib/ai.ts` **inert**'tir — çağrı
yapılırsa `AINotConfiguredError` döner ve UI zarifçe geri çekilir.

## Yapılandırma

| Öncelik | Değişken | Nasıl |
|---|---|---|
| **1 (öncelikli)** | `GOOGLE_GENERATIVE_AI_API_KEY` (ya da `GEMINI_API_KEY`) | aistudio.google.com'dan ücretsiz key üret, `.env.local` + Vercel env'e koy |
| 2 (local) | `AI_GATEWAY_API_KEY` | Vercel → AI Gateway → API Keys'ten üret, `.env.local`'e koy |
| 2 (prod) | `VERCEL_OIDC_TOKEN` | Deploy sonrası **otomatik** enjekte edilir; anahtara gerek yok |
| (opsiyonel) | `AI_MODEL` | Modeli değiştirir. **Gemini yolunda** model kimliği (ör. `gemini-2.5-flash`); **gateway yolunda** slug (ör. `openai/gpt-5.5`) |

> **Gemini ücret notu:** Fatura hesabı **bağlı olmayan** projede Free tier ($0,
> düşük limit). Fatura bağlıysa Tier 1 (ücretli) — ama `gemini-2.5-flash` çok ucuz
> (kısa yorum yanıtlarında ayda sent seviyesi) ve verin model eğitimine gitmez.
> Billing'de bütçe alarmı kurmanız önerilir.

> Anahtarları **asla** koda/sohbete koymayın; yalnızca env. Sızan anahtarı
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
