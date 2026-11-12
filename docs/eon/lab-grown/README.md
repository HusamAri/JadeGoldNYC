# EON lab-grown pırlanta hattı

Üretici: WhatsApp'ta "abi" diye yazan atölye (el yazısı not 2026-11-04). Konvansiyon by Artifact
Studio'nun üreticisiyle aynı: 14K bant = gram × $100 işçilik dahil, ek kalemler ayrı
(`docs/artifact-studio/maker_cost.py`). Taşlı modellerde teklif parça başına her şey dahil geldi.

## 01 Double Shared Prong (EON-DSP), 2026-11-04
- Fiyat kararı (sahip): liste **$1.200** → %25 vitrin → alıcı **$900**; rakip $945. Kanıt:
  `2026-11-04-double-shared-prong-pricing.md` + `price_model.py`.
- Kapsam v1 (sahip): 14K, Metal Color (Yellow/White/Rose) × Ring Size (US 4–10, yarım bedenler),
  yarım tur 13 taş ≈ 0,78 ct, **her beden tek fiyat**. 18K / dörtte üç tur / platin yeni teklif ister.
- Panel taslağı: `supabase/migrations/0175_eon_lab_grown_dsp.sql` (canlıda MCP adı `0173_eon_lab_grown_dsp`; main'de 0173/0174 başkasına ait, dosya 0175'e taşındı; üreteç
  `scripts/eon/gen_lab_grown_dsp_migration.mjs`, girdi `01-double-shared-prong/listing.json`).
  Ürün `EON-DSP` (`product_type = 'ring'`, protokol `listing_metadata.listingProtocol = ring_band`),
  39 varyant `EON-DSP-14K-{YG,WG,RG}-US040..100`,
  taş künyesi `products.stone_*` + `product_variants.stone_carat/stone_cost_cents` (`manual`, teklifin
  içinde ayrıştırılmamış ~$6/taş). Gram geometriden (`estimated`, US4 3,87 g → US10 4,95 g).
- Mühür: `93cbbc41e4f3cd1e28d8d41db67e1ac4`
  ```sql
  select md5(string_agg(sku||'|'||(properties->>'Metal Color')||'|'||(properties->>'Ring Size')||'|'
    ||price_cents||'|'||to_char(weight_grams,'FM990.00'), E'\n' order by sku collate "C"))
  from product_variants where sku like 'EON-DSP-%';
  ```
- **Sınıf: bant, alyans DEĞİL (sahip, 2026-11-04).** Protokol `ring_band` (canlıda var olan kayıt,
  Jewelry > Rings > Bands 1232, zorunlu eksen yok, gravür yok). Başlık "14K Gold Lab Grown Diamond
  Band, Double Shared Prong, Half Eternity, 2.75mm". Vaka: ilk sürüm yalnız bu PR'da duran
  `diamond_band` id'sini taşıyordu; prod tanımadığı id'yi `product_type = ring`'e düşürdü ve alyans
  kuralı panel push'unu "her varyant Width ve Ring Size içermelidir" ile durdurdu (Etsy'ye yazılmadı).
  Düzeltme canlıda tek satır UPDATE (koşullu, audit_log), regresyon `tests/listing-protocol.test.ts`.
- Panelde: **Listing Önerileri > Panel Taslakları** (EON seçiliyken), satır linki
  `/tasarimlar/listing/f0896e3c-7127-4c89-815d-b9344810d6e1`.
- **Galeri = sahibin panel yüklemesi** (2026-11-04 19:25–19:27, Supabase storage): 10 karenin 8'i
  (01, 02, 03, 04, 06, 08, 09, 10; 05 ve 07 yüklenmedi), MD5 ile eşlendi. Kapak düzeltmesi:
  `products.image_url` ilk yüklenen 09'u (yazılı) gösteriyordu ve push önce onu yükler; galeri sırası
  0'daki 01'e (yazısız) çekildi. Repo kopyası ve galeri migration'ı tutulmadı (çift görsel olurdu).
- Görsel QA: ölçü kareleri 2,50 mm / 2,75 mm listing'le aynı; "LAB-GROWN DIAMONDS" niteleyicili.
  Bulgu: yüzden bakış karesi (04) **11 taş** gösteriyor, ürün 13; tüm kareler sarı altın.
  Açıklamada AI/görsel beyanı yok (sahip kuralı 2026-10-27/31; `publicTextProblem` 0 sorun).
- **Etsy:** panel "Etsy'ye gönder" TASLAK açar (sahibin eylemi). `draftTransfer` hold'u yalnız
  `ops/drafts-push`'u bağlar, panel butonu onu okumaz. **Yayına alma** için en az bir gerçek,
  düzenlenmemiş ürün fotoğrafı şart; AI kare ilk fotoğraf olamaz (playbook 01/04).

## 02 Vertical Baguette (EON-VB6), 2026-11-07
- Girdi: üreticinin WhatsApp fotoğrafı (PISSARRO filigranlı, üçüncü taraf) + "abi bizim ki 6mm" + notun Model 2'si.
- Fiyat kararı (sahip): liste **$2.665** → %25 vitrin → alıcı **$1.999**, her beden tek fiyat. Kanıt:
  `2026-11-07-vertical-baguette-pricing.md` + `price_model.py vb`. Okuma B: 11,5 g × $100 + taş $98 + takma $10.
- Kapsam v1 (sahip): 14K, Metal Color × Ring Size **US 4–16** yarım bedenler, 75 varyant
  `EON-VB6-14K-{YG,WG,RG}-US040..160`, `ring_band`. Gram üreticinin beden eğrisi, 11,5 g @ US 8½ (`estimated`).
- Panel taslağı: `supabase/migrations/0176_eon_lab_grown_vb6.sql` (üreteç `scripts/eon/gen_lab_grown_vb_migration.mjs`,
  ortak metin kapıları `scripts/eon/lab_grown_gates.mjs`). Ürün id `0a054271-36ad-490d-a073-954cb0d54fc1`.
- Mühür: `5af23988109992c54d50bb2de6cfd385` (sorgu DSP'ninkiyle aynı, `sku like 'EON-VB6-%'`).
- Galeri: Higgsfield, 10 kare, `02-vertical-baguette/images/` (prompts.py → prompts.json, jobs.json, status.json).
  Kural: taş "vertical" değil fiziksel tarifle yazılır ("crosswise, at right angles to the band", kare köşe, 3:1);
  "set vertically" modelde resim düzlemine göre okundu ve 01 v1'de taşı boylamasına, emerald kesimle çizdi.
- Açıklamada karat YOK (6 × 2 mm için notta 0,35 ct, tipik 0,15-0,20 ct; üretici teyidi bekliyor).
- Galeri dosyaları `public/eon/lab-grown-vb6/01-10.jpg` (2400×1792, sRGB, meta verisi sökülmüş, <1 MB), panel
  satırları `0177_eon_lab_grown_vb6_gallery.sql` (üreteç `scripts/eon/gen_lab_grown_vb_gallery_migration.mjs`).
  **0177 ancak prod dağıtımından ve 10 URL'in 10'u 200 döndükten sonra uygulanır**; push önce `image_url`'i
  (01, yazısız hero) yükler. 14 üretim / 28 kredi: 10 kabul, 4 ret (gerekçeler `images/status.json`).

## 03 Flush Round (EON-FR6), 2026-11-08
- Girdi: sahibin Etsy linki 4512052520 (AarsanJewels, moissanite, 14K $800,91 indirimli). Etsy konteynere 403 veriyor;
  sayfa **Google çeviri vekiliyle** (`www-etsy-com.translate.goog/listing/<id>/<slug>?_x_tr_sl=tr&_x_tr_tl=en`) okundu,
  fotoğraflar `i.etsystatic.com`'dan doğrudan indi (JSON-LD: başlık, açıklama, fiyat aralığı, görsel URL'leri;
  `variation-selector-*` seçenekleri ve fiyatları).
- Tasarım: 6 × 1,5 mm, fırçalanmış yüz, iki cilalı faset kenar, merkez dışı (~3 : 2) tek cilalı kanal, kanalın üstüne
  flush oturan tek round. Referans 0,10 ct diyor; fotoğrafta taş bant genişliğinin ~1/3'ü = **~2,0 mm (≈0,03 ct)**
  (0,10 ct ≈ 3 mm, 1,5 mm duvara flush oturmaz). Açıklamada karat YOK, "about 2 mm" var.
- Fiyat kararı (sahip): liste **$1.800** → %25 vitrin → alıcı **$1.350**, her beden tek fiyat (US 16 dahil en kötü Offsite
  ≥ $50). Üretici teklifi YOK: liste gramı (`list_g14`, US 8½ 7,64 g) × $100 + taş $20 + takma $10. Kanıt:
  `2026-11-08-flush-round-pricing.md` + `price_model.py fr`.
- Panel taslağı: `supabase/migrations/0179_eon_lab_grown_fr6.sql` (üreteç `scripts/eon/gen_lab_grown_fr_migration.mjs`;
  onay `listing.json`'a yazılmadan çalışmaz). Ürün id `7675f0e3-9fae-4f6a-bca3-81b1562a6c17`, 75 varyant
  `EON-FR6-14K-{YG,WG,RG}-US040..160`, `ring_band`. Mühür `2f1eccd3a9bc2d9344ed06818a43456f` (sorgu DSP'ninkiyle
  aynı, `sku like 'EON-FR6-%'`). `EON-FROST-*` önekiyle çakışmaz (`EON-FR6-` ayırıcılı).
- Ortak modüller: `scripts/eon/lab_grown_band.mjs` (varyant satırları, mühür, taslak SQL) ve
  `scripts/eon/lab_grown_gallery.mjs` (galeri kapıları + SQL); 0176 ve 0177 taşındıktan sonra bayt bayt aynı üretildi.
- Galeri: Higgsfield, 10 kare, `03-flush-round/images/` (prompts.py → prompts.json, jobs.json, status.json,
  PROMPTS-REVIEW.md). Referans kırpımlar ref06'dan; "Aarsan" filigranı morfolojik kapamayla silindi, kırpımlar repoya
  ALINMADI. 15 üretim / 30 kredi: 10 kabul, 5 ret (gerekçeler `status.json`). Dosyalar `public/eon/lab-grown-fr6/01-10.jpg`,
  panel satırları `0180_eon_lab_grown_fr6_gallery.sql`; **0180 ancak prod dağıtımından ve 10 URL'in 10'u 200 döndükten
  sonra uygulanır.**

## 04 Hammered Star (EON-HS5), 2026-11-10
- Girdi: sahibin Etsy linki 4581494716 (BRIARLORE, 925 gümüş + moissanite, $175,81). Sayfa yine Google çeviri
  vekiliyle okundu. Referans: 5 mm, iç içe yuvarlak dövme izleriyle kaplı düz yüz, iki kenarda dar cilalı kenar,
  sekiz uçlu oyma yıldızların ortasında round taş. Referansın 2,3 mm iddiası fotoğrafla çelişiyor (taş genişliğin
  ~1/3'ü ≈ 1,5 mm; 2,3 mm taş 1,5 mm duvara güvenle oturmaz).
- **Sahip düzeltmesi (hero v1'den sonra):** "taşlar 4 adet eşit aralıkta konumlanmış olmalı" → DÖRT taş, bant çevresinde
  çeyrek tur (90°) arayla. Hiçbir açıdan dördü birden görünmez; önden bakınca ikisi görünür (referansın ilk fotoğrafı
  da böyle). Üreticinin 2026-11-04 notundaki **Model 3** (yıldız tasarım, 6 mm, 4 taş, 14K US10 $850, "casting ≈ $110")
  bu tasarıma çok yakın; tahminimiz 5 mm US10'da $825 maliyet, yani teklifle tutarlı (5 mm için muhafazakâr).
- Fiyat kararı (sahip, iki kart): liste **$1.800** → %25 vitrin → alıcı **$1.350**, her beden tek fiyat. Dört taşla
  maliyet US 8½'te $787 (6,37 g × $100 + taş $40 + takma $40 + ışın $40 + dövme $30); en kötü Offsite kârı en düşük
  US 16'da +$111; %35 vitrinde US 14 başabaş, US 16 −$52 (sahip bunu görerek $1.800'ü korudu). Kanıt:
  `2026-11-10-hammered-star-pricing.md` + `price_model.py hs`.
- Panel taslağı: `0182_eon_lab_grown_hs5.sql` (iki taşlı ilk hâl, uygulandığı gibi DONUK; üreteç md5 kapısıyla korur) +
  `0183_eon_lab_grown_hs5_four_stones.sql` (koşullu UPDATE: metin, `stone_count` 4, `setting_fee_cents` 2000 taş başı
  = yuva + ışın, meta veri, varyantlarda taş 0,05 ct / $40). Üreteç `scripts/eon/gen_lab_grown_hs_migration.mjs` artık
  0183'ü yazar. Ürün id `6414f890-0ffd-4325-a60f-b5ce121c00e0`, 75 varyant `EON-HS5-14K-{YG,WG,RG}-US040..160`,
  `ring_band`, mühür `84001e3e3e8310a04d5a86f7249c6fd3` (fiyat ve gram değişmediği için iki migration'da aynı).
  Panelin `variant_stone_cost` görünümü taş tarafını $120 görür; $30 dövme işçiliğinin alanı yok, meta veride durur.
- Galeri: `04-hammered-star/images/`. Doğal pencere ışığı; her metal kendi tamamlayıcı renginde zemin (sarı → mavi-gri
  arduvaz, çivit, denim, kobalt; beyaz → kumtaşı; rose → adaçayı; üçü birden → nötr kireçtaşı); renk karelerine
  siyah-beyaz referans. 23 üretim / 46 kredi: 10 kabul (3'ü kendi karesinin bant-genişliği düzenlemesi), 13 ret;
  gerekçeler `status.json`, düzenleme prompt'ları `jobs.json` → `edits`. Dosyalar `public/eon/lab-grown-hs5/01-10.jpg`,
  panel satırları `0184_eon_lab_grown_hs5_gallery.sql`; **0184 ancak prod dağıtımından ve 10 URL'in 10'u 200 döndükten
  sonra uygulanır.** Uygulandı 2026-11-11 (`20261111171123`, 10 URL canlıda 200 ve repoyla md5 birebir): 10 satır
  (pozisyon 0–9), mühür `5edd3c14d72a68f904b8ad95c2f71143`
  (`md5(string_agg(position||'|'||url||'|'||alt, E'\n' order by position))`), kapak 01, denetimde 10 + 1.

## 05 Half Eternity Pavé, taş seçimli (EON-HEP), 2026-11-11
- Girdi: sahibin Etsy linki 685259244 (NyFineJewelry / Nobel Yates, 5,0 yıldız, 320 yorum; 14K lab ~$373,50 alıcı) ve
  aynı listing'in 20 taşlık "Stone Available" tablosu: "new model all stone choices as specialization option". Sayfa
  Google çeviri vekiliyle okundu; fotoğraflar repoya alınmadı.
- Tasarım: 14K, 1,5 × 1,5 mm, üst yarıda tek sıra ~1,3 mm round taş, paylaşımlı mikro tırnak, alt yarı düz cilalı.
  Taş sayısı bedenle: yarım dış çevre / 1,45 mm → US 4 19, US 8½ 23, US 16 30 (kötümser; sabit sayı da olabilir).
- **Taş seçimi kişiselleştirmede, varyasyonda değil:** açılır liste "Stone" (zorunlu, 20 seçenek, varsayılan Lab Grown
  Diamond) `listing_metadata.personalizationQuestions` içinde; `lib/etsy/create-listing.ts personalizationFor` onu
  protokolün sorusu yerine Etsy'ye yazar. Etsy (canlı OpenAPI + personalization migration rehberi, 2026-11-11): 1–30
  seçenek, etiket ≤20 kr, dropdown'da `instructions` yok, `add_on_price` yalnız isteğe bağlı text_input'ta. Yani
  **kişiselleştirme fiyatı değiştiremez, tek fiyat en pahalı taşı da karşılar**; 20 taş × 75 varyant = 1.500 > 400
  ürün sınırı, varyasyon olamazdı. Etiketler ve FTC eşlemesi (lab taş "Lab Grown"/"Lab Created"/"Created" ile, doğal
  pırlantalar açıklamada "natural" ile, işlemler beyanlı): `2026-11-11-half-eternity-pave-pricing.md`.
- Fiyat kararı (sahip kartı): liste **$1.050** → %25 vitrin → alıcı **$787,50**, her beden ve her taş tek fiyat; US 16'da
  en pahalı taşla ($5/taş) en kötü Offsite kârı +$63. Taş eşlemesi önerildiği gibi kaldı. Kanıt: fiyat belgesi +
  `price_model.py hep`.
- Panel taslağı: `0185_eon_lab_grown_hep.sql`, uygulandı 2026-11-11 (`20261111175933`); gövdesi DONUK, üreteç
  `scripts/eon/gen_lab_grown_hep_migration.mjs` md5 kapısıyla korur (düzeltme yeni bir koşullu UPDATE migration'ıdır).
  Ürün id `306333d4-0903-46ea-af40-2b3e4602add6`, 75 varyant `EON-HEP-14K-{YG,WG,RG}-US040..160`, `ring_band`, mühür
  `54bb79369f3ccc574c28f829c9ede406` (canlı = meta veri = beklenen), kişiselleştirmede 20 taş. Varyant başına taş karatı
  ve taş + takma maliyeti (`products.setting_fee_cents` 0, çünkü taş sayısı bedenle değişir). Ortak modül
  `bandCells(…, stoneAt)` ve `bandMeta` kişiselleştirme alanlarını öğrendi; 0175–0184 bayt bayt aynı üretiliyor. Metin
  kapısı `checkListingText(L, { allowNatural })`; yedi negatif kontrol (niteliksiz diamond, 21 kr etiket, niteleyicisiz
  lab taş, tavanı aşan taş, eksik seçenek, silinen işlem beyanı, en pahalı taşta zarar eden fiyat) yakalandı.
- Galeri: `05-half-eternity-pave/images/`: 9 Higgsfield karesi (`prompts.py` → `prompts.json`, `PROMPTS-REVIEW.md`)
  + 10. kare taş tablosu, `stone_chart.py` ile yerelde dizilir (kredisiz, metni model yazmaz). **Sahip düzeltmesi (v1
  setinden sonra):** "taşlar yarım tur tam tur değil". v1'in 9 karesinin 6'sında sıra yarımı aşıp arka yarıya
  taşmıştı. Düzeltme: her poz için saat yüzü (yatık: 9 → 6 → 3, 6 kameraya en yakın; dik: 9 → 12 → 3), halka
  bloğunda "exactly half and no more", referans listing'in bütün-halka kırpımı yerine yalnız sıra kırpımları (o kırpım
  yarımdan geniş görünen kendi kaplamasını taşıyordu); 06 alçak yan görünümde iki kez taştı, dik poza geçti; 09 v3'te
  onaylı hero v2'nin gri kırpımı. 17 üretim / 34 kredi: 9 kabul (02, 04, 08 v1; 01, 03, 05, 07 v2; 06, 09 v3), 8 ret;
  gerekçeler `status.json`, her kabulün prompt'u gönderilen metinle birebir (`promptMd5`). Dosyalar
  `public/eon/lab-grown-hep/01-10.jpg`, panel satırları `0186_eon_lab_grown_hep_gallery.sql`; **0186 ancak prod
  dağıtımından ve 10 URL'in 10'u 200 döndükten sonra uygulanır.** Uygulandı 2026-11-12 (`20261112052839`; prod yayını
  `41fb224` READY, 10 URL canlıda 200 ve repoyla md5 birebir): 10 satır (pozisyon 0–9), mühür
  `8f76d63e40811b7e3ed7b87f8380afe0` (`md5(string_agg(position||'|'||url||'|'||alt, E'\n' order by position))`), kapak 01,
  `num_images` 10, varyant mührü değişmedi, denetimde 10 + 1.

## Üreticiye açık sorular (cevap gelmeden Etsy'ye çıkmaz)
0. **(2026-11-07, DSP canlı)** $550 (Model 1) ve $1.150 (Model 2) fiyatlarına taş ve taş takma dahil mi? Model 2'de
   11,5 g × $100 = $1.150 tam tuttuğu için konvansiyon "gram × $100 + taş + takma ayrı" görünüyor; DSP'de taş ve takma
   ayrıysa en kötü Offsite kârı $134'ten $4'a (taş ~$100/ct) ya da −$136'ya (taş $280/ct) düşer. Sahip: fiyat aynı,
   önce sor. Model 2 için ayrıca: 6 × 2 mm baget 0,35 ct mi, fiyat bedenle değişir mi?
1. $550, US 4–10 için tek fiyat mı? (not "örn. size 7" diyor; US10'da altın +$42.)
2. Taşların rengi/berraklığı (referans D/VS1 iddia edilmedi; `stone_color/clarity` boş).
3. Beyaz altın rodyum kaplı mı? (FTC §23.7 beyan; metinde kaplama iddiası yok.)
4. Üretim süresi (referans 6–8 hafta; metin kargo profiline atıf yapıyor).
5. Numune fotoğrafı: gerçek, düzenlenmemiş, ≥2000 px, ilk kare tek ürün; sonra 10'lu set.
6. **(2026-11-08, FR6)** 6 × 1,5 mm faset + kanal + tek flush round için fiyat (gram × $100 + taş + takma mı?); 1,5 mm
   duvara flush oturacak en büyük round (tasarım 2,0 mm ≈ 0,03 ct); daha büyük taş istenirse minimum kalınlık.
7. **(2026-11-10, HS5)** Bu tasarım Model 3 (yıldız, 4 taş) ile aynı iş mi? 5 × 1,5 mm dövme yüzle fiyat ve "casting
   ≈ $110" o fiyatın içinde mi? 1,5 mm duvarda yıldız yuvasına oturacak taş (tasarım 1,5 mm ≈ 0,013 ct; referans 2,3 mm
   diyor); dört yıldız çeyrek tur arayla (US 8½'te merkezden merkeze ~17 mm) bedenle nasıl ölçeklenir, kaç beden
   resize aralığı bozmadan yapılır; taş rengi/berraklığı, beyaz altında rodyum, üretim süresi.

8. **(2026-11-11, HEP)** 1,5 × 1,5 mm bant, üst yarıda ~1,3 mm round taş, paylaşımlı mikro tırnak: fiyat (gram × $100
   + taş + taş başı takma mı; mikro tırnakta takma kaç $?); taş sayısı bedenle mi (US 4 19 → US 16 30) sabit mi; 20 taşın
   hepsi bu boyda bulunur ve bu tırnakla takılır mı (opal, aytaşı, turkuaz, oniks, inci genelde kabaşon/boncuk, inci pim
   ya da kap ister); lab-grown renk/berraklık, beyaz altında rodyum, üretim süresi.

## Diğer teklifler (aynı not, ileride)
- Model 2: 6 mm baguette eternity, 2,20 mm min kalınlık, 6×2 mm taş 0,35 ct, taş $280/ct,
  8½ beden 11,5 g → $1.150 + taş takma $10.
- Model 3: yıldız tasarım 6 mm, 4 taş, 14K US10 $850; "casting ≈ $110 gibi düşün".
- Tek taş ölçeği (taş başına): 1 ct $200, 2 ct $400, 3 ct $700, 4 ct $900–1.000.
- Üreticinin uyarıları: küçük taşla başla; resize ve iade; tam tur resize olmaz; fiyat bedenle oynamasın.
