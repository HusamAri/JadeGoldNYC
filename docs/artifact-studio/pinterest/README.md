# by Artifact Studio Jewelry · Pinterest seti (2026-09-26)

60 pin, 1000×1500 (2:3), mağazanın kendi ürün görsellerinden (listing_images,
21 ürün, 205 kare) üretildi. Yeni görsel üretilmedi, kredi harcanmadı.

| Dosya | Ne |
|---|---|
| `pins.py` | Tek kaynak: her pinin şablonu, kaynak kareleri, üst yazısı ve Pinterest alanları |
| `render.py` | pins.py → JPG (Cormorant Garamond + IBM Plex Mono, fildişi/mürekkep/altın) |
| `sheet.py` | pins.py + hosted.json → içe aktarma xlsx/csv (şablon: kullanıcının import kit'i) |
| `hosted.json` | Higgsfield'a yüklenen her pinin media_id ve herkese açık URL'si |
| `artifact-studio-pinterest-60.xlsx` | Doldurulmuş içe aktarma şablonu (açılır listeler korunur) |
| `artifact-studio-pinterest-60.csv` | Aynı veri, CSV |

Şablonlar: editorial 22, story 14, guide 7, word 7, diptych 7, trio 3.
Hikâye ve rehber pinleri `priority=high` (22 pin).

Kurallar: üst yazıdaki her iddia listing'in kendisinde olmalı. Cercle'de taş
türü belirsiz ("natural" denmez); Cartouche Etsy'de eski yapıda olduğu sürece
18K beyaz/rose ve US 16 vaat edilmez. Cormorant'ın eski stil rakamları "10K"yı
"1oK" okutur, serif metin `lnum` ile çizilir.

Yeniden üretim:
```
python3 render.py <kaynak_kareler> <fontlar> <çıktı>
python3 sheet.py <import-template.xlsx> .
```
