# EON tag geçişi 2026-11-02: alyanslarda iki ölü "occasion" slotu alıcı ifadesine

Neden: 2026-10-21 üreteci her alyansa `anniversary gift him` + `promise ring for him` yazdı
(152 + 152 slot). EON'un kendi 30 günlük arama terimleri (188 terim, 215 ziyaret; 2026-10-21,
`../2026-10-21-etsy-keyword/data/etsy-search-terms-30d.tsv`) bu ikisiyle **0** kez eşleşiyor;
Jade Gold NYC'nin 12 aylık verisinde (sahibin "Working Tags Playbook" dokümanı, 2026-11-02)
hediye/occasion tag'leri 0 arama ziyareti aldı (Gift for Him 13/13 ölü). Alıcı ayar + renk +
model + ürün yazıyor: `mens white gold wedding band` 7, `10k gold wedding band` 3.
Playbook 03: "30-60 günde 0 gösterim alan tag değişir".

Kalıp taşındı, kelimeler değil: Jade'in çalışan etiket dilbilgisi (ayar+ürün, renk+ürün,
mens+ürün, diğer isim) EON'un kendi terimleriyle puanlandı; seçilenler `report.md` kanıt tablosu.

- "Önce" hâli: `panel-before.json` (panel aynası, 2026-11-02 22:05 UTC senkronu = canlı).
- Üret + kapı: `python3 scripts/seo/tag_pass_2026_11_02.py` → `apply-matrix.json` + `report.md`.
  Kapı: 13 tag, ≤20 kr, tekrar ve kelime-kümesi tekrarı yok, korunan 11 tag ve başlık birebir,
  renk tag'i yalnız o renkte, ayar tag'i yalnız satılan ayarda, eklenen tag'de hediye/his sözcüğü yok.
- Test: `npm run test:seo-apply` (`tests/seo-tag-pass-2026-11-02.test.ts`).
- Uygula: `ops/seo-apply?org=EON&pass=tags-2026-11-02&ids=<≤10>` (kuru), `&apply=1` yaz; her parti
  aynı turda geri okunur, ardından taze token'la kuru tekrar = `already`. Canlı başlık/tag panel
  aynasından farklıysa `live-changed` atlanır (sahibin elle düzenlemesi kazanır).
- Geri alma: `audit_log` `etsy.seo_push` (`SEO matrisi (tags-2026-11-02) …`) `diff.before.tags`.

Kapsam dışı (bilerek): 2026-10-22 yazımından sonra elle düzenlenmiş 7 listing (sahibin tezgâhı;
4539493533, 4539780408, 4554025310, 4562238597, 4598714962, 4598716086 + 4565352791'in tag'i),
Noel/stacking/fidget/sizer (farklı alıcı; eRank: dainty gold ring 1.326, stacking ring 1.205),
4581897450 Ridge Wedding Band (0 tag, 0 varyant, Ekim'de 0 görüntülenme: sahip tamamlasın ya da kapatsın).

Ölçüm: RUNBOOK §5 ile aynı pencere (Shop Manager > Stats, 30 gün, "Etsy Search"); 2026-10-21
tabanı 215 arama ziyareti / 12 sipariş / %0,8 dönüşüm. Başlık (10-22) ve tag (11-02) geçişleri aynı
paketin parçası sayılır; ayrı ayrı atfedilmez.

## Durum
(uygulama sonrası doldurulur)
