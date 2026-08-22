# EON — satışlar neden durdu + reklam stratejisi (2026-08-22)

Kapsam: **yalnız EON**. Jade Gold NYC ayrı mağaza, karıştırılmaz (Jade satıyor:
18 Ağustos'ta 4 sipariş). Her sorgu `org` ile filtrelenmiştir.

> **Ölçüm notları — ikisi de bu turda hataya yol açtı:**
> 1. Sipariş tarihi `sales.order_date`'tir, `created_at` DEĞİL (ikincisi satırın
>    panele yazılma anı; senkron gününe yığılır). İlk analiz `created_at` ile
>    yapıldı ve yanlış tablo üretti; kullanıcı düzeltti.
> 2. `etsy_listing_stats.views` **kümülatif** sayaçtır. Toplamı almak "günlük
>    trafik" vermez; günlük artış `lag()` ile hesaplanır.

---

## 1. Ne oldu

**EON'un son satışı 15 Ağustos. O günden beri 7 gün, sıfır sipariş.**

| EON | Değer |
|---|---|
| Toplam sipariş | 12 (21 Tem – 15 Ağu) |
| AOV | $441,84 |
| Son 7 gün sipariş | **0** |
| Son 7 gün reklam harcaması | **$165,39** |
| Toplam reklam harcaması | $453,88 |

---

## 2. Elenen sebepler (veriyle)

| Hipotez | Veri | Sonuç |
|---|---|---|
| Trafik çöktü | Günlük yeni görüntülenme ~110-230, Ağustos boyunca istikrarlı. Favori 18 → 105 | ❌ **elendi** |
| Tatil modu / listing kapandı | `is_vacation=false`, aktif listing 27 → 59 (**arttı**) | ❌ elendi |
| Yorumlar bozuldu | 5 yorum: 5,4,5,5,5 → ortalama 4,80. Tek 4 yıldız gravür hatası, alıcı ilgiyi övmüş | ❌ elendi |
| Fiyat artışı satışı durdurdu | Artışlar 17-19 Ağustos, durgunluk **15 Ağustos'ta** başladı | ❌ **başlatıcı değil** (ama sürdürücü olabilir) |
| Metin push'u zarar verdi | Push 18 Ağustos, durgunluk 15'inde başladı | ❌ başlatıcı değil |

**Trafik geliyor, insanlar satın almıyor. Bu bir dönüşüm sorunudur.**

---

## 3. Asıl sebep: envanter seyrelmesi → dönüşüm düşüşü → Etsy kısıyor

| Listing grubu | Adet | Aktif | Görüntülenme | Sipariş | **Dönüşüm** |
|---|---|---|---|---|---|
| Temmuz'da eklenen | 41 | 27 | 2.326 | 11 | **%0,473** |
| **Ağustos'ta eklenen** | **33** | **33** | 501 | 1 | **%0,200** |

Mağaza Ağustos'ta listing sayısını **ikiye katladı**. Yeni 33 listing:
- aktif envanterin **%55'i**,
- Temmuz listing'lerinin **yarısı kadar** dönüşüyor,
- hiç satış geçmişi, yorumu, favori birikimi yok.

**Mekanizma (dış kaynak doğrulaması):** Etsy'nin 2026 algoritması
dönüşüm-ağırlıklıdır — bir listing/mağaza dönüşmüyorsa Etsy oraya alıcı
göndermeyi keser. Yani düşük dönüşüm yalnız satışı değil **görünürlüğü de**
düşürür ve kendini besleyen bir sarmal kurar. Mağaza seviyesinde dönüşüm
%0,47'den %0,27'ye inmişse, Etsy'nin tüm mağazayı kısması beklenir.

> Bu, "yeni listing eklemek her zaman iyidir" sezgisinin tersidir. Kanıtlanmamış
> listing eklemek, kanıtlanmış listing'lerin görünürlüğünü **çalar**.

---

## 4. Üst üste binen ağırlaştırıcılar

Hepsi aynı 7 günlük pencerede:

1. **Fiyatlar durgun pazara yükseltildi** (17-19 Ağustos, varyant başına
   +$15…+$95). Durgunluğu başlatmadı ama toparlanmayı zorlaştırır.
2. **Fiyat tabanı yine de %5,2 geride** ($4.399,90 vs canlı $4.630). Yani
   fiyatlar hem yükseldi hem altın karşısında eksik — en kötü kombinasyon.
3. **3 listing'in metni Etsy'de dışarıdan değişti** — biri **en çok satan
   listing** (`4542485142`). İspanyolcası `Alianza` kalıbına geçmiş (ABD Latino
   hedefiyle çelişir), LatAm tag'leri silinmiş, marka kuyruğu düşmüş.
4. **%25 mağaza indirimi 28 Ağustos'ta bitiyor.** Yenilenmezse fiyatlar
   **%33 sıçrar** — durgun bir mağazada bu ölümcül.
5. **Ölçüm kör:** `ad_daily_stats` 5 Ağustos'ta duruyor; senkron 13-19 Ağustos
   arası takılıydı (bugün düzeltildi). Yani kritik pencerede veri yok.

---

## 5. Reklam: $25/gün bu mağaza için ölçeksiz

Breakeven ROAS **4,0x** (katkı marjı %25: dar bant %23, geniş %37; Etsy
ücretleri gerçek ledger'dan %12,8).

| Girdi | Değer |
|---|---|
| Aylık bütçe | $750 |
| TBM | $1,04 |
| Aylık tık | ~720 |
| Gereken reklam cirosu (4x) | **$3.000** |
| **Gereken reklam siparişi** | **~6,8/ay** |
| **Gereken dönüşüm** | **%0,94** |

EON **ömrü boyunca 12 sipariş** yaptı. Reklamdan ayda 6,8 sipariş beklemek,
mağazanın tüm zamanlar hacminin yarısını her ay tek kanaldan istemektir.
Ölçülebilen tek pencerede ROAS **1,85** (1 sipariş / 174 tık / $181), son
7 günde **0**.

CTR %2,55 — Etsy ortalamasının üstünde. **İnsanlar tıklıyor, satın almıyor.**
Sorun teklif veya görünürlük değil; para dönüşmeyen sayfalara akıyor.

---

## 6. AKSİYON PLANI

### A. Bu hafta — kanamayı durdur

| # | Aksiyon | Neden |
|---|---|---|
| **A1** | **Yeni listing eklemeyi DURDUR** (dönüşüm toparlanana kadar) | En büyük kaldıraç. Her kanıtlanmamış listing mağaza dönüşümünü düşürüyor ve Etsy tüm mağazayı kısıyor |
| **A2** | **Reklamı $8/gün'e indir, yalnız 4 kanıtlı satana** | Son 7 günde $165 → 0 satış. $750/ay, ispatlanmamış bir kanala fazla |
| **A3** | **26 Ağustos: %25 indirimi YENİLE** | Kaçarsa +%33 fiyat şoku. Takvimde, kaçırılamaz |
| **A4** | **`4542485142`'nin metin kararını ver** | En çok satan listing; reklam parası oraya gidiyor ve İspanyolcası bozulmuş |

**Reklam verilecek 4 listing (kanıtlı organik satış):**

| Listing | Ürün | Sipariş | Ciro |
|---|---|---|---|
| `4542485142` | 14K White Milgrain | 2 | $1.780 |
| `4554025310` | 14K Yellow Wide Satin | 1 | $1.025 |
| `4539777986` | 10K Yellow Flat | 2 | $975 |
| `4543442596` | 10K Hammered | 1 | $910 |

Bu 4'ü cironun **%71'ini** taşıyor.

### B. Dönüşüm işi — asıl kaldıraç

TBM $1,04 sabitken dönüşümü %0,27'den %0,94'e çıkarmak, bütçeyi 3,5 katına
çıkarmakla aynı sonucu verir ve **maliyeti yoktur**.

1. **İlk fotoğraf.** Etsy aramasında tıklanan tek şey. 4 kazananın ilk karesi
   yan yana konup karşılaştırılmalı.
2. **Başlık uzunluğu — test edilebilir hipotez.** Dış kaynaklar 2026 Etsy'sinin
   **mobil öncelikli, 70 karakter altı** başlıkları öne çıkardığını söylüyor.
   Bizim başlıklarımız **90-100 karakter**. Dışarıdan değiştirilen 3 listing
   ise **60-65 karakter** — yani biri bu yönde çoktan denemeye başlamış.
   *Öneri: bu 3'ünü olduğu gibi bırak ve kontrol grubu olarak izle.*
3. **Ölçümü kapat.** Etsy Shop Manager → Pazarlama → Etsy Ads atfedilen
   sipariş/ciro verisi panele çekilmeli; yoksa 1 Eylül'de de ROAS yok.

### C. 1 Eylül — karar günü

| Ölçülen ROAS | Karar |
|---|---|
| ≥ 4,0x | Bütçeyi haftada %10-20 artır, kazananlara ağırlık ver |
| 2,5 – 4,0x | Bütçe sabit; dönüşüm üzerinde çalış |
| < 2,5x | $8/gün'de kal, yalnız ilk 2 listing; kanal ispatlanana kadar büyütme |

---

## 7. Alura "Strategy advisor" formu

| Alan | Değer | Gerekçe |
|---|---|---|
| Typical profit margin | **25** | Dar bandın hemen üstü; breakeven ROAS 4,0x |
| Digital items margin | **boş** | Dijital ürün yok |
| Margins differ by section | **KAPALI** | Marj farkı bölüme değil bant genişliğine bağlı |
| Goal slider | **Maximize profit** tarafına | Kanal breakeven'in %46'sında |
| Strateji | **Standard** | Taslakta *Conservative* seçili; o "yalnız net kaybedenleri durdur" demek — ama şu an neredeyse her şey kaybediyor |

### "Anything else?" metni

```
Solid gold wedding bands, EON shop only. Average order 442 USD, contribution
margin 25 percent (narrow bands 23, wide bands 37). Breakeven ROAS is 4x, not 3x.

Shop is early: 12 lifetime orders, zero sales in the last 7 days while spending
165 USD on ads. Only one ad-attributed sale has ever been measured. Treat this
as a shop that must prove the channel, not scale it.

Only these listings have proven organic sales and should stay on:
4542485142, 4554025310, 4539777986, 4543442596. Turn everything else off.

High ticket, low volume: one order is 442 USD, so do not judge a listing before
it has at least 200 ad clicks. Spend thresholds under 50 USD per listing are
statistically meaningless here - at 1 percent conversion, 25 USD of clicks has
an expected order count of 0.24, so zero sales at that threshold is normal and
pausing on it would kill a converting page.
```

**Alura'nın varsayılan eşikleri bizim için çok düşük.** Yardım merkezi örnekleri
"spent over $10 with no revenue" ve "ROAS below 2.5 after $25" diyor; $442'lik
üründe $25 = 24 tık = beklenen 0,24 sipariş. Eşikleri **$50-75 / 200 tık**'a
çekiyoruz.

---

## Kaynaklar

- [Insight Agent — Etsy Sales Down 2026: Diagnose Why Your Shop Sales Dropped](https://www.insightagent.app/guides/etsy-sales-down-2026)
- [Insight Agent — Etsy Ads ROAS Benchmarks 2026](https://www.insightagent.app/guides/etsy-ads-roas-benchmarks-guide)
- [HiSellIt — Why Etsy Traffic Drops Suddenly (2026 Recovery Guide)](https://hisellit.com/blogs/why-etsy-traffic-drops-suddenly/)
- [S27 POD — Why Your Etsy Views Dropped & How to Fix It (2026)](https://www.s27pod.com/blog/why-etsy-views-dropped.html)
- [Alura — How to Optimize Etsy Ads](https://help.alura.io/en/articles/9944034-how-to-optimize-etsy-ads)
- [Alura — Etsy Ad Campaigns Explained](https://www.alura.io/docs/article/etsy-ad-campaigns-explained)
- Panel verisi: `sales` (`order_date`), `sale_items`, `etsy_listing_stats`,
  `etsy_shop_snapshots`, `reviews`, `etsy_ledger_entries` (`prolist`),
  `ad_daily_stats`, `products` — 2026-08-22'de koşuldu.
