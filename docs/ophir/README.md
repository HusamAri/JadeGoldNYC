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

## Maliyet talebi (2026-08-28)

Panelde Ophir org'u **prod'da mevcut** (`ophir-gold-usa`, 93 ürün, 0 varyant) —
paralel bir oturumda açılmış. Durum: 92 `edit` (pasif) + 1 `active`, **hepsi tek
tip 366,00 USD** fiyatta ve **hiçbirinde `weight_grams` yok**.

### Bulgu: 93/93 listing maliyetin altında

Açıklamalardan çıkarılan geometriyle (93/93 gerçek genişlik, 63'ünde yazılı
kalınlık — tamamı 1,50-1,60 mm) ve kullanıcının verdiği **100 USD işçilik** ile
EON v4 formülü (`lib/pricing/gold-index.ts`) uygulandığında hesaplanan liste
fiyatı en ucuz karatta (10K) bile **min 395 USD** çıkıyor — yani mevcut 366 USD
tüm katalogda taban fiyatın altında. Örnek: 2 mm düz band, 14K → tahmini
2,05 g → metal 221,54 + işçilik 100 + döküm ~12 = **333,54 USD maliyet**;
üstüne Etsy ücreti ve marj yok.

> Bu rakamlar TAHMİN gramla üretildi. Fiyat kurulmadan önce gerçek gram gelmeli.

### `ophir-maliyet-talebi.xlsx`

Üreticiden gerçek maliyet girdisi toplamak için 93 satırlık çalışma kitabı
(üretici: `scripts/ophir/gen_cost_request_xlsx.py`).

- **Sayfa 1 `Maliyet Talebi`** — listing kimliği + açıklamadan çıkarılan ölçüler;
  sarı sütunlar üreticinin dolduracağı alanlar: **gram (14K, US 7)**, işçilik,
  taş+mıhlama, döküm+diğer, not. Metal ve toplam maliyet formülle hesaplanır.
- **Sayfa 2 `Varsayimlar`** — 10K 65 / 14K 101 USD-gram (panel `gold_settings`),
  18K 130 (**varsayım** — panelde 18K kaydı yok, 14K saflığından türetildi),
  fire %7, referans beden US 7, referans kalınlık 1,5 mm.
- **Sayfa 3 `Nasil Doldurulur`** — doldurma talimatı + örnek satır.

**9 satır `KONTROL` işaretli:** açıklamadaki "width ... mm" ifadesi ile başlıktaki
mm çelişiyor (ör. "6mm Smooth Wedding Band" açıklamada 1,5 mm veriyor). O
satırlarda genişlik üreticiye sorulmadan fiyat kurulmamalı.

Doğrulama: 93 satır DB ile konum-ağırlıklı checksum'la karşılaştırıldı
(`sum(i*genislik)`=17838,15; `sum(i*gram)`=12859,67 — birebir), 93 tekil Etsy ID.
LibreOffice bu konteynerde çalışmadığı için `recalc.py` KOŞULAMADI; formüller
referans çözümleyip Python'da simüle edilerek doğrulandı (Excel dosyayı açarken
zaten yeniden hesaplar).

## SKU kimliği — fiyat yönetiminin ön koşulu (2026-08-28)

**Kök bulgu:** Ophir'in Etsy offering'lerinde **SKU yok** (93/93 `products.sku`
null; satılan 5 kalemde de `sku: ""`). Panel Etsy'yi birebir aynalar ve SKU'suz
offering için varyant satırı ÜRETMEZ (`lib/etsy/variants.ts` → `toRows`,
kod yorumunda "saf-Etsy kuralı (kullanıcı)"). Zincir bu yüzden kopuk:

```
SKU yok → panelde varyant yok (0) → offering-başına fiyat haritası yok
        → pushListingPrices sessizce no-op → fiyat yönetilemiyor
```

`reprice.ts`'in tek-fiyat yolu da varyantlı listing'i açıkça reddediyor
("otomatik fiyat yazma varyantsızlarla sınırlı"), ve 93/93 `has_variations`.

### Ölçülen gerçek (fiyat çerçevesi düzeltmesi)

`products.price_cents` = `etsyMoneyToCents(l.price)`, yani Etsy'nin **listing
seviyesi** fiyatı — varyasyonlu listing'de bu **en ucuz offering** ("from")
demektir, her varyantın fiyatı değil. Gerçek satışlar bunu doğruluyor: aynı
listing (4543147022) hem **$512** hem **$737,90**'dan satmış; 4544906099 →
**$463**. Yani "hepsi tek tip $366" okuması yanlıştı; $366 vitrin fiyatı.

Tahmin gramla kurduğum liste fiyatları (10K $775 / $635) gerçek satışların
**üstünde** kalıyor — bu da tahminle fiyat basmamak için ayrı bir sebep.

> Not: 5 siparişin 5'i de iptal/iade (07-10 Ağustos). Sebebi bilinmiyor;
> fiyat değiştirmeden önce anlaşılmalı.

### Araç: `/api/ops/ophir-sku-assign`

Kimliksiz offering'lere SKU yazar. Saf üreteç `lib/etsy/ophir-sku.ts`,
Etsy yazma katmanı `assignListingSkus` (`lib/etsy/inventory.ts`).

- **Şema:** `OPH-<listingId>-<KARAT><RENK>-<BEDEN>`, çözülemeyende
  `OPH-<listingId>-<sıra>`. listingId'yi BİLEREK içerir — kopya-listing SKU'yu
  miras alamaz, sahiplik senkronda el değiştiremez (second-brain 2026-08 vakası).
- **Güvenlik:** mevcut SKU asla ezilmez (idempotent); `sku_on_property` varsa
  reddeder; üretilen SKU'lar tekil ve <=32 karakter değilse hiçbir şey yazmaz;
  fiyat/adet/property aynen korunur; yazımdan sonra **geri okuma** ile doğrular
  (200 OK teslim sayılmaz).
- **Akış:** varsayılan KURU ÇALIŞMA → `?listing=<id>` kanarya → `?apply=1`.
  `?limit=N` (varsayılan 10).
- **Auth:** `Bearer $CRON_SECRET` veya tek kullanımlık `?token=` (ops_tokens CAS).

Testler: `npm run test:ophir-sku` — 3 karat × 3 renk × 25 beden tam
kombinatorik süpürme (tekillik, uzunluk, desen) + ayrıştırma ve yedek yolu.

### Sıra

1. Kanarya: tek listing kuru çalışma → plan doğru mu?
2. Kanarya apply → Etsy'de SKU'ları gör.
3. Kalan listing'ler.
4. `syncListingVariants` → varyantlar + GERÇEK offering fiyatları panele iner.
5. Gram (üretici kitabından) varyant bazında girilir.
6. Fiyat **ondan sonra** kurulur ve `pushListingPrices` ile itilir.
