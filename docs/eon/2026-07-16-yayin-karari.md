# EON 16 — Yayın Kararı (Karar Sentezi, 2026-07-16)

Kapsam: 9 PASS listing (Dome14K 01-03 · Dome10K 04-06 · Milgrain14K 13-15).
Girdi: 9 listing yargısı + 3 çapraz denetim + itiraz sonuçları. Kural: itirazda
düşen bloker verdicti değiştirir; ayakta kalan bloker verdicti belirler.

## SONUÇ: 9/9 READY — taslak gönderimini geciktiren geçerli bloker YOK

| No | Aile | Nihai | Gerekçe (tek satır) |
|----|------|-------|---------------------|
| 01 | Dome14K Yellow | **READY** | Tek bloker "footer sızar + sökülürse fiyat açıklaması gider" idi; itirazda düşmedi AMA taşıyıcı iddiası ("push hattında strip yok") bu oturumda birincil kanıtla çürütüldü (aşağıda). Kalan kol kardeşlerdeki gibi quick-win. |
| 02 | Dome14K White | **READY** | İki bloker (footer, gram) itirazda düştü — footer strip'leniyor, gram quick-win. |
| 03 | Dome14K Rose | **READY** | İki bloker (footer, sizing paragrafı) itirazda düştü — Etsy dropdown fiyatı seçimde gösterir. |
| 04 | Dome10K Yellow | **READY** | Üç bloker (footer, fiyat-uyarısı, gram) itirazda düştü. |
| 05 | Dome10K White | **READY** | İki bloker (fiyat-şeffaflık, footer) itirazda düştü. |
| 06 | Dome10K Rose | **READY** | İki bloker (footer, sarkan karşılaştırma) itirazda düştü; karşılaştırmanın öncülü aynı paragrafta mevcut. |
| 13 | Milgrain14K Yellow | **READY** | İki bloker (footer, size-band açıklaması) itirazda düştü. |
| 14 | Milgrain14K White | **READY** | İki bloker itirazda düştü; "sessiz fazla ödeme" mekanizması yok (dropdown fiyat gösterir). |
| 15 | Milgrain14K Rose | **READY** | İki gözlem doğru ama şablon-genel nitelik; quick-win + mağaza-seviyesi iade politikası işi. |

**FIX: yok. HOLD: yok.** (07-12 kapıda HOLD, 16 FAIL — bu raporun kapsamı dışında;
kapı raporu değişmedikçe script zaten onları göndermez.)

### 01 çelişkisinin kanıtı (bu oturumda üretildi)
- `scripts/eon-push-drafts.ts:74-76` `stripInternalTrailer()` → satır 176 `cleanDesc` → satır 190 `createDraftListing`'e yalnız temiz metin gider. Footer DB'de bilerek durur: satır 159 `.like("description", "%[EON NN %")` eşleşme anahtarı — kaynaktan sökmek pipeline'ı kırar.
- Regex 9/9 girdinin GERÇEK açıklamasına karşı çalıştırıldı (`node`, bu oturum): 9/9 `leak=false`; `[EON`, `QA-clean`, `4033`, `snapshot`, `---` izi yok; metin "…answered the same day." ile bitiyor. **01 dahil.**
- İtiraz #01'in "hiçbir strip yok" tespiti `build_eon16.py` + `lib/etsy/listing.ts`'e bakıp gerçek push yolunu (eon-push-drafts.ts) atlamıştı; 4 bağımsız doğrulama + bu oturumun çalıştırması aksini kanıtlıyor.
- İkinci kol (gövdede genişlik×beden fiyat açıklaması yok) kardeşlerde quick-win sayıldı çünkü: envanter PUT'u `price_on_property [513,514]` yazar → Etsy, Width+Size seçiminde tam fiyatı sepet öncesi gösterir; gönderim TASLAK; tek cümlelik ekleme. Aynı olgu 01 için de geçerli → aynı hüküm.

---

## 1) GÖNDERİM KOMUTU

Ön koşullar (script bunlar olmadan koşmaz/kırılır — listing kusuru değil, ortam işi):
1. `/home/user/JadeGoldNYC/.env.local` içinde GERÇEK değerler: `ETSY_API_KEY`,
   `ETSY_API_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (+ `SUPABASE_URL`). **Şu an ikisi
   placeholder** (değer = boşluk + yorum; bu oturumda doğrulandı) — doldurulmadan
   gerçek push başlatma.
2. Etsy UI'da bir kez: kargo profili ("made to order — 5-7 iş günü işleme, ABD
   ücretsiz takipli kargo") + iade politikası (30 gün, değişim-dostu) oluştur/doğrula.
   Script parametresizken mağazadaki İLK profili körlemesine alır — id'leri açıkça geç.

```bash
cd /home/user/JadeGoldNYC
SCRATCH=/tmp/claude-0/-home-user-JadeGoldNYC/f6e71788-66b8-5b0b-a130-2c86f96d1da8/scratchpad

# 1. Prova (Etsy'ye hiçbir şey yazmaz)
npx tsx scripts/eon-push-drafts.ts --gate $SCRATCH/eon-gate-report.json --dry-run

# 2. Kanarya: yalnız 01 — sonra Etsy Drafts'ta kontrol et:
#    açıklama "...answered the same day." ile bitiyor mu (footer yok),
#    20 varyasyon iki eksende fiyat taşıyor mu, kapak yüklendi mi.
npx tsx scripts/eon-push-drafts.ts --gate $SCRATCH/eon-gate-report.json \
  --images-dir $SCRATCH/eon-covers \
  --shipping-profile <ID> --return-policy <ID> --only 01

# 3. Kalan 8
npx tsx scripts/eon-push-drafts.ts --gate $SCRATCH/eon-gate-report.json \
  --images-dir $SCRATCH/eon-covers \
  --shipping-profile <ID> --return-policy <ID> --only 02,03,04,05,06,13,14,15
```

- `--images-dir $SCRATCH/eon-covers` **zorunlu kabul et**: 16/16 kapak (NN.jpg) hazır;
  bayraksız koşum 0 fotolu taslak açar.
- Script idempotent: `etsy_listing_id` dolu listing atlanır; yeniden koşum çift açmaz.
- **Bilinen risk (yeni bulgu, itiraz sürecinden):** birden çok kaynak late-2025'ten
  beri fiziksel taslak create'inde `readiness_state_id`/processing-profile zorunluluğu
  raporluyor; script bu alanı göndermiyor. Kanarya 400 dönerse hata metnine bak —
  `readiness_state_id` geçiyorsa createForm'a alan eklenmeli (küçük script yaması),
  panik yok: create ilk yazma işlemi, temiz tekrar-koşulabilir.

---

## 2) PUSH ÖNCESİ QUICK-WIN PAKETİ (~15 dk, panelde `products` üzerinde; bekletmez ama en ucuz an şimdi)

### 2a. Tag takasları (hepsi ≤20 karakter — sayıldı)

Sorun (çapraz denetim, rakamlar doğrulanmış): 117 slotta 24 benzersiz tag (%79 kopya);
'anniversary gift' 9/9 klon; mm sorgusu SIFIR; 10K üçlüsünün tek kimliği bir karat tag'i.

| No | ÇIKAR | GİR |
|----|-------|-----|
| 01 | anniversary gift | 4mm wedding band |
| 01 | custom gold ring | 6mm gold band |
| 01 | womens gold band | womens wedding band |
| 01 | classic wedding band | domed wedding band |
| 02 | anniversary gift | 5mm gold band |
| 02 | custom gold ring | his wedding band |
| 02 | white gold band | 14k white gold band |
| 02 | womens gold band | womens wedding band |
| 03 | anniversary gift | 3mm gold ring |
| 03 | custom gold ring | heirloom band |
| 03 | womens gold band | womens wedding band |
| 03 | classic wedding band | classic wedding ring |
| 04 | classic wedding band | 10k wedding band |
| 04 | custom gold ring | 10k gold band |
| 04 | plain gold band | simple gold band |
| 04 | womens gold band | promise ring gold |
| 04 | anniversary gift | 7mm gold band |
| 05 | classic wedding band | 10k wedding band |
| 05 | custom gold ring | 10k gold band |
| 05 | plain gold band | simple gold band |
| 05 | anniversary gift | 10k white gold ring |
| 05 | womens gold band | 5mm wedding band |
| 06 | classic wedding band | 10k wedding band |
| 06 | custom gold ring | 10k gold band |
| 06 | plain gold band | unisex gold band |
| 06 | anniversary gift | 10k rose gold ring |
| 06 | womens gold band | promise ring gold |
| 13 | anniversary gift | 2mm wedding band |
| 13 | heirloom jewelry | thin wedding band |
| 14 | anniversary gift | 2mm gold band |
| 14 | heirloom jewelry | heirloom ring |
| 15 | anniversary gift | milgrain band 14k |
| 15 | heirloom jewelry | beaded gold band |

Notlar: 'anniversary gift' silinince niyet kaybolmaz — Etsy **Occasion=Wedding/Anniversary
attribute'u aramada tag gibi eşleşir** (push sonrası UI adımı, §3). 'engraved gold ring'
+ 'personalized ring' ikilisi her listingde korunur (gravür ürünün gerçek farklılaştırıcısı);
üçüncü kopya 'custom gold ring' rotasyona verildi. flat/beveled/knife terimleri bilerek
YOK — 07-12/16'ya rezerve.

### 2b. Açıklama ekleri (THE DETAILS bölümüne; footer'ın ÜSTÜNE ekle ki eşleşme anahtarı bozulmasın)

**01-06 (Dome) — fiyat + gram (2 cümle):**
> Priced by width and size — the price shown is the 3mm band in sizes 4-6.5; select your width and size to see your exact price. Wider bands simply carry more gold: a 3mm is about 3.6 g and a 7mm about 10.6 g in solid 14k (10k: about 3.2 g and 9.4 g).
*(14K rakamları EON-Varyant-eslesme.csv'den, 10K rakamları model geri-hesabından doğrulanmış; 01-03'e 14K, 04-06'ya 10K değerleri yazılır.)*

**13-15 (Milgrain) — fiyat (1 cümle; gram YAZMA — §4'teki DB doğrulaması bitmeden):**
> Priced by ring size — the price shown covers sizes 4-6.5, and the dropdown shows your exact price before you order.

**9/9 — güven satırları (1'er cümle):**
- Damga: "Stamped 14k inside the band." / "Stamped 10k inside the band." (damga varlıkları üretildi, metinde hiç geçmiyor — bedava güven sinyali)
- İade: "Beyond complimentary resizing, exchanges are covered by our shop policies — message us first and we will make it right." *(yapısal iade politikası Etsy widget'ında yaşar; bu cümle itirazı peşin yanıtlar)*

**02 / 05 / 14 (beyaz altın) — 1 cümle:** rodyum mu doğal sıcak-beyaz mı + nikel durumu
(gerçek neyse o yazılır; 'never plated' iddiasıyla çelişki kurma). Renk-split'in kendi
kopyasını kazandığı tek yer burası.

**04 / 06 — sarkan karşılaştırma tıraşı (opsiyonel ama ucuz):**
"The same domed profile in solid 10k…" → "A smooth domed profile in solid 10k yellow/rose gold — harder wearing than higher karats, at a friendlier price."

**01-06 — erkek-modal beklenti cümlesi (mens trafiği için):**
> Shown in 3mm. Wider bands carry more gold — a 6mm starts near $1,015 in 14k / $670 in 10k.

---

## 3) PUSH SONRASI ETSY UI KONTROL LİSTESİ (yayın = bu liste TAM olunca)

Sıra önemli; 1 tamamlanmadan hiçbir publish denemesi yapılmaz.

1. **[BLOCKER] Shop Manager > Finances:** Etsy Payments (banka) + billing kartı tamam mı?
   Panel API bağlantısının çalışması mağaza onboarding'inin bittiğini KANITLAMAZ.
2. **Kargo profili:** taslaklardaki profil = "5-7 iş günü işleme + ABD ücretsiz takipli
   kargo" mu? Değilse profili DÜZELT (paylaşılan nesne — bir düzeltme tüm bağlı
   listingleri günceller; gerekirse bulk-edit). $22 kargo fiyata gömülü: ücretsiz
   kargo şart, yoksa çifte tahsil.
3. **İade politikası:** 30 gün / değişim-dostu; gravürlü made-to-order istisna dili
   shop policies metnine. "Complimentary resizing" iade DEĞİLDİR — ikisi ayrı yaşar.
4. **Foto/video (listing başına):** hero otomatik geldi (NN.jpg); üstüne 9+ foto +
   video (partner havuzu: aile başına 17-23 foto, 5-6 video; EON-16-Media-Manifest.html)
   + **size chart** (`2026-07-16-eon-size-chart-1600.jpg`) + **aile width guide'ı**
   (`eon-width-guides/eon-width-dome.png` 01-06 · `eon-width-milgrain.png` 13-15)
   foto 2-3 olarak. Beden karmaşası = sipariş başına ~$30 işçilik + çift yön kargo.
5. **Attribute'lar (~1 dk/listing):** Occasion=Wedding; Metal=yellow/white/rose gold
   + karat; uygun Style. Renk-split stratejisinin ana faydası (sol panel filtreleri)
   attribute'suz ÇALIŞMAZ; ilk 48 saat boost'u attribute'suz harcanmasın.
6. **Mağaza bölümleri:** "Dome Bands" / "Milgrain Bands" aç, taslakları ata.
7. **Mağaza yüzeyi:** About (maker hikayesi, 'wearable inheritance' sesi, atölye/el
   fotoğrafı — who_made=i_did iddiasının yüzü), shop policies, kısa duyuru, banner.
8. **Publish kuralları:**
   - Bir taslak ancak 4-7 maddeleri TAMKEN yayınlanır; taze-listing penceresi tek seferlik.
   - **Dalga planı (aile bölünmez):** Gün 0: 01-03 → +3-4 gün: 04-06 → +7-8 gün: 13-15.
     ABD gündüz saatinde. Toplam ≤10 gün ("ölü mağaza" görüntüsü de risk).
   - Publish sonrası ilk 48 saat title/tag OYNANMAZ.
   - `should_auto_renew=false` gidiyor: yayında ya ON'a çek ya panele 4-aylık yenileme
     görevi aç — yoksa listing 4 ay sonra sessizce söner.
   - Maliyet: $0.20/publish.
   - Dalga 1'in Search Analytics verisi → dalga 2-3 tag'lerine geri beslenir.

---

## 4) FİYAT + AÇIK DOĞRULAMALAR

**Doğrulanmış olanlar (değişiklik gerekmez):** 9/9 renk kardeşi hücre-hücre eşit;
40/40 Dome hücresi modele ±%2.3 oturuyor, hiçbir hücre model altında değil; merdiven
315→380 (+%21) →555 (+%46) metal içeriğiyle orantılı; band basamakları monoton, şok
eşiği altında. 20 hücre / 70 varyant limiti — band inceltme alanı var ama **ilk 90 gün
4 bandla kal**; yorumlarda "beden değişince fiyat zıpladı" sinyali gelirse 8 banda çık.

**Açılış kolu (öneri):** %10-15 SALE **yalnız 04-06 + 13-15** (baz fiyat SABİT — Etsy
sale mekaniği üstü çizili çapayı korur): Milgrain görünür ~$268-284 ($300-altı hediye
kapısı), 10K Dome ~$323-342. **01-03 tam fiyat kalır** (heirloom sesiyle indirim çelişir,
mutlak dolar maliyeti yüksek). İlk 10-20 yorumda sale kapanır.

**Açık doğrulama 1 — Milgrain gramları (13-15; yayından, ideali dalga 3'ten ÖNCE):**
SKU-master'da Milgrain gram kolonları boş; matristen türeyen implied gram
1.77 / 2.01 / 2.17 / 2.25 g (4 band). Band1-max gerçek gram 2.0 g çıkarsa model fiyat
$345 olur → $315'te net marj ~%15'e düşer. Onaylı oturumda:
```sql
SELECT p.title, pv.sku, pv.properties, pv.price_cents/100.0 AS usd, pv.weight_grams
FROM product_variants pv JOIN products p ON p.id = pv.product_id
WHERE p.org_id = '9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'
  AND (p.description LIKE '%[EON 13 %' OR p.description LIKE '%[EON 14 %' OR p.description LIKE '%[EON 15 %')
ORDER BY p.title, pv.sku;
```
Band-max gram implied'ın ÜSTÜNDEyse matris yükseltilir (taslakta fiyat düzeltmesi kolay);
altındaysa mevcut fiyat marj fazlası taşır — dokunma. Sonuç ne olursa olsun taslak
push'u beklemez; yalnız 13-15'in PUBLISH'i bu doğrulamaya bağlanır.

**Açık doğrulama 2 — pazar medyanı (bilgi amaçlı, publish'i bağlamaz):**
```sql
SELECT researched_at, result_count, band_result_count, band_source,
       min_cents/100.0, median_cents/100.0, avg_cents/100.0, max_cents/100.0,
       our_price_cents/100.0, price_position, deviation_pct
FROM keyword_research
WHERE keyword = '10k gold comfort fit'
ORDER BY researched_at DESC;
```
7 snapshot'ta ÖNCE dedupe (en güncel kayıt). 10K konumu çıkınca 14K'yı çarpanla
ekstrapole et (bizim 14K/10K hücre oranı 1.46-1.53). Not: bu subagent'ta MCP SELECT
onay kapısına takıldı (denendi) — medyan uydurulmadı; eldeki tek DB kanıtı (yargı #06):
median $342.25 → $380 çapa ~60. yüzdelik, savunulabilir.

---

## 5) TEK PARAGRAF ÖZET

Dokuz listing de READY: itiraz süreci 8'inin blokerlerini düşürdü, 01'in ayakta kalan
tek blokeri de bu oturumda birincil kanıtla (strip regex'inin in_01 gerçek metnine karşı
çalıştırılması) çürütüldü. Gönderimi geciktiren hiçbir şey yok; gerçek işler sırasıyla:
.env.local anahtarları + kargo/iade profilleri → 15 dakikalık tag/metin paketi →
dry-run + 01 kanaryası → kalan 8 → Etsy UI tamamlama listesi → 3 dalga halinde,
liste TAMKEN publish. Milgrain gram SQL'i dalga 3'ten önce koşulmadan 13-15 yayınlanmaz.

---

## 6) ONAY PAKETİ EKİ (2026-07-16, paket üretim oturumu)

Karar uygulamaya döküldü: **`eon-onay-paketi.sql`** (Supabase SQL Editor'da tek
seferde çalıştırılır, idempotent) + **`eon-gate-report-v2.json`** (push script'in
nihai girdisi, 9 READY = PASS). Paket üretilirken §2'deki quick-win kalemleri
birincil kanıtla yeniden doğrulandı ve şu düzeltmeler yapıldı:

1. **Tag takas tablosu gerçek DB setlerine göre yeniden kuruldu.** §2a'daki ÇIKAR
   kalemlerinin bir kısmı taslaklarda hiç yok ('custom gold ring', 'womens gold
   band', 'plain gold band'; 13-15'te 'heirloom jewelry' değil 'heirloom ring' var).
   Niyet korundu: 'anniversary gift/ring' klonu 9/9 çıktı; mm kapsaması 3-7mm
   dağıtıldı (01:4mm, 02:5mm, 03:3mm, 04:7mm, 05:5mm, 06:6mm, 13-14:2mm);
   10K kimliği (+'10k wedding band'/'10k white|rose gold ring') ve gravür
   farklılaştırıcısı ('engraved gold ring' 01-03, 'free engraving' 04-06+13-15)
   girdi; kardeşler artık 3-5 tag'de ayrışıyor. 9 set deterministik QA motorundan
   (13 tag, ≤20 kr, kök ≤4, tekrar yok) 0 hatayla geçti.
2. **Gram cümlesi rakamları düzeltildi** (§2b'deki 10.6g/9.4g yanlıştı):
   varyant tablosu birincil kanıtına göre 14k 3mm≈3.6g / 7mm≈8.4g,
   10k 3.2g / 7.4g (US 4-6.5 bandı). 6mm çapaları doğrulandı: $1,015 (14k) /
   $670 (10k) — birebir EON-01/04-6MM-B1.
3. **ONAYLANDI damgası `[EON NN · ` önekini korur** (`[EON 01 · ONAYLANDI
   2026-07-16 · …`). Önce planlanan `[ONAYLANDI ✓ · EON …` formatı push
   script'in `stripInternalTrailer` regex'ini (`\n---\n\[EON `) kırar, dahili not
   Etsy'ye sızardı — paket üretiminde yakalandı.
4. **Beyaz altın cümlesi (02/05/14) pakete YORUM SATIRI olarak girdi** — rodyum
   mu doğal beyaz mı partner cevabı olmadan yazılamaz ('never plated' iddiasıyla
   çelişki riski). Cevap "rodyumsuz" ise üç satırın başındaki `-- ` kaldırılır.
5. **"Stamped 14k/10k inside the band" satırı pakete girdi** — damga görselleri
   üretildi; ATÖLYEDEN karat damgası teyidi alınmadan Etsy'ye PUBLISH etme
   (ABD damga yasası karat iddiasının yanında üretici markası ister).

Paket ayrıca içerir: archived_at düzeltmesi (10 eski taslak), 0097 (EBITDA
RPC — /maliyetler kartı bunu bekliyor) ve 0098 (competitor_watch audit) migration,
4 doğrulama SELECT'i (13-tag/damga/anniversary-sıfır/Milgrain gram).
