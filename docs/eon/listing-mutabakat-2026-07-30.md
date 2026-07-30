# EON listing mutabakatı — 3 "sıfır-varyant" listing'in gerçek hikâyesi (2026-07-30)

Görev #31 taraması. DB kanıtlarıyla (aile↔listing süpürmesi, 28 canlı aile
listing'i + 3 anomali) durum sanılandan farklı çıktı: sorun "3 boş listing"
değil, **1 çift listing + 1 aile karışması + 1 zararsız tekil**.

## Bulgu 1 — ÇİFT LİSTİNG: 14K Rose Dome iki kez canlı (para kaçağı riski)

| Listing | Başlık | Durum |
|---|---|---|
| **4540106368** (eski, 17 Tem) | "14K Solid Rose Gold Dome Wedding Band, Comfort Fit, 2mm to 12mm" | Etsy'de canlı, `RSG-R-1401` envanterini taşıyor, fiyatlar **v2-dönemi: $260–$2.350** |
| **4544441878** (yeni SEO, 24+ Tem) | "Solid 14K Rose Gold Dome … Free Engraving (2-12mm)" | Etsy'de canlı, sabahki v4 push'unu O aldı (**$390–$3.390 doğru fiyat**) |

- İki listing de Etsy'de AYNI `RSG-R-1401-*` SKU'larını taşıyor → panel
  upsert'ü (org+sku tekil) varyant sahipliğini son senkron kimi çektiyse ona
  atıyor. Sabah denetimde varyantlar 4544441878'de görünüyordu; akşam senkronu
  4540106368'e taşıdı. "Sıfır-varyant" görüntüsü bu ping-pong'un anlık karesi.
- **Risk:** eski listing v4'ün ~%30 ALTINDA fiyatla satışta (min $260;
  v4 doğrusu $390). Floor ihlali yok ($260 > 14K 2mm floor $211) ama
  hedeflenen marjın belirgin altında + çift listing Etsy politikası riski.

**Öneri:** 4540106368 KAPATILSIN (önce medya arşivi — panelin arşiv-önce
kapılı silme akışı; `listing_media`'da 0 kayıt var, önce "medyayı arşivle").
SEO listing'i 4544441878 tek başına kalır; varyant sahipliği kalıcı oturur.

## Bulgu 2 — AİLE KARIŞMASI: "10K Hammered Milgrain" başlığı ↔ 14K Flat envanteri

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
(a) gerçekten 10K hammered ise: envanteri doğru aile SKU'larıyla yeniden
kurulmalı (10K milgrain fiyat bandı) ve 1402 seti 4543427531'e taşınmalı;
(b) aslında 14K flat ise: başlık/foto/etiket 14K flat'e düzeltilip
4543427531 kapatılmalı.

## Bulgu 3 — Zararsız tekil: 4543000739

"10K White Dome … matte brushed, 4mm, US size 9" — tek parçalık özel listing,
`sold_out`, qty 0, 0 görüntülenme. Katalog ailesi değil; aksiyon gerekmiyor
(istenirse panelde arşivlenir).

## Sağlıklı durum teyidi

Kalan 26 aile listing'i birebir tutarlı: her biri tek 275'lik aile taşıyor,
fiyat bantları karat/profil v4 beklentisiyle örtüşüyor (10K std 295–2.195 ·
10K milgrain 315–2.220 · 14K std 390–3.390 · 14K milgrain 410–3.415 ·
18K std 570–4.900 · 18K milgrain 590–4.925 USD).

## Sonraki adım

Dış (Etsy) yazma gerektiren iki karar kullanıcıda:
1. 4540106368 kapat (medya arşivi → panel silme akışı) — çift listing + düşük fiyat.
2. 4543442596 kimlik teyidi → (a) veya (b) yolu.
