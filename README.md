# Jade Gold NYC — Yönetim Paneli

Jade Gold NYC'nin Etsy mağazası için **uçtan uca yönetim ve raporlama paneli**.
İşin tüm süreçleri (Satışlar, Maliyetler, Analizler, Marka Tasarımları, Tüketici
Yorumları) burada işlenir, kalıcı **şirket hafızası** (denetim logu) olarak loglanır
ve her an raporlanabilir.

## Teknoloji

- **Next.js 16** (App Router, TypeScript, React 19)
- **Supabase** (Postgres + Auth + Storage + Row Level Security)
- **Tailwind CSS v4** + hand-rolled shadcn/ui bileşenleri
- **Vercel** (yayınlama)

## Bu sürümde neler var

- 🔐 Supabase Auth (email/şifre) ile korumalı panel
- 📊 **Panel/Dashboard** — KPI'lar (gelir, maliyet, net kâr, marj), grafikler, son etkinlikler
- 🧾 **Satışlar** — manuel giriş + **CSV içe aktarma** (Etsy "Sold Order Items" / "Orders")
- 💸 **Maliyetler** — kategori bazlı gider takibi + kâr hesabı
- 🗂️ **Kayıtlar (Şirket Hafızası)** — her işlemin değişmez denetim logu (Postgres trigger)
- 🔌 **Etsy Open API v3** entegrasyon iskelesi (OAuth2-PKCE, sync) — kimlik bilgileri girilince aktif
- 🧩 Yer tutucu modüller: Analizler, Marka Tasarımları, Tüketici Yorumları

## Yerel geliştirme

```bash
cp .env.local.example .env.local   # değerleri doldurun
npm install
npm run dev                        # http://localhost:3000
```

Doğrulama:

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm run build       # üretim derlemesi
```

> Supabase olmadan `typecheck`/`build` çalışır. Veritabanı işlevleri için aşağıdaki
> provizyon adımlarını tamamlayın.

## Provizyon (Supabase + Vercel)

1. **Supabase projesi** oluşturun, `supabase/migrations/0001..0013` dosyalarını **sırayla**
   uygulayın (Supabase SQL editor, `supabase db push` veya MCP `apply_migration`).
2. Storage bucket'ları: `designs` ve `imports` (private).
3. `.env.local` / Vercel ortam değişkenleri: Supabase URL + anon + service-role anahtarları.
4. (Opsiyonel) Tip üretimi: `supabase gen types typescript` → `types/database.types.ts`.
5. **Vercel'e** deploy edin; `NEXT_PUBLIC_APP_URL`'i prod URL yapın.
6. **Etsy:** developers.etsy.com'da uygulama kaydı açın, `ETSY_API_KEY/SECRET` girin,
   redirect URI'yi (`/api/etsy/callback`) hem yerel hem prod için kaydedin. Panelde
   **Ayarlar → Etsy → Bağlan** ile OAuth akışını başlatın.
7. İlk kullanıcıyı Supabase panelinden oluşturun; `0013` seed'i tek organizasyonu kurar.

## Klasör yapısı

```
app/                 # App Router rotaları ((auth), (dashboard), api)
components/          # ui/ (primitives), layout/, data-table/, csv-import/, charts/
lib/                 # supabase/, etsy/, csv/, db/queries/, validations/, audit, money, format
supabase/migrations/ # 0001..0013 numaralı SQL şema dosyaları
types/               # database.types.ts
```

Daha fazla mimari ayrıntı için `CLAUDE.md` dosyasına bakın.
