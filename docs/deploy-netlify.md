# Netlify'a Yayınlama — Jade Gold NYC Yönetim Paneli

Bu panel sunucu-bağımlı bir **Next.js 16** uygulamasıdır (server actions, `proxy.ts`
ara katmanı, `/api/*` route'ları, Supabase SSR auth). Bu yüzden **statik** bir host
(GitHub Pages vb.) işe yaramaz; bir **Node runtime** gerekir. Netlify, Next.js'i
`@netlify/plugin-nextjs` ile tam SSR olarak çalıştırır ve Vercel'e en yakın
sıfır-konfig deneyimi sunar.

> Depo kökündeki `netlify.toml` build komutunu, Node sürümünü ve Next.js eklentisini
> zaten tanımlar. Aşağıdaki adımlarda sadece repoyu bağlayıp **ortam değişkenlerini**
> girmen yeterli.

## Önkoşullar

- [ ] GitHub deposu (`HusamAri/JadeGoldNYC`) — hazır.
- [ ] Supabase projesi oluşturulmuş ve `supabase/migrations/0001..0013` **sırayla**
      uygulanmış (bkz. `README.md`).
- [ ] Supabase anahtarların elinde: **Project URL**, **anon key**, **service-role key**
      (Supabase → Project Settings → API).

## 1) Repoyu Netlify'a bağla

1. <https://app.netlify.com> → **GitHub ile giriş yap**.
2. **Add new site → Import an existing project → GitHub** → `JadeGoldNYC` reposunu seç.
3. Branch: `main`. Build ayarları `netlify.toml`'dan otomatik okunur
   (`npm run build`, publish `.next`, Node 22). Elle değiştirme.
4. **Deploy site**'a daha basma — önce ortam değişkenlerini gir (Adım 2).
   (Bastıysan sorun değil; değişkenleri ekledikten sonra **Deploys → Trigger deploy**.)

## 2) Ortam değişkenleri (ZORUNLU)

**Site settings → Environment variables → Add a variable** ile aşağıdakileri ekle:

| Anahtar | Değer | Not |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | **gizli** — sadece sunucu (sync, callback, RPC) |
| `NEXT_PUBLIC_APP_URL` | `https://<site>.netlify.app` | Prod URL (deploy sonrası gerçek domain ile güncelle) |

Opsiyonel (Etsy entegrasyonu / cron kullanılacaksa):

| Anahtar | Değer |
|---|---|
| `ETSY_API_KEY` / `ETSY_API_SECRET` | developers.etsy.com uygulama kimlikleri |
| `ETSY_OAUTH_REDIRECT_URI` | `https://<site>.netlify.app/api/etsy/callback` |
| `ETSY_SCOPES` | `transactions_r listings_r email_r` |
| `CRON_SECRET` | `/api/cron/etsy-sync`'i korumak için rastgele uzun bir dizi |

> `SUPABASE_SERVICE_ROLE_KEY` ve `ETSY_API_SECRET` **gizli** anahtarlardır —
> `NEXT_PUBLIC_` öneki **almazlar**; yoksa tarayıcıya sızarlar.

## 3) ⚠️ Supabase Auth redirect URL'leri (giriş çalışsın diye)

Login Supabase Auth ile yapılır. Netlify domain'i Supabase'e tanıtılmazsa **giriş
sonrası yönlendirme başarısız olur**. Supabase panelinde:

**Authentication → URL Configuration**:
- **Site URL**: `https://<site>.netlify.app`
- **Redirect URLs** (ekle): `https://<site>.netlify.app/**`
  (yerel geliştirme için `http://localhost:3000/**` de kalsın)

## 4) Deploy & doğrulama

1. **Deploys → Trigger deploy → Deploy site** (ya da bir push at; otomatik deploy).
2. Build loglarında `@netlify/plugin-nextjs` çalıştığını gör (SSR/edge fonksiyonları).
3. Siteyi aç → `/login` → Supabase'de oluşturduğun kullanıcı ile giriş yap.
4. Panel açılıyor ve listeler dolu geliyorsa kurulum tamam. ✅

İlk kullanıcıyı Supabase → **Authentication → Users → Add user** ile oluştur
(e-posta + şifre). `0013` seed'i tek organizasyonu kurar.

## 5) (Opsiyonel) Zamanlanmış Etsy sync

Vercel Cron yerine Netlify'da iki yol var:
- **Netlify Scheduled Functions** ile `/api/cron/etsy-sync` ucunu periyodik tetikle, ya da
- Harici bir cron (ör. cron-job.org) ile
  `GET https://<site>.netlify.app/api/cron/etsy-sync` çağır;
  `CRON_SECRET` ayarlıysa isteğe `Authorization: Bearer <CRON_SECRET>` başlığını ekle.

> Etsy kimlik bilgileri girilene kadar entegrasyon **inert**'tir; bu adım opsiyoneldir.

## Sorun giderme

- **Build, `@netlify/plugin-nextjs` bulamadı**: eklenti `netlify.toml`'da tanımlı,
  Netlify build sırasında otomatik kurar. Yine de olmazsa Netlify UI → Plugins'ten
  "Next.js Runtime"i ekle.
- **Giriş sonrası `localhost`'a atıyor / hata**: Adım 3'teki Supabase redirect URL'leri
  ve `NEXT_PUBLIC_APP_URL` eksik/yanlış.
- **`Supabase service-role yapılandırması eksik`**: `SUPABASE_SERVICE_ROLE_KEY`
  tanımlı değil veya yanlış scope'ta.
- **Node sürüm hatası**: `netlify.toml` Node 22'yi sabitler; UI'da farklı bir
  `NODE_VERSION` override'ı varsa kaldır.
