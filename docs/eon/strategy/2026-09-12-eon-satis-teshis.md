# EON — "satış yok" teşhisi (2026-09-12)

Kapsam: **yalnız EON**. Her sorgu `org` ile süzüldü.

> **Ölçüm notları** (22 Ağustos dokümanından devralındı, yine geçerli):
> 1. Sipariş tarihi `sales.order_date`'tir, `created_at` DEĞİL.
> 2. `etsy_listing_stats.views` **kümülatif**; günlük artış `lag()` ile.
> 3. İndirim oranının paydası `item_total + discount`'tur — `item_total` indirim
>    SONRASI nettir (2026-08-27 dersi).

---

## Kısa cevap

**Fiyat sorunu yok, indirim zaten %25 ve çalışıyor, marj sağlıklı.**
Panelin "satış yok" göstermesinin birinci sebebi **senkronun 7 gündür
koşmaması**. Ölçülebilen son iki hafta mağazanın **en iyi iki haftası**.

Fiyat indirmek ya da indirimi artırmak bu tabloda marjı yakar, satışı açmaz —
gerekçesi aşağıda sayıyla.

---

## 1. Ölçüm körlüğü: panel 5 Eylül'den beri kör

| Kaynak | EON son veri | Yaş |
|---|---|---|
| `sales` (sipariş) | 2026-09-02 | 10 gün |
| `etsy_shop_snapshots` | 2026-09-05 | **7 gün** |
| `etsy_listing_stats` | 2026-09-05 | **7 gün** |
| `etsy_ledger_entries` | 2026-09-05 | **7 gün** |
| `ad_daily_stats` (elle CSV) | 2026-08-22 | 21 gün |

Jade 3 Eylül'de, Ophir 29 Ağustos'ta duruyor — **üç mağaza da**.

Bağlantı **bozuk değil**: `status=connected`, `sync_status=done`, `sync_error`
boş, refresh token 11 Ekim'e kadar geçerli, kota 4.838. Yani senkron
çalışabiliyor, **tetiklenmiyor**.

`vercel.json` cron'u tanımlı ve doğru:

```json
{ "path": "/api/cron/etsy-sync", "schedule": "0 6 * * *" }
```

Rota canlıda ayakta (`https://amuletta.artifactstudio.info/api/cron/etsy-sync`
→ **401**, yani rota var + secret kapısı çalışıyor). Deployment READY.
**Cron tanımlı ama koşmuyor** → Vercel → Settings → Cron Jobs kontrol edilmeli.

> **Yan kusur (ayrı iş):** `cron/etsy-sync` rotası org başına hatayı yakalayıp
> `{ok:true}` dönüyor. Senkron patlasa bile Vercel "başarılı" görür. Bu, bu
> repodaki "sessiz başarı" desenidir — cron koşup başarısız olsaydı bunu da
> göremezdik. Rota, herhangi bir org hata verdiğinde 5xx dönmeli.

---

## 2. Satışlar durmadı — rekor kırdı

| Hafta | Sipariş | Ciro | AOV |
|---|---|---|---|
| 20 Tem | 4 | $857,60 | $214,40 |
| 27 Tem | 1 | $498,69 | $498,69 |
| 3 Ağu | 4 | $1.703,59 | $425,90 |
| 10 Ağu | 3 | $2.242,16 | $747,39 |
| 17 Ağu | 1 | $625,95 | $625,95 |
| **24 Ağu** | **4** | **$3.007,93** | **$751,98** |
| **31 Ağu** | **4** | **$3.131,55** | **$782,89** |
| 7 Eyl | — | **VERİ YOK** | — |

Ömür boyu sipariş 22 Ağustos'ta 12'ydi, **şimdi 21**. AOV $441 → **$574**
(son iki hafta ~$780). 22 Ağustos aksiyon planı **işe yaramış**.

Dönüşüm de iyileşmiş (kohort bazlı, aktif listing):

| Kohort | Aktif | Görüntülenme | Sipariş | Dönüşüm |
|---|---|---|---|---|
| Temmuz | 27 | 3.288 | 14 | %0,426 |
| Ağustos | 71 | 2.008 | 7 | **%0,349** (22 Ağu'da %0,200) |
| Eylül | 5 | 17 | 0 | — |

Mağaza geneli %0,27 → **%0,40**.

---

## 3. Fiyat ve indirim: sorun burada değil

### İndirim gerçekten çalışıyor

İşlem kayıtlarından ölçüldü (`discount/(item_total+discount)`):

| Hafta | Gerçek indirim |
|---|---|
| 3 Ağu | 0,2500 |
| 10 Ağu | 0,2500 |
| 17 Ağu | 0,2500 |
| 24 Ağu | 0,2500 |
| 31 Ağu | 0,2500 |

Beş hafta, **tam %25**. 22 Ağustos planının P0'ı (26 Ağu yenileme) yapılmış.

> `products.discount_pct` bu sinyali TAŞIMIYOR (çoğu 0) — mağaza geneli Etsy
> indirimi o kolonda yaşamıyor. Oradan "indirim kapalı" sonucu çıkarmak hata olur.

### Marj sağlıklı

16 eşleşen kalem (1 Ağu+), canlı spot $4.349,70:

| | |
|---|---|
| Liste toplamı | $12.295,00 |
| Net tahsilat (%25 indirimli) | $9.221,25 |
| Ham altın maliyeti | $4.558,75 |
| **Metal üstü katkı** | **$4.662,50 (%50,6)** — en düşük %44,9 |

Etsy ücreti **ölçüldü** (ledger, varsayım değil): transaction $654,51 +
processing $325,35 + offsite $200,00 = $1.179,86 → net ürün cirosunun **%11,7**'si.
İşçilik/paketleme/kargo ve $484 reklam düşülünce **katkı marjı ≈ %26**.

### İndirimi artırmak ne yapar

%25 → %35 demek, net tahsilatın `0,75` yerine `0,65` olması: **−%13,3 ciro**.
3 Ağu – 2 Eyl tabanında:

| | %25 (bugün) | %35 |
|---|---|---|
| Net ciro | $10.068,75 | $8.726,25 |
| − ham altın | $4.558,75 | $4.558,75 |
| − Etsy ücreti (%11,7) | $1.178 | $1.021 |
| − işçilik/paket/kargo | ~$1.200 | ~$1.200 |
| − reklam | $484 | $484 |
| **Katkı** | **~$2.648** | **~$1.463** |

**Kârın %45'i gider.** Başa baş kalmak için sipariş sayısının **+%81** artması
gerekir. $783 AOV'lu altın alyansta %13'lük bir fiyat kırımının siparişi
neredeyse ikiye katlaması beklenmez.

Ayrıca fiyat motoru %25'i liste fiyatına **gömüyor** (`liste = motor / 0,75`).
İndirim yapısal; artırmak hediye değil doğrudan marjdan kesinti.

### Altın da baskı yapmıyor

Canlı spot **$4.349,70** (12 Eyl). 3 Eylül'de $4.491'di — **düştü**.
Fiyat tabanımız $4.429,10, yani canlının **%1,8 ÜSTÜNDE**. "Altına göre ucuz
kaldık" argümanı yok; tersine küçük bir pay var.

---

## 4. Piyasa: eylül yapısal olarak en yavaş ay

Dış kaynaklar net: düğün sezonu **Mayıs–Eylül**, arama zirvesi Mart–Ağustos ve
**Eylül–Aralık düğün işinin yılın en yavaş dönemi**. Eylülde yavaşlama bekleniyor;
satıcıların önerisi bu ayı yeni koleksiyon/çekim hazırlığına ayırmak.

Yani eylül düşüşü (varsa) fiyat kusuru değil, **takvim**. Yapısal bir çukura
fiyat kırmak marjı yakar, talebi geri getirmez.

---

## 5. SEO: bu veri listing bazlı çıkarım taşımıyor

İki hipotez kuruldu, **ikisi de ölçümde çürüdü** — kayda geçiyor ki tekrar
denenmesin:

**(a) "Başlığı 70 karakterin altına indir" (22 Ağu hipotezi).** Ortalama
görüntülenme `<70` için 0,2/gün, `70-89` için 1,2/gün çıktı — 6 kat. Ama
**medyan** testi çürüttü: 6,5 vs 8,0, neredeyse aynı. Ortalamadaki farkı **tek
bir aykırı listing** (357 görüntülenme) taşıyormuş.

**(b) "Başlıkta 'Wedding Band' geçmeli".** İlk 10 cironun 10'unda geçiyor — ama
bu hayatta-kalan yanıltması (katalog zaten ağırlıklı wedding band). Yaş
kontrollü ölçümde Ağustos kohortu: geçen 0,76/gün, geçmeyen 0,67/gün. Fark yok.

**Kök sebep:** 21 ömür-boyu sipariş ve listing başına **medyan 6–8 görüntülenme**.
Bu hacimde hiçbir A/B sinyali istatistiksel değil. Sorun listing metni değil,
**trafik**. Kimsenin görmediği listing'de başlık optimizasyonu ölçülemez.

---

## 6. Aksiyonlar

### P0 — ölçümü aç (her şeyden önce)

1. **Vercel → Settings → Cron Jobs**: `/api/cron/etsy-sync` neden koşmuyor?
   Kapalıysa aç. (Plan limiti 3 cron'a yetmiyorsa en kritik olanı bırak.)
2. Elle tetikle: panelden Etsy senkronunu çalıştır ya da
   `curl -H "Authorization: Bearer $CRON_SECRET" https://amuletta.artifactstudio.info/api/cron/etsy-sync`
3. **Sonra** 5–12 Eylül'de gerçekten satış var mı bak. Bu cevaplanmadan
   fiyata dokunmak körlemesine ateş etmektir.

### P1 — fiyat/indirim

4. **Fiyatları indirme, indirimi artırma.** Gerekçe Bölüm 3: kârın %45'i gider,
   başa baş için +%81 sipariş gerekir.
5. %25 indirimin **bitiş tarihini** kontrol et — kaçarsa fiyatlar %33 sıçrar
   (22 Ağustos'un P0'ıydı, bir kez daha kaçmasın).

### P2 — hacim (asıl kısıt)

6. **Yeni listing eklemeyi durdur** — 55 taslak birikmiş, 34'ünün Etsy ID'si var.
   Eylülde eklenen 5 aktif listing toplam 17 görüntülenme aldı. Kanıtlanmamış
   listing, kanıtlanmış olanın görünürlüğünü çalıyor (22 Ağustos mekanizması).
7. **Reklamı 4 kanıtlı satana odakla.** Ağustos genelinde $484 reklam → $10.069
   net ciro. Ama `ad_daily_stats` 22 Ağustos'ta duruyor: **atfedilen ciro yok,
   ROAS hâlâ hesaplanamıyor.** Etsy Ads CSV'si panele yüklenmeli
   (`/reklamlar/ice-aktar`) — bu olmadan reklam kararı ölçüsüz veriliyor.
8. Eylül–Aralık çukuru **hazırlık ayı**: yıldönümü/hediye açısına geçiş,
   görsel ve metin hazırlığı — sezon Mart'ta geri geliyor.

---

## EK (aynı gün, teşhisten sonra) — kör noktanın kök nedeni bulundu

Teşhis "cron `vercel.json`'da tanımlı, rota canlıda 401 dönüyor, yani senkron
çalışabiliyor ama tetiklenmiyor" diyordu. Tetiklenmeme SEBEBİ şimdi ölçüldü ve
**körlük 7 gün değil, bir ay**:

```sql
select snapshot_date, min(created_at) at time zone 'UTC'
from etsy_shop_snapshots ... group by 1 order by 1 desc;
```

| gün | ilk yazım (UTC) | ne |
|---|---|---|
| 08-09 … 08-12 | 06:43 · 06:04 · 06:05 · **07:07** | `0 6 * * *` cron'u — düzenli |
| 08-20 | 10:34 | elle |
| 08-21 | 09:50 | elle |
| 08-22 | 07:12 | elle |
| 08-27 | 08:04 | elle |
| 09-03 | 13:15 | elle |
| 09-05 | 13:21 | elle |

Cron **2026-08-12 07:07**'de son kez koştu. Sonraki her senkron rastgele bir
saatte, yani insan eliyle. `vercel.json` tam o gün 6 → 3 cron'a indi
(`f365631` gözetimsiz altın itişini kaldırdı, `fd3f76d` iki ölü cron'u sildi;
PR #345 12 Ağustos'ta merge edildi). Hesap **Hobby** planında ve `vercel.json`
hâlâ **3** cron ilan ediyor.

**Kanıtlanan:** cron 08-12'de öldü; rota sağlam; kayıt duruyor.
**Kanıtlanmayan:** Vercel'in kaydı hangi gerekçeyle düşürdüğü. Hobby'de çalışma
zamanı log saklama **1 saat**, Vercel MCP'sinde cron durumu veren uç yok —
yani buradan görülemiyor. **Bunu panelden değil Vercel arayüzünden doğrula:**
proje → Settings → Cron Jobs.

### Bu turda kapatılan asıl kusur

Uyarı merkezi aslında **doğru çalışmıştı**: `sync_snapshot_stale` (kritik)
08 Eylül'de yandı ve `alert_state`'te duruyor. Ama söylediği şey "senkron
çalışmamış, elle tetikle"ydi — kullanıcı da tam olarak onu yaptı, bir ay
boyunca. Semptom her seferinde geçici olarak kayboldu, **kök neden hiç
görünmedi**. Panel ayrıca yalnız açıldığında ölçer: EON paneli en son
**08 Eylül 11:45**'te açılmış.

Eksik olan şey ölçümün kendisiydi — "cron koştu mu?" sorusunun panelde cevabı
yoktu. `etsy_shop_snapshots` bunu yapamaz, çünkü *"cron koştu, yeni veri yoktu"*
ile *"cron hiç koşmadı"* aynı görünür. Eklenenler:

- `cron_run` nabız tablosu (`0149`): her koşu, sonucundan bağımsız bir satır
  bırakır. "İş yok" ile "iş çalışmıyor" artık ayrı iki durum.
- Üç cron rotası da hatayı yutmayı bıraktı: hedef patlarsa **veya hiç hedef
  işlenmezse** `500` döner (eskiden her koşu `{ok:true}`, Vercel hep yeşil).
- Yeni `cron_not_firing` uyarısı kök nedeni adlandırır ve aksiyonu doğru yere
  yollar (Vercel cron kaydı). Yandığında `sync_snapshot_stale` **bastırılır** —
  tek arızayı iki kritik satırla anlatmak uyarı körlüğü üretir.

Nabız 36 saat sessiz kalırsa uyarı yanar; kurulum damgası sayesinde kurulumun
hemen ardından yanlış alarm vermez.

---

## EK-2 (2026-09-13 sabahı) — KÖK NEDEN BULUNDU: cron tetikleniyor, rota reddediyor

Yukarıdaki "cron tetiklenmiyor" teşhisi **yarı yanlıştı** ve düzeltiliyor.

Ertesi sabah nabız tablosu yine boştu. Dağıtımın cron saatinden **7 saat önce**
READY olduğu doğrulandı (`57e28ac`, 12 Eylül 22:51 UTC), yani ölçüm yerindeydi —
ve ben bunu "cron gerçekten hiç tetiklenmiyor, kanıtlandı" diye okudum.
**Kanıt sağlamdı, çıkarım yanlıştı.**

Vercel → Settings → Cron Jobs ekranı üç cron'un da **kayıtlı ve Enabled**
olduğunu gösterdi. (Aynı ekran iki şeyi daha söyledi: "Hobby'de 2 cron limiti"
ihtimali çürüdü, ve *"Cron jobs on Hobby have a flexible time window of 1-hour"*
satırı ağustostaki 06:04 / 06:43 / 07:07 yazımlarının neden hep o aralığa
düştüğünü açıkladı — o kayıtların cron olduğu teşhisi doğruymuş.)

Gerçeği tek bir runtime log satırı söyledi:

```
08:44:25  GET /api/cron/etsy-variants  401
```

`0 8 * * *` cron'u esnek penceresinde tetiklendi ve rota onu **auth kapısında**
geri çevirdi. Sebep: production'daki `CRON_SECRET` eksik ya da Vercel'in
gönderdiğiyle uyuşmuyor. Üç rotada kapı aynı olduğu için `etsy-sync` de her
sabah aynı 401'i alıyor.

### Ölçümün kendi kör noktası

Nabız `recordCronRun` içindeydi — yani **auth kontrolünden SONRA**. Bu yüzden
"hiç tetiklenmedi" ile "tetiklendi ve 401 yedi" yeni ölçümde de aynı görünüyordu,
oysa aksiyonları bambaşka yerde: biri Vercel cron kaydı, diğeri ortam değişkeni.

Düzeltildi:

- `recordCronAuthFailure` — 401 yolunda da nabız satırı bırakır. Yazım iki
  sınırla korunuyor (uç kimlik doğrulamasız çağrılabiliyor): yalnız Vercel'in
  cron çağrılarında bulunan `x-vercel-cron-schedule` başlığı varsa, ve iş başına
  saatte en fazla bir satır.
- Yeni `cron_auth_failed` uyarısı aksiyonu doğru yere yollar (Environment
  Variables), `cron_not_firing` ve `sync_snapshot_stale` bastırılır.
- Son koşu `ok=false` ise nabzın **tazeliği artık sağlık sayılmıyor** — aksi
  hâlde 401 satırı yazılır yazılmaz alarm susardı.

### Sahibin yapacağı

**Vercel → jade-gold-nyc → Settings → Environment Variables → `CRON_SECRET`**,
Production kapsamında tanımlı mı? Değilse tanımla, sonra yeniden dağıt. Doğru
çalıştığının kanıtı ertesi sabah `cron_run`'da `ok=true` bir satırdır.

---

## Kaynaklar

- [Etsy Seller Handbook — Making the Most of Seasonal Sales Patterns](https://www.etsy.com/sg-en/seller-handbook/article/making-the-most-of-seasonal-sales/45451604718)
- [ListifyAI — The Complete Etsy Holiday Calendar 2026](https://www.listifyai.net/blog/etsy-holiday-calendar-2026)
- [Etsy Seller Handbook — Seller Trend Report: Spring and Summer 2026](https://www.etsy.com/seller-handbook/article/1473931456647)
- [Fortune — Current price of gold: September 3, 2026](https://fortune.com/article/current-price-of-gold-09-03-2026/)
- [Trading Economics — Gold price chart](https://tradingeconomics.com/commodity/gold)
- [J.P. Morgan — Gold Price Predictions 2026/2027](https://www.jpmorgan.com/insights/global-research/commodities/gold-prices)
- Canlı spot: `api.gold-api.com/price/XAU` — $4.349,70 (2026-09-12 19:24Z)
- Panel verisi: `sales`(`order_date`), `sale_items`, `product_variants`,
  `products`, `etsy_listing_stats`, `etsy_ledger_entries`, `etsy_connection`
  — 2026-09-12'de koşuldu.
- Önceki teşhis: `docs/eon/strategy/2026-08-22-eon-reklam-ve-satis-durmasi.md`
