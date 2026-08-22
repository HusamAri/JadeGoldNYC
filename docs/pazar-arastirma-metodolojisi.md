# Etsy Pazar & Rakip Fiyat Araştırma Metodolojisi — Jade Gold NYC

**Amaç:** Her gün BİR ürün grubu için tekrarlanabilir rakip fiyat araştırması
yapıp her aktif listing için **"pahalı / bantta / ucuz / veri yetersiz"** kararı
ve **nihai aksiyon önerisi** üretmek; ham veriyi zaman serisine (`keyword_research`)
yazıp ana panelde uyarı olarak göstermek.

**Temel ilke:** Altın takıda **ham fiyatlar asla doğrudan karşılaştırılmaz** —
fiyat büyük ölçüde ağırlığa bağlıdır. Her ürün önce **$/gram**'a, sonra günlük
spot fiyattan hesaplanan **melt (eritme) değerine bölünerek "melt çarpanı"na**
normalize edilir. Melt çarpanı spot fiyattan bağımsız olduğu için gün-gün
karşılaştırılabilen tek metriktir.

> Bu metodoloji çok-ajanlı bir araştırma + 3 bağımsız adversarial doğrulama
> turundan geçirilmiştir. En sondaki **"Doğrulama Notları"** bölümü, ilk taslakta
> bulunan ve düzeltilen kritik hataları listeler.

---

## 0) Gün başı: spot fiyat ve tabanlar

1. **Spot altın fiyatı**: kanonik kaynak repodaki `lib/gold-price.ts` →
   `getGoldSpotQuote()` (1 saat önbellekli). Tek çekici `fetchLiveSpotUsd()`
   (`lib/pricing/gold-index.ts`) → **gold-api.com**; elenen kaynaklar orada
   tek tek yazılı. ⚠️ `goldprice.org` KULLANILMAZ (JS ile render eder,
   sunucudan boş döner); `metals.dev` demo anahtarı **401**, `metals.live`
   uç yok — 2026-08-22'de ölçüldü, ikisi de kaldırıldı.
   **Sayıyı kullanmadan önce `stale` bayrağına bak:** true ise değer canlı
   değildir, o spotla fiyat/marj kararı verilmez.
2. **Melt (eritme) $/g:**
   ```
   melt $/g = (spot $/ozt ÷ 31,1035) × saflık      10K = 0,4167   14K = 0,585
   ```
   Örnek (spot $4.120): saf $132,4/g → **10K melt ≈ $55/g**, **14K melt ≈ $77/g**.
3. **Tüm-dâhil başabaş (breakeven) $/g** — sadece malzeme değil:
   ```
   breakeven $/g = (alım $/g + birim kargo/paket/iade payı) ÷ (1 − Etsy ücret oranı)
   ```
   - Alım $/g: `lib/gold-cost.ts` → 10K $65/g, 14K $101/g (aylık teyit; spot
     yükselse de stok yenileme maliyeti düşmez — taban = `max(tarihsel alım,
     güncel tedarikçi kotasyonu)`).
   - Etsy ücret oranı: işlem + ödeme + (varsa) offsite reklam ≈ %9–11; gerçek
     oran `etsy_ledger_entries`'ten grup bazında hesaplanabilir.
   - **Kural:** hiçbir öneri fiyatı breakeven $/g'nin altına inemez.

---

## 1) Rakip seti nasıl kurulur

### 1.1 Kanal hiyerarşisi (doğrulama ile düzeltildi)
1. **Birincil — Etsy API v3** (`lib/etsy/keyword-research.ts`, zaten kurulu):
   `/listings/active` keyword araması → başlık + fiyat + shop_id; gram için
   `getListing?includes=Inventory` (varyant fiyatları) + başlık regex'i.
2. **İkincil — WebSearch** (keşif/çapraz doğrulama): `allowed_domains=[etsy.com]`.
   ⚠️ Snippet'lar başlık+URL verir, **fiyatı güvenilir vermez** → tek başına
   karar için yetersiz; sadece aday keşfi + Etsy başlık formatı (mm/inç/gram) için.
3. **Üçüncül — perakendeci kalibrasyonu** (curl/WebFetch erişilebilir): frostnyc,
   applesofgold, itshot, jaxxon; toptancı tabanı ofrei. Pazar bandını çapa için.
4. eRank/EverBee/Alura: login+paywall → **ajan kullanamaz**, insan işi olarak ayrı.

### 1.2 Arama sorguları
```
"[10k|14k] solid gold [rope|figaro|cuban|box|franco] chain [X]mm"
+ varyant: "... [18|20] inch", "... necklace"
```
Grup tanımı: **ayar + zincir tipi + kalınlık bandı** (<2mm / 2–3,5mm / 3,5–5mm / 5mm+).

### 1.3 Katı altın doğrulama (post-filtre zorunlu)
Etsy'nin `-filled -plated` operatörü güvenilmez.
- **Pozitif:** `solid`, `585`, `417`, `real gold`, `certified`
- **Negatif (ELE):** `plated`, `GP`, `HGE`, `gold filled`, `GF`, `1/20 14K`,
  `vermeil`, `dipped`, `gold tone`, `PVD`, `over silver/brass`
- **hollow/semi-solid** → ayrı kova (aynı görünümde %40–60 hafif; kıyasa karışmaz)
- **Melt-altı filtresi:** ilan $/g < **0,9×** gözlem-tarihindeki melt → şüpheli
  kovası (otomatik elenmez, başlık regex'iyle doğrulanır). Elenen her kayıt
  nedeniyle loglanır; elenen oran %25'i aşarsa güven düşürülür.
- **Üst aykırı:** $/g > 6× melt → taşlı/markalı lüks, ELE.

### 1.4 Bire bir ürün eşleştirme (rakip GERÇEKTEN aynı ürün mü?)
Rakibin bizimle **aynı ürün** olduğundan emin olmadan fiyatı kıyaslamak yanıltır.
İki katmanlı doğrulama:
- **Katman A — grup eşleşmesi (zorunlu):** aynı **ayar (10K/14K)** + aynı **zincir
  tipi** (rope≠figaro≠franco≠box) + **benzer mm bandı**. Farklı tip/ayar örneklemden
  ÇIKARILIR. Zincir tipi tek kelimeyle eşleşmez (ör. "figaro rope" karışık başlıklar)
  → tip token'ı başlıkta net geçmeli.
- **Katman B — varyant eşleşmesi ($/g'yi de aşan kesinlik):** rakip listing'in
  varyantları (`getListing?includes=Inventory`) çekilir; bizim varyantla
  **ayar + uzunluk (inç) token'ı** birebir tutarsa "variant" bazlı kıyas
  (`buildVariantComparison`). Tuttuğunda `guven=yuksek`.
- **Neden $/g tek başına yetmez:** melt çarpanı ağırlık farkını nötrler ama
  **işçilik/örgü tipi** farkını nötrlemez (aynı gramda hollow-görünümlü figaro ile
  solid franco farklı işçiliktir). Bu yüzden tip+ayar eşleşmesi $/g'den ÖNCE gelir.
- Katman A'yı geçen ama gramı/varyantı okunamayan rakip: banda **`guven=orta`**
  ile girer; A'yı geçemeyen tamamen atılır.

### 1.5 Minimum örneklem (doğrulama ile sıkılaştırıldı)
- **Bant kararı (PAHALI/UCUZ) için n ≥ 10 doğrulanmış ilan.**
- **n = 5–9 → yalnız "izleme/sınırda", AKSİYON ÖNERME.**
- **n < 5 → "veri yetersiz", karar yok.** Ertesi gün sorgu genişlet.
- **Mağaza başına en fazla 2 ilan** (pseudo-replication'ı önle); `n_magaza` ayrı
  loglanır, güven notu mağaza sayısına göre verilir.

---

## 2) Veri noktaları ve $/g normalizasyonu

### 2.1 Her rakipten (erişilebilir kanallardan gerçekten gelenler)
listing URL/ID · varyant fiyatı (18"–20" eşle) · gram (regex `([0-9.,]+)\s*(g|gr|gram)`)
· ayar/tip/mm/inç · solid/hollow · **num_favorers, yorum sayısı (getReviewsByListing),
mağaza toplam işlem/yorum + yaşı (getShop create_date)** · kargo süresi/ücreti · lokasyon.
⚠️ Bestseller rozeti, "in X carts", "X bought in 24h" API'de YOK → ağırlıklandırmaya
girmez (yalnız render sayfada; ajan toplayamaz).

### 2.2 Normalizasyon
```
$/g          = varyant fiyatı ÷ gram
melt çarpanı = $/g ÷ (günün melt $/g, aynı ayar)
```
Kıyas SADECE aynı ayar + aynı zincir tipi + benzer mm bandında yapılır.

### 2.3 Gram yoksa tahmin (tek sabit değer — aralık değil)
| Tip / kalınlık | g/inç (sabit) |
|---|---|
| rope 3mm | 0,75 |
| figaro 3mm | 0,40 |
| franco 2mm | 0,16 |
| genel 3mm | 0,68 |
| genel 6mm | 1,75 |

Tahmini gramlı kayıt `guven=dusuk` etiketlenir; **örneklemin >%30'u tahminliyse
çeyrek/medyan hesabına KATILMAZ** (yalnız aday keşfi).

---

## 3) Pazar bandı hesabı

Temizlenmiş örneklem üzerinde (melt çarpanı cinsinden, **ağırlıksız**):
- **P25 / medyan / P75** (tek interpolasyon: tip-7). Ağırlıklandırma birincil
  banda GİRMEZ; "lider medyanı" (yorum>100 mağazalar) ayrı bir bağlam sütunudur.
- **Mutlak taban:** 1,0× melt (yeni katı altın için imkânsız alt sınır).
- Bant = [P25, P75] melt-çarpanı aralığı.

---

## 4) Bizim ürünle kıyas ve karar

Bizim melt çarpanımız `R_biz = (bizim $/g) ÷ (melt $/g)`.

| Koşul | Karar |
|---|---|
| R_biz > P75 **ve** R_biz > 1,15 × medyan | **PAHALI** |
| R_biz < P25 **ve** R_biz < 0,85 × medyan | **UCUZ** |
| breakeven'in altında | **ZARAR RİSKİ** (yönden bağımsız acil) |
| aksi | **BANTTA** |

- **R tek birincil metriktir**; persentil konumu yalnız rapor notu.
- **Simetrik meşru-prim düzeltmesi:** rakiplere rozet/yorum primi indiriliyorsa,
  aynı rozetlere (Star Seller, yüksek yorum, NYC hızlı kargo) SAHİPSEK kendi
  eşiğimiz de gevşetilir (R eşiği 1,15 → 1,30). Yani meşru pahalılık iki tarafa da.

---

## 5) Tedarik (stok) riski — Jade Gold'a özel

> Jade Gold maddi şartlardan **stoksuz** çalışıyor: bazı ürün/varyantlarda stok
> bulunamıyor, yenisi gelince farklı geliyor → **iptal** üretiyor. Bu, fiyat
> kararından ÖNCE gelir.

- Her SKU kökü için son 12 ay **iptal oranı** (`shipstation_orders` +
  `_order_items`) hesaplanır.
- **İptal oranı ≥ %40 → "tedarik riski" işareti.** Bu varyantta "fiyatı düşür"
  önerisi VERİLMEZ; öneri: **"önce tedarik teyidi / varyantı pasifle"**.
- Fiyat "pahalı" çıksa bile tedarik edilemeyen varyant için indirim, iptali
  artırmaktan başka işe yaramaz — önce stok sorunu çözülür.

---

## 6) Çok-gün teyidi ve öneri

- **Tüm fiyat aksiyonları** (hem PAHALI hem UCUZ) **2–3 ardışık çalıştırmada**
  (yani ~2–3 hafta, her ürün 7 günde bir) tekrarlanınca aksiyona döner. Tek
  günlük sinyal "izleme"dir.
- **ZARAR RİSKİ** istisnadır: maliyet tabanı içsel veri olduğundan tek seferde
  aksiyon üretir (bkz. Beaded Ball'daki $1,35 hatası).
- **Nihai öneri** metni her listing için üretilir, ör.:
  - "PAHALI (R=2,4 vs bant 1,4–1,9); 2. teyit. Öneri: 14K figaro'da ~%15 indirim testi."
  - "ZARAR RİSKİ: 1mm·18" maliyet altında; acil fiyat düzelt."
  - "TEDARİK RİSKİ (%71 iptal): fiyat değil, önce stok/varyant kararı."

---

## 7) Çıktı ve güven

`keyword_research` satırına yazılır (0076 kolonları): `our_per_gram_cents`,
`market_low/avg/high_per_gram_cents` (P25/medyan/P75), `melt_per_gram_cents`,
`price_position`, `deviation_pct`, `confidence`, `recommendation`, ham `results`.
`market_price_alerts` görünümü ürün başına en günceli verir → ana panel kartı.

**Güven (`confidence`):**
- `yuksek`: n≥15, mağaza≥8, gram çoğu gerçek (API varyant), spot taze.
- `orta`: n 10–14 veya bazı gramlar tahmin veya snippet-ağırlıklı.
- `dusuk`: n<10, çoğu tahmin gram, ya da spot son 7 günde >%3 oynamış +
  snippet-ağırlıklı örneklem (fiyat-tarih uyumsuzluğu riski).

---

## Doğrulama Notları (adversarial turdan düzeltilenler)

1. **Spot kaynağı** goldprice.org değil → repo `getGoldPricePerOunce()`.
2. **Birincil kanal** WebSearch değil → mevcut Etsy API v3 istemcisi (fiyat+gram).
3. **Maliyet tabanı** sadece malzeme değil → Etsy ücreti+kargo+iade dâhil breakeven.
4. **n≥5 → n≥10**; n=5–9 sadece izleme; mağaza başına max 2 ilan.
5. **Meşru prim simetrik** — kendi rozet/kargomuz da eşiği gevşetir.
6. **Çok-gün teyidi** hem PAHALI hem UCUZ'a uygulanır (ZARAR RİSKİ hariç).
7. **Melt-altı filtresi** gözlem-tarihi melt'ine göre + 0,9× tolerans bandı.
8. **Gram tahmini** tek sabit değer; tahminliler >%30 ise medyana katılmaz.
9. **Tedarik riski** fiyat kararından önce gelir (Jade Gold stoksuz çalışıyor).
