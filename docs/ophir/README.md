# Ophir Gold USA — iş kolu kaydı

Etsy mağazası **`ophirgoldusa`** panelde ikinci (üçüncü) kiracı olarak yönetilecek.
Konteyner/scratchpad geçicidir; kalıcı kayıt burasıdır. Herhangi bir oturum bu
dosyayla akışa devam edebilir.

## Durum (2026-08-28)

| Konu | Durum |
| --- | --- |
| Drive çalışma alanı | **VAR** — yeniden kurma, aşağıdaki klasörü kullan |
| Panel org kaydı | Lokal dev DB'de kuruldu (`ophir-gold-usa`); **prod'da HENÜZ YOK** |
| Etsy bağlantısı | **YOK** — `organizations.etsy_shop_id` boş, OAuth yapılmadı |
| Marka yönü | Onaylanmadı (Drive `START_HERE.md`) |
| Etsy'ye yayın | Bu aşamada **yetkilendirilmedi** (Drive `START_HERE.md`) |

## Drive çalışma alanı (tek kaynak)

`Visionary Partners / oo9 | Ophir Gold USA`
→ https://drive.google.com/drive/folders/1Z0IOjmeo3ggsXaloVt0ubjhOkTQbRsm3

2026-08-27'de kurulmuş, dolu bir ağaç. **Yeni klasör açma** — mevcut yapı:

- `00 | Master & Decisions` — intake, canlı proje durumu, onaylı kararlar
- `01 | Brand System` — kaynak varlıklar, marka temelleri, görsel kimlik, mesaj
- `02 | Research & Shop Audit` — Claude incelemesi, mağaza kanıtı, öneriler
- `03 | Etsy Shop Assets` — hero banner, profil varlıkları, listing görsel sistemi
- `04 | Production` — Higgsfield üretimleri, çalışma dosyaları, QA
- `05 | Exports & Archive` — Etsy'ye hazır dosyalar, kaynak arşiv

Klasördeki işletme kuralları `START_HERE.md`'de: canlı mağaza + sahip verisi
olgusal kaynaktır; üretilen konsept ile onaylı varlık ayrı tutulur; sahip onayı
olmadan Etsy varlığı yayınlanmaz/değiştirilmez.

## Panelde org açma

Kod değişikliği **gerekmez** — panel zaten çok kiracılı (`Amuletta`, `lib/brand.ts`).
Yol: kenar çubuğu şirket seçici → "Yeni şirket kur" (`components/layout/org-switcher.tsx`)
→ `createOrganizationAction` (`app/(auth)/kurulum/actions.ts`) → `create_organization`
RPC'si org + owner üyeliği + sistem maliyet kategorilerini tek işlemde kurar ve
aktif şirketi yenisine çevirir.

Lokal dev'de doğrulandı (RPC doğrudan çağrıldı):

| slug | name | default_currency | rol | cost_categories |
| --- | --- | --- | --- | --- |
| `jade-gold-nyc` | Jade Gold NYC | USD | owner | 8 |
| `ophir-gold-usa` | Ophir Gold USA | USD | owner | 8 |

> Not: RPC'yi doğrudan çağırmak `audit_log`'a `org.created` satırı **yazmaz** —
> o olay server action katmanında (`logAudit`) üretilir. Prod'da org'u panel
> arayüzünden aç ki denetim izi düşsün.

## Sıradaki adımlar (sırayla)

1. **Prod'da org aç** — panel arayüzünden "Yeni şirket kur" (denetim izi için).
2. **Etsy bağla** — `.env.local`/prod env'de gerçek `ETSY_API_KEY` + `ETSY_API_SECRET`;
   sonra `/ayarlar/etsy` üzerinden OAuth. Kimlik bilgileri girilene kadar Etsy
   katmanı inerttir (CLAUDE.md). OAuth `ophirgoldusa` hesabının yetkilendirmesini
   gerektirir — sahip onayı olmadan yapılmaz.
   Callback kalıcı domain olmalı, hash'li deployment URL'i **asla** (second-brain).
3. **Senkron + künye** — mağaza çekildikten sonra ürün/varyant gram + SKU bütünlüğü.
4. **Marka yönü onayı** — Drive `00 | Master & Decisions/02 | Decisions`.

## Tuzaklar

- **SKU tekilliği org değil `(org_id, sku)`** — Ophir SKU'ları Jade/EON önekleriyle
  çakışmamalı; çakışırsa sahiplik her senkronda el değiştirir (second-brain vakası).
- **Marka görselleri org'a aittir** — ortak UI'da hardcode edilmez, aktif org'dan
  çözülür (`OrgMark`). Ophir aktifken panel platform (Amuletta) görünümüne düşer;
  Jade Gold teması yalnız kendi org'unda açılır (`lib/brand.ts:getBrandScope`).
