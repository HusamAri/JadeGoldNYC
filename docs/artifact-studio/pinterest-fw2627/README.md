# by Artifact Studio Jewelry · FW 26/27 enamel · Pinterest seti (2026-09-30)

80 pin, 1000×1500 (2:3), FW 26/27 enamel setinin kendi görsellerinden (40 hero +
360 galeri karesi) üretildi. Yeni görsel üretilmedi, kredi harcanmadı.

| Dosya | Ne |
|---|---|
| `pins.py` | Tek kaynak: 80 pinin şablonu, kaynak kareleri, üst yazısı ve Pinterest alanları |
| `render.py` | pins.py → JPG (`../pinterest/render.py` + `quad` aile şablonu) |
| `sheet.py` | pins.py + listings.json → içe aktarma xlsx/csv (kullanıcının import kit şablonu) |
| `listings.json` | 40 listing'in Etsy numarası ve canlı durumu (`ops/drafts-push?verify=1`) |
| `artifact-studio-fw2627-pinterest-80.xlsx` / `.csv` | Doldurulmuş içe aktarma dosyası |
| `overview-80.jpg` | 80 pinin genel görünümü |

Pin görselleri `public/pins/fw2627/pin-NN.jpg`, adres
`https://amuletta.artifactstudio.info/pins/fw2627/pin-NN.jpg`.

Yapı: 10 aile × 8 pin. Her ailede bir hikâye pini ve bir faydalı rehber pini
(priority=high, toplam 22 ile koleksiyon ve enamel rehberi), bir aile karesi
(`quad`) ve ürün, hediye, üç metal, yakın çekim pinleri.
Şablonlar: editorial 29, guide 11, quad 11, story 10, diptych 10, word 9.

Rehber konuları: kolye boyu (16/18/20), uyumsuz küpe nasıl takılır, kiln-fired
enamel nedir, huggie nedir, enamel bakımı, kahverengi nasıl giyilir, kışın canlı
renk, bileklik ölçüsü, hediye seçimi, lariat ve yaka, evde yüzük ölçüsü.

Kurallar: ürün iddiası (ölçü, zincir, kapama, bakım) listing metninden gelir;
09 karesi renk görselleştirmesidir, pin "shown in" der. Link yalnız `active`
listing'e verilir, taslak listing mağaza sayfasına düşer.

Taslaklar yayına alındıktan sonra:
```
# listings.json'u ops/drafts-push?verify=1 ile tazele, sonra
python3 sheet.py <import-template.xlsx> .
python3 render.py public/artifact/fw2627-enamel <fontlar> public/pins/fw2627   # yalnız görsel değişirse
```
Fontlar: Cormorant Garamond (değişken + italik), IBM Plex Mono, Inter
(raw.githubusercontent.com/google/fonts/main/ofl/...).
