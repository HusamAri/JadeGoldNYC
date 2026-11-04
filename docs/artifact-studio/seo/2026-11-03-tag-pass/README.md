# Leander tag geçişi 2026-11-03: ölü hediye/occasion slotları Jade'in çalışan etiket dilbilgisine

Neden: sahibin "JadeGoldNYC Working Tags Playbook" dokümanı (2026-11-02; 12 ay, 167,4K ziyaret, 20.893
aramalı ziyaret). Hediye/occasion tag'leri 0 arama ziyareti (Gift for Him 13/13, Gift for Her 10/10 ölü,
Unisex Gold Bracelet 5/7, Good Luck Charm ölü); çalışan 15 tag'in hepsi ayar + renk + model + ürün
(14K Gold Bracelet 916 ziyaret, Evil Eye Pendant 157 / 72 sipariş, Mens Gold Bracelet 261, Box Chain
Bracelet 208). Rapor Leander için: evil eye ve zincir bileklik merdivenlerini kopyala, Nazar tag'e
girmesin, gümüşte ayarın yerine sterling silver. Playbook 03 (2026-11-02): hediye/occasion/his/unisex
sözcüğüne slot yok. Hedef: Leander'ın Etsy Search ziyaretini Jade'in kalıbıyla büyütmek.

Kalıp taşındı, kelimeler değil: her listing'in ürünü, modeli, satılan ayarı (varyantlardan) ve rengi ile
merdiven kuruldu (`ladder`): ayar + ürün, solid + ürün, model + ürün, renk + ürün (yalnız satılan renk),
mens + ürün (yalnız başlık erkek diyorsa), diğer ad. Hacim sıralama ölçütü DEĞİL: eRank "gift for her"e
13.273 arama verir, Jade'de aynı tag 0 ziyaret aldı; geniş terim ürün sayfasına ulaşmaz. Hacim
`report.md` kanıt tablosunda yalnız sütun.

- "Önce" hâli: `panel-before.json` (panel aynası + varyant ayar/renk kümesi, 2026-11-03 19:34 UTC senkronu).
- Üret + kapı: `python3 scripts/seo/tag_pass_leander_2026_11_03.py` → `apply-matrix.json` + `report.md`.
  Kapı: 13 tag, ≤20 kr, tekrar ve kelime-kümesi tekrarı yok, korunan tag'ler ve başlık birebir, renk
  tag'i yalnız satılan renkte, ayar tag'i yalnız satılan ayarda, silver yalnız gümüşte, mens yalnız
  erkek başlıkta, evil eye yalnız evil eye üründe, eklenen tag'de hediye/his sözcüğü yok.
- Test: `npm run test:seo-apply` (`tests/seo-tag-pass-leander-2026-11-03.test.ts`).
- Uygula: `ops/seo-apply?org=by Artifact Studio Jewelry&pass=tags-2026-11-03&ids=<≤10>` (kuru),
  `&apply=1` yaz; her parti aynı turda geri okunur, ardından taze token'la kuru tekrar = `already`.
  Canlı başlık/tag panel aynasından farklıysa `live-changed` atlanır (sahibin elle düzenlemesi kazanır).
- Geri alma: `audit_log` `etsy.seo_push` (`SEO matrisi (tags-2026-11-03) …`) `diff.before.tags`.

Kapsam: 125 aktif listing, 210 slot (başlık ve 1.415 tag aynen). Kapsam dışı (bilerek):
- Noel/kış koleksiyonu 35: sezon parçasında "christmas gift" alıcının kendi ifadesi (EON 11-02 kararı).
- 2026-10-22 başlık yazımından sonra sahibin elle düzenlediği 13 listing (+5 salata setinde) (ör. 4592082893 evil eye pendant,
  4590688355 cuff, 4590687777 box chain): sahibin tezgâhı; ölü slotları duruyor, sahip isterse ikinci parti.
- Gümüş zincirler (4 aktif + 2): sahip 2026-10-27'den sonra başlık + 13 tag'i Etsy'de değiştirmiş; tag'ler
  dış araçtan kelime salatası ("men man statement", "versatile designer"), slot takası değil yeniden
  kurulum ister; `docs/artifact-studio/silver-chains/listings.json` kaynağı hazır, sahibe ayrı soru.
- Taslak 14, ölü slotu olmayan 33, kelime salatası tag seti 1 (4583755575; toplam 10 listing dış araç salatası, 6 altın + 4 gümüş: sahibe ayrı soru).
- His (vibe) tag'leri (dainty 100+, minimalist, everyday) BİLEREK kaldı: Jade'in alıcısı erkek zincir
  alıcısı, Leander'ın mine/halhal alıcısı kadın; raporun Ophir notu "minimalist/dainty'yi silmeden önce
  test et" diyor; Leander'ın kendi 30 günlük terimi 13 satır. 21 Kasım ölçümünden sonra ayrı karar.

Ölçüm: `../2026-10-21-etsy-keyword/STATE.md` 21 Kasım okumasıyla aynı pencere (Shop Manager > Stats,
30 gün, Etsy Search); 10-21 tabanı 518 ziyaret / 12 Etsy Search ziyareti / 1 sipariş. Başlık (10-22) ve
tag (11-03) geçişleri ile 25 Ekim reklam daraltması aynı paketin parçası sayılır; ayrı ayrı atfedilmez.

## Durum (2026-11-03 20:30–20:40 UTC, uygulandı)
- Prod deploy `ed95409` READY (handover-atlas derlemesi 25 dk "Cloning"da asılı kalıp kuyruğu tıkadı, iptal edildi).
  Kuru 13 parti 126/126 `dry`, 0 `live-changed`; kuru koşu kelime-salatası setini (4583755575) gösterdi, kapsam dışına
  alındı (63768f5). Kanarya 10 apply → taze token'la 10/10 `already`; 12 parti 115 `applied`, aynı turda geri okuma
  125/125; bağımsız okuma 125/125 `already`, 0 hata, 0 başlık dokunuşu.
- Audit `etsy.seo_push` "SEO matrisi (tags-2026-11-03)": 125 satır, 125 ürün, 125 "read-back doğrulandı".
- Panel aynası mührü (125 ürün, `md5(string_agg(id||'='||tags))`) = üreteçten beklenen `df722568f2d0936bbcdf00925ce6b0e0`.
- Aktif listing'lerde kalan ölü slot 117 / 55 listing = tamamı kapsam dışı küme (Noel 35, elle düzenlenmiş 13,
  salata 6, gümüş 1).
- Token: 40 basıldı, 39 kullanıldı (13 kuru + 13 apply + 13 verify), 1 yakıldı.
- İkinci koşu ön koşulu: canlı tags mührü zaten `df722568…` ise iş yapılmıştır; rota da 125'i `already` döner.

## Yeniden kurulum (rebuild-2026-11-03, 2026-11-04 08:48 UTC, uygulandı)
- 10 kelime-salatası seti (6 altın + 4 gümüş) `?pass=rebuild-2026-11-03` ile kuruldu: kuru 10/10 `dry`,
  apply 10/10 aynı turda geri okundu, taze token'la bağımsız okuma 10/10 `already`; başlık dokunulmadı.
- Audit `etsy.seo_push` "SEO matrisi (rebuild-2026-11-03)": 10 satır, 10 "read-back doğrulandı".
- Panel aynası mührü (10 ürün) = üreteçten beklenen `e344c0ced3e6b59940dab16405db8d4b`; 10/10 sette ≥9 ürün adlı tag.
- Not: ilk 6 token deploy beklerken (handover-atlas kuyruğu, 11 saat) 4 saatlik ömrünü doldurdu, 401; 6 yenisi
  basıldı, 3 kullanıldı, 3 yakıldı. Token ömrü deploy süresinden uzun seçilmeli ya da deploy sonrası basılmalı.
