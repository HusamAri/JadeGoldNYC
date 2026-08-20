# İspanyolca çeviri ön taraması — 2026-08-20

**Kaynak:** `product_translations` (lang=`es`, source=`etsy-manual`), `es-pull`
rotasıyla Etsy'den çekildi. **40 listing'de çeviri var, 81'inde yok** (121 aktif).

Tarama ürünün kendisine (DB'deki çeviri metni) koşuldu, rapora/nota değil
(`docs/second-brain.md` Güçlendirme-2).

## Özet

| Kalem | Durum | Etki |
|---|---|---|
| **Hitap (tú/usted)** | 🔴 22 `tú` · 11 `usted` · **6 listing kendi içinde karışık** | Marka sesi kırık |
| **Ölçü birimi** | 🔴 149 boşluklu / **121 bitişik** | RAE'ye aykırı, %45 yanlış |
| **"Diamond Cut" terimi** | 🟠 4 farklı çeviri, kanonik `diamantado` **0 kez** | SEO kaybı |
| **Marka kuyruğu** | 🟠 En az 4 varyant; çoğu listing'de hiç yok | Tutarsız kapanış |
| **Tag sayısı** | 🟠 38/40 tam (13); 2'si 12 | 2 slot boşta |
| Gram tablosu | 🟢 Korunmuş (satır sayıları EN=ES) | — |
| Gram birimi | 🟢 141 boşluklu / 5 bitişik | Küçük sapma |
| Başlık uzunluğu | 🟢 140+ karakter yok | — |
| `alianza`/`banda`/`reciclad` | 🟢 0 | — |
| `hipoalergénico` | ⚪ 4 listing — **İngilizce kaynakta da var** | Çeviri kusuru DEĞİL |

## 1. Hitap — asıl bulgu (ve ilk sayacın yanılgısı)

**İlk tarama "24 tú, 0 usted, tutarlı" dedi ve YANLIŞTI.** Sayaç yalnız `usted`
KELİMESİNİ arıyordu; oysa İspanyolca'da hitap **fiil çekiminde** saklı:

| tú (samimi) | usted (resmî) |
|---|---|
| desta**ca**, eli**ge**, selecci**ona**, disfru**ta**, limpi**a** | desta**que**, eli**ja**, selecci**one**, disfru**te**, limpi**e** |

Fiil çekimleri sayılınca gerçek tablo:

| Sınıf | Listing |
|---|---|
| Yalnız `tú` | 22 |
| Yalnız `usted` | **11** |
| **Aynı metinde ikisi birden** | **6** |
| Nötr | 1 |

Kendi içinde çelişen 6 listing: `1862671943`, `1862675181`, `1862661659`,
`1806007852`, `1891642136`, `1771229327`.

Aynı cümlenin iki hâli canlıda yan yana duruyor:
- `…y destaca en todas partes.` (tú)
- `…y destaque en todas partes...` (usted)

**Öneri:** mağaza geneli `tú` seçilsin (çoğunluk + takı e-ticaretinde yaygın),
11 + 6 listing ona çekilsin.

## 2. Ölçü birimi — 121 hatalı kullanım

RAE kuralı: sayı ile birim arasında **boşluk** olur (`2 mm`, `2,5 mm`).
Korpusta **149 boşluklu / 121 bitişik** — neredeyse yarı yarıya.

Örnek (`1336346678`, aynı metinde ikisi de var):
`Ancho: 3.2mm, 4mm, 4.5mm…` ama alt satırda `3.2mm 8" = 5.70 gramos`

Not: İngilizce metinde bitişik yazım **doğrudur** (374 bitişik ölçülmüştü);
iki dil bilerek ayrışır — bu bir çeviri kuralıdır, İngilizce'ye dokunulmaz.

## 3. "Diamond Cut" — dört ayrı çeviri

Aynı üretim tekniği dört şekilde geçiyor, standart terim **hiç** kullanılmamış:

| Kullanılan | Kaç |
|---|---|
| `tallado de diamante` | var |
| `corte de diamante` | var |
| `tallados a diamante` | var |
| `tallados con diamante` | var |
| **`diamantado` (kanonik)** | **0** |

**Sahte elmas iddiası DEĞİL** — dokuz kullanımın hepsi metinde okundu, hepsi
"Diamond Cut" karşılığı. Sayaç bunu ihlal sayardı; gözle okuma kurtardı.
Ama `tallado de diamante` "bir elmasın oyulması" gibi de okunur ve alıcı
`cadena diamantada` aradığında hiçbiri eşleşmez → **SEO kaybı**.

**Öneri:** hepsi `corte diamantado` / `tallado diamantado`'ya çekilsin.

## 4. Uzunluk — üç çeviri ciddi kısa

| Listing | EN | ES | Oran |
|---|---|---|---|
| `1849022518` | 2.610 | 1.216 | %47 |
| `1771229327` | 2.789 | 1.342 | %48 |
| `1806007852` | 2.192 | 1.362 | %62 |

**Gram tablosu kaybı YOK** — gram satır sayıları birebir eşit (5=5, 4=4, 3=3).
Kayıp tanıtım/politika metninde. Kritik veri sağlam, ama içerik hacmi düşük.

## 5. Kapsam boşluğu

**81 listing'in İspanyolca çevirisi yok** (121'in 40'ı var). Çeviri katmanı
olmayan listing'de Etsy kendi makine çevirisini gösterir — keyword kontrolü
tamamen kaybolur.

## Dokunulmayacaklar

- **`hipoalergénico`** (4 listing): İngilizce kaynakta da var, çeviri sadık.
  Endişe varsa İngilizce metin politikası ayrı iş kalemi.
- **`&quot;`** entity'leri (inç işareti): Etsy'nin kendi kodlaması, aynada
  ham hâliyle duruyor; canlıda doğru render ediliyor.

## Sonraki adım

Bu rapor **yalnız teşhis** — hiçbir metin değiştirilmedi. Düzeltme kararı
kullanıcıya ait. Düzeltme yapılacaksa sıra:
1. Hitap birleştirme (17 listing) — en görünür kusur
2. Ölçü birimi normalizasyonu (121 yer) — mekanik, regex'le güvenli
3. `diamantado` terim birleştirme (9 listing)
4. Kapsam: kalan 81 listing'e çeviri

Düzeltilmiş metinler `product_translations`'a `status='approved'` yazılıp
`es-push` rotasıyla itilir (read-back doğrulaması o rotada zaten var).
