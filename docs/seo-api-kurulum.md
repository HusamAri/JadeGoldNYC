# SEO API Kurulumu — adım adım

Anahtar Kelime ve SEO Etiketleri için paneli güçlendiren 3 bağlantı.
Hiçbiri olmadan da çalışır (kural motoru + elle düzenleme); eklenince gerçek
arama hacmi, AI genişletme ve Etsy’ye etiket gönderimi açılır.

Anahtarları **asla** sohbete / koda yapıştırmayın. Yalnız `.env.local` (lokal)
veya Vercel → Project → Settings → Environment Variables (canlı).

---

## 1) Gemini (ücretsiz) — AI anahtar kelime genişletme

**Ne işe yarar:** Tohum kelimeden daha zengin aday listesi üretir.

**Ortam değişkeni:** `GOOGLE_GENERATIVE_AI_API_KEY`  
(eski ad da çalışır: `GEMINI_API_KEY`)

### Adımlar

1. Tarayıcıda aç: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Google hesabınla giriş yap.
3. **Create API key** (veya Get API key) butonuna tıkla.
4. Bir Google Cloud projesi seç (yoksa “Create API key in new project”).
5. Çıkan anahtarı kopyala (`AIza…` ile başlar).
6. Paneli nereye koyuyorsan oraya yapıştır:
   - **Lokal:** proje kökünde `.env.local` dosyasına şu satırı ekle, kaydet, `npm run dev`’i yeniden başlat:
     ```
     GOOGLE_GENERATIVE_AI_API_KEY=AIza...buraya...
     ```
   - **Vercel (canlı):** Vercel → projen → **Settings** → **Environment Variables** →
     Name: `GOOGLE_GENERATIVE_AI_API_KEY` · Value: yapıştırdığın anahtar ·
     Environment: Production (+ Preview istersen) → **Save** → sonra **Deployments**’tan
     son deploy’u **Redeploy** et (yeni env deploy olmadan canlıya geçmez).
7. Panelde **Anahtar Kelime** sayfasına git, bir tohum yazıp **Araştır**.
   Kaynak rozetinde **AI açık** görünmeli.

> Fatura hesabı bağlamadan Free tier yeter. Bağlarsan ücretli Tier’a geçer;
> `gemini-2.5-flash` yine çok ucuzdur. Billing’de bütçe alarmı kur.

---

## 2) DataForSEO — gerçek arama hacmi / rekabet / CPC

**Ne işe yarar:** Aday kelimelerin yanına Google Ads arama hacmi yazar.

**Ortam değişkenleri:**
- `DATAFORSEO_LOGIN` = kayıt e-postan
- `DATAFORSEO_PASSWORD` = **API password** (dashboard şifren değil)

### Adımlar

1. Aç: [https://dataforseo.com/](https://dataforseo.com/) → **Sign up** / ücretsiz hesap.
2. E-posta + bir hesap şifresi oluştur (bu şifre yalnızca siteye giriş içindir).
3. Giriş yap → sol menüden **API Access**:
   [https://app.dataforseo.com/api-access](https://app.dataforseo.com/api-access)
4. Orada iki değer göreceksin:
   - **API login** = genelde e-posta adresin → bunu `DATAFORSEO_LOGIN` yap
   - **API password** = sistemin ürettiği ayrı şifre → bunu `DATAFORSEO_PASSWORD` yap
5. **Önemli:** API password ≠ siteye giriş şifren.
   İlk 24 saatten sonra API password gizlenir; kaybettiysen aynı sayfada
   **Send by e-mail** ile e-postana tekrar gönder.
6. `.env.local` veya Vercel Environment Variables’a ekle:
   ```
   DATAFORSEO_LOGIN=senin@eposta.com
   DATAFORSEO_PASSWORD=api_password_buraya
   ```
7. Lokal için `npm run dev` yeniden; Vercel için **Redeploy**.
8. **Anahtar Kelime** → Araştır → **talep bağlı** rozeti yeşil olmalı; tabloda
   Hacim sütunu dolmalı.

> DataForSEO pay-as-you-go’dur; deneme bakiyesi / minimum yükleme kendi
> panellerinde görünür. Küçük anahtar kelime araştırması için maliyet düşüktür.

---

## 3) Etsy yazma izni — SEO etiketlerini mağazaya göndermek

**Ne işe yarar:** SEO Etiketleri ekranından öneriyi Etsy listing’e basmak.

**Önce ortam (bir kez, geliştirici hesabı):**

1. Aç: [https://www.etsy.com/developers/](https://www.etsy.com/developers/)
2. Giriş yap → **Register a new app** (veya mevcut app’i aç).
3. Callback / Redirect URI olarak şunu ekle (canlı domain’in neyse onu kullan):
   - Lokal: `http://localhost:3000/api/etsy/callback`
   - Canlı: `https://SENIN-DOMAIN/api/etsy/callback`
4. Uygulama sayfasından **Keystring** ve **Shared Secret**’i kopyala.
5. Env’e koy:
   ```
   ETSY_API_KEY=keystring_buraya
   ETSY_API_SECRET=shared_secret_buraya
   ETSY_OAUTH_REDIRECT_URI=https://SENIN-DOMAIN/api/etsy/callback
   ```
6. Vercel’de kaydet → Redeploy.

**Sonra panelden bağlan (her mağaza için):**

1. Panel → **Ayarlar** → **Etsy**
2. **Bağlan** / yeniden bağlan — izin ekranında listing yazma (`listings_w`) gelsin.
3. Bağlantı yeşil olduktan sonra **SEO Etiketleri** → bir öneriyi **Gönder**.

> “Etsy yazma erişimi kapalı” uyarısı görürsen Ayarlar’dan yeniden bağla;
> eski bağlantı sadece okuma izniyle kurulmuş olabilir.

---

## Kontrol listesi

| Özellik | Değişken(ler) | Nereden |
|---|---|---|
| AI genişletme | `GOOGLE_GENERATIVE_AI_API_KEY` | aistudio.google.com/apikey |
| Gerçek arama hacmi | `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` | app.dataforseo.com/api-access |
| Etsy’ye etiket gönder | `ETSY_API_KEY` + `ETSY_API_SECRET` + OAuth bağla | etsy.com/developers + Panel Ayarlar |

SEO Yardımcısı (`/seo-yardimcisi`) ekstra API istemez; yerelde çalışır.
Son doğrulama (Etsy autocomplete + eRank canlı hacim) elle yapılır.
