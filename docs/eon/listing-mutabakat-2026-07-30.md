# EON listing mutabakatı — 3 "sıfır-varyant" listing'in gerçek hikâyesi (2026-07-30)

> **DÜZELTME (2026-08-01):** Bu belgenin ilk sürümü Bulgu 1'i "çift listing"
> olarak teşhis etmiş ve 4540106368'in KAPATILMASINI önermişti. **Bu teşhis
> yanlıştı ve geri çekildi** — kullanıcı düzeltti: 4544441878, 4540106368'in
> kopyası değil, ondan Etsy'de "copy listing" ile üretilmiş **AYRI bir ürün**
> (14K SARI altın dome). Kapatma önerisi (eski Karar A) iptaldir. Gerçek kök
> neden ve doğru çözüm aşağıda güncellendi.

Görev #31 taraması. DB kanıtlarıyla (aile↔listing süpürmesi, 28 canlı aile
listing'i + 3 anomali) durum sanılandan farklı çıktı: sorun "3 boş listing"
değil, **1 SKU çakışması (kopyalanmış listing) + 1 aile karışması + 1 zararsız
tekil**.

## Bulgu 1 — SKU ÇAKIŞMASI: Etsy kopyası kaynağın SKU'larını miras aldı

| Listing | Gerçek ürün | Durum |
|---|---|---|
| **4540106368** (17 Tem) | 14K **Rose** Gold Dome — `RSG-R-1401` ailesinin asıl evi | Canlı; varyant sahipliği kendisinde. Ama v4 fiyat push'unu ve SEO güncellemesini ALMADI: hâlâ **v2 fiyatları ($260–$2.350)** ve eski 63 karakterlik başlık. |
| **4544441878** (24+ Tem) | 14K **Yellow** Gold Dome — `GLD-R-1401` ailesi olmalı | Etsy'de canlı; kullanıcı bunu 4540106368'den **kopyalayarak** üretti, bu yüzden envanteri `RSG-R-1401-*` SKU'larını taşıyor. |

**Kök neden.** Etsy'de bir listing kopyalanınca SKU'lar da kopyalanır. Panelde
`product_variants` `(org_id, sku)` üzerinde TEKİL olduğu için aynı SKU iki
listing'e birden bağlanamaz: sahiplik son senkron kimi çektiyse ona geçer,
diğeri **"0 varyant"** görünür ve `listListingsIndex`'in "varyantsız listing
yok" kuralıyla listelerden gizlenir. Sabah/akşam senkronlarında görülen
ping-pong bunun anlık kareleriydi — çift listing değil, çakışan SKU.

**İkincil hata (bizim tarafımız).** Bu ping-pong sırasında 4544441878 varyant
sahibi göründüğü için 30 Tem toplu SEO push'unda ona **rose gold başlığı**
yazıldı. Ürün sarı altın; panel başlığı/etiketleri 1 Ağu'da sarıya düzeltildi
(123 karakter, 13 tag), Etsy'ye gönderimi kullanıcı yapar.

**Çözüm (kalıcı).** `RSG-R-1401` → `GLD-R-1401` SKU önek değişimi. Bunun için
listing sayfasına **"SKU önekini Etsy'de değiştir"** aracı eklendi
(`lib/etsy/inventory.ts::renameListingSkuPrefix` + `renameListingSkusOnEtsy`
server action + `components/listing/sku-rename-form.tsx`). Araç yalnız
Etsy'ye bağlı ve panelde 0 varyantlı listing'de görünür; fiyat/adet/varyasyon
değerlerine dokunmaz, hedef önek başka bir listing'de kullanılıyorsa reddeder.
Önek değişince çakışma biter: sarı listing kendi ailesini alır, rose listing
`RSG-R-1401`'i kalıcı olarak tutar.

**Sıra (kullanıcı adımları):**
1. 4544441878 → SKU önek aracı: `RSG-R-1401` → `GLD-R-1401`.
2. Aynı sayfada "Başlık+tag'i Etsy'ye gönder" → düzeltilmiş SARI başlık yayına.
3. 4540106368 (rose) → v4 fiyatları + yeni SEO başlığı/etiketleri gönderilir
   (bu listing her iki turda da atlanmıştı; şu an v4'ün ~%30 altında satıyor —
   floor ihlali yok, $260 > 14K 2mm floor $211, ama hedeflenen marjın altında).

## Bulgu 2 — AİLE KARIŞMASI: "10K Hammered Milgrain" başlığı ↔ 14K Flat envanteri

Aynı kök neden (kopyalanmış listing + miras SKU) burada da geçerli olabilir;
kimlik teyidi kullanıcıda.

- **4543442596** başlık/etiket/foto: *"10K Solid Gold Hammered Wedding Band,
  Milgrain Comfort Fit"* — ama Etsy envanteri **`WHG-R-1402-*`** (14K BEYAZ
  FLAT ailesi) SKU'larını taşıyor; sabahki push SKU'ya göre fiyat bastığı için
  şu an **14K flat fiyatlarında ($390–$3.390)**.
- **4543427531** *"14K White Gold Flat Wedding Band"* (9 foto, aktif, qty 20)
  ise VARYANTSIZ duruyor — 1402 ailesinin asıl evi bu olmalıydı.
- Sonuç: 10K hammered ürünü 14K fiyatıyla satışta (alıcı aleyhine fazla
  fiyat — itibar/iade riski); 14K white flat ise varyantsız (satılamaz
  konfigürasyonda).

**Öneri (Etsy panelinden teyitle):** 4543442596'nın gerçekte hangi ürün
olduğu Etsy'de görülerek karar verilsin —
(a) gerçekten 10K hammered ise: SKU önek aracıyla kendi ailesine taşınır
(10K milgrain aile kodu) ve `WHG-R-1402` seti 4543427531'e serbest kalır;
(b) aslında 14K flat ise: başlık/foto/etiket 14K flat'e düzeltilir ve
4543427531 için ayrı bir karar verilir.

## Bulgu 3 — Zararsız tekil: 4543000739

"10K White Dome … matte brushed, 4mm, US size 9" — tek parçalık özel listing,
`sold_out`, qty 0, 0 görüntülenme. Katalog ailesi değil; aksiyon gerekmiyor
(istenirse panelde arşivlenir). Not: `sold_out` olduğu için toplu SEO push'unda
Etsy 403 verdi ("must be active or expired"); push artık `status in
(active, expired)` filtresiyle bu tür listing'leri baştan atlıyor.

## Sağlıklı durum teyidi

Kalan 26 aile listing'i birebir tutarlı: her biri tek 275'lik aile taşıyor,
fiyat bantları karat/profil v4 beklentisiyle örtüşüyor (10K std 295–2.195 ·
10K milgrain 315–2.220 · 14K std 390–3.390 · 14K milgrain 410–3.415 ·
18K std 570–4.900 · 18K milgrain 590–4.925 USD).

## Sonraki adım

Panelden yapılacak (Etsy yazma gerektirir, kullanıcı tıklar):
1. 4544441878: SKU öneki `RSG-R-1401` → `GLD-R-1401`, sonra sarı başlık push.
2. 4540106368: v4 fiyat + SEO push (atlanmıştı).
3. 4543442596 kimlik teyidi → (a) veya (b) yolu.

## Ders (second-brain'e taşındı)

Çift listing gibi görünen "0 varyant" durumunun kök nedeni SKU tekilliği
olabilir. Teşhisi ilan etmeden önce **iki listing'in gerçekten aynı ürün olup
olmadığını kullanıcıya doğrulat** — kopyalama, farklı renk/karat üretmenin
meşru bir yoludur ve "kapat" önerisi geri dönüşü zor bir aksiyondur.

## Ürün spesifikasyonu teyidi (2026-08-01)

Kullanıcı üreticiden teyit aldı: **klasik alyanslar 1.5mm** ve **iç yüzey
yuvarlatılacak** — yani "comfort fit" ifadesi başlık, tag ve açıklamalarda
GEÇERLİ, hiçbir yerden kaldırılmıyor. **Hammered milgrain** modeli ayrı:
**1.9mm comfort fit** (bu bilgi 4543442596'nın açıklamasına eklendi).

Ara adım kaydı: 1 Ağustos'ta "1.5mm comfort fit değil" bilgisiyle 30 listing'in
başlık/tag'inden ve 7 açıklamadan comfort fit ifadesi çıkarılmıştı; üretici
teyidi gelince tamamı geri alındı ve panel başlıkları canlı Etsy değerleriyle
(06:06 senkronunun audit kaydından) birebir eşitlendi. Tek istisna 4544441878:
rose→yellow renk düzeltmesi kalıcı.

**Başlık kuralı (kullanıcı, 2026-08-01):** Etsy başlık değişiminde sıralama
düşme uyarısı verdiği için **başlıklara dokunulmuyor**; SEO çalışması yalnız
tag üzerinden yürüyor.

## Yeni ürünler ve fiyat bağı (2026-08-01)

Panele iki yeni **10K · 2mm · yüksek işçilik** taslağı eklendi (Listing
Önerileri): `GLD-R-1006` Basketweave (çapraz dokuma, elmas tıraş) ve
`GLD-R-1007` Diagonal Ribbed (çapraz yiv, pahlı parlak kenar). Gramlar
`docs/eon/eon-weight-tables.json` **10K / 2.0mm** tablosundan (yarım bedenler
komşu tam bedenler arasında doğrusal interpolasyon).

**Varyant matrisi hammered ile eşitlendi (2026-08-04, kullanıcı kararı:**
"genişlik, size ve varyant olarak hammered ile aynı tutalım"**).** İlk hâl
125 varyanttı (yalnız 6-10mm); eksik 6 genişlik (2, 3, 4, 5, 11, 12mm)
eklendi → her iki taslak **275 varyant** (11 genişlik × 25 beden), hammered'ın
şeklinin birebir aynısı. Migration: `supabase/migrations/0124`.

**FİYAT BAĞI (kullanıcı kararı):** bu iki ürün **hammered milgrain
(4543442596) ile AYNI satış fiyatından** satılır. Genişletme sonrası
**275/275 varyant** genişlik+beden eşleşmesiyle birebir aynı (0 sapma):
**$390-$3.390** (önceki dar matriste $920-$2.855). Yeni satırların Etsy
`properties` dizisi (513 Width / 514 Ring Size + `value_ids`) hammered
satırlarından kopyalandı — uydurulan `value_id` envanter PUT'unu kırar.

> ⚠️ Üçü tek ladder'a bağlı. Hammered'ın fiyatı değişirse `GLD-R-1006` ve
> `GLD-R-1007` de AYNI turda güncellenmeli, yoksa bağ sessizce kopar.
> Hammered'ın canlı fiyatı hâlâ `WHG-R-1402` (14K beyaz flat) grid'inden
> geliyor (yukarıdaki Bulgu 2 kimlik karışıklığı) — o düzeltilirse üçü birden
> düzeltilir.

Maliyet referansı (v4 grid formülü 858 satırda doğrulandı: saflık `K/24`,
`landed = gram × saflık × spot/g × 1,07 + işçilik + $8 + $22`,
`engine = landed × çarpan` [≤7mm 1,55 · ≥8mm 2,00],
`liste = ceil(engine×4/3 / 500)×500`, `satış = liste × 0,75` → 858/858 birebir):
bu fiyatlarda landed üstü marj **%53-77**, efektif satış **$150-212/g**.
Rakip bandı ("10k hammered milgrain", 2026-07-27, 10 sonuç):
$71 / $98 / $126 per gram · melt $55/g — yani konum bandın üstünde.

### ⚠️ Açık kalem: hammered'ın gramları 2mm tablosuyla uyuşmuyor

Hammered 2mm ilan edildi ama `product_variants.weight_grams` hâlâ
`weight_source = 'catalog_v3'` (1.5mm dönemi + milgrain zammı) taşıyor —
2.0mm tablosunun **~%17 altında** (ör. 10mm/US 10: hammered 10,04g,
2.0mm tablosu 12,05g; ölçülen oran 1,195-1,209). Yeni iki ürün 2.0mm
tablosunu kullandığı için **aynı fiyatı taşıyan üç listing farklı gram
anlatıyor**. Fiyat canlı ve kullanıcı onaylı olduğundan gramlar burada
DEĞİŞTİRİLMEDİ; maliyet/marj raporunu etkilediği için ayrı karar olarak
kullanıcıya bırakıldı (milgrain zammı 2.0mm tabanına mı taşınacak, yoksa
2.0mm tablosu mu doğrudan yazılacak).

SKU beden biçimi katalog konvansiyonuna hizalandı (`-4.5`, noktalı). Eksik:
her iki taslakta **fotoğraf yok**; panel-doğumlu taslakta görsel alanı
bulunmadığı için fotoğraflar Etsy'ye gönderimden sonra Etsy'de eklenir.
