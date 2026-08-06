# Jade Gold NYC — Anlam Bölümleri (Chapters) + Kill/Keep Denetimi

**Tarih:** 2026-08-06 · **Kaynak:** canlı Supabase (`products` + `sale_items`/`sales`, iptal/iade hariç ömür-boyu satış) · **Kapsam:** 116 aktif listing.
**Sınıflandırma motoru:** `lib/collections/chapters.ts` (anlam-öncelikli, kelime-sınırı doğru; 18/18 spot-check).

Gruplama Drive marka bölüm sistemiyle hizalı: `JG_CH1_PROTECTION`, `JG_CH2_FAITH`, `JG_CH4_LEGACY` görselleri. CH3 tanımsızdı → **LOVE (Sevgi & Anlam)** olarak önerildi. Sembolik olmayan katalog biçimlerine göre bölündü (Zincirler / Küpeler / Yüzükler).

---

## 1) Bölüm dağılımı ve performansı

| # | Bölüm | Listing | Ömür satış | Görüntülenme | Not |
|---|-------|--------:|-----------:|-------------:|-----|
| 1 | **Koruma & Şans** (Protection) | 17 | **2.069** | 180K | En yüksek satış hacmi — nazar motoru. Ucuz + yüksek dönüşüm. |
| — | Yüzükler (Rings) | ~4 | 1.303* | 545K | Nugget yüzük tek başına dev (291 satış, 167K görüntülenme). |
| 4 | **Miras & Statü** (Legacy) | 26 | 827 | 544K | Franco/cuban satıyor; ama pahalı iced-out ölü stok burada. |
| — | Günlük Zincirler (Chains) | ~22 | 823 | 252K | Rope/box/figaro sağlam günlük satıcılar. |
| — | Küpeler (Earrings) | 9 | 533 | 161K | Hoop'lar istikrarlı; birkaç bayat. |
| 3 | **Sevgi & Anlam** (Love) | 13 | 353 | 163K | Kalp nugget güçlü; pahalı puffed hoop'lar ölü. |
| 2 | **İnanç & Adanmışlık** (Faith) | 17 | **115** | 144K | **17 listing / yalnız 115 satış** — en zayıf verim; kill yoğun. |

\* Yüzük/Zincir sayıları kelime-sınırı düzeltmesiyle (herringbone/sterling ≠ ring) kod motorunda kesinleşir; tablo yön gösterir.

**Ana bulgu:** Ciro ucuz + sembolik + günlük parçalardan geliyor. Pahalı "iced-out / chunky / CZ statement" envanteri görüntülenme alıyor ama satmıyor — sermaye ve katalog dikkati orada kilitli.

---

## 2) KILL — kapat/pasifle (25 listing)

Ölçüt: ömür-boyu ≤2–3 satış **ve** (hiç satmamış **veya** son satış >12 ay) — genelde yüksek fiyatlı ölü stok. Bunlar sayfada yer, reklam bütçesi ve foto/SEO emeği hak etmiyor.

| Listing | Fiyat | Ömür satış | Son satış | Bölüm |
|---------|------:|-----------:|-----------|-------|
| 14K Yellow Gold Miami Cuban – CZ Box Lock | $2.214 | 0 | hiç | Legacy |
| 14K Yellow Gold Chunky Twisted Hoop Earrings | $2.473 | 0 | hiç | Love |
| 14K Yellow Gold Puffed Hoop Earrings (Chunky) | $1.613 | 0 | hiç | Love |
| 14K White Gold Ice Out Chain | $1.462 | 0 | hiç | Legacy |
| 14K Solid Gold Paperclip Necklace – Dainty | $1.509 | 0 | hiç | Chains |
| Chunky 14K Yellow Gold Rope Bracelet | $1.393 | 0 | hiç | Chains |
| 14K Gold Necklace, Solid White Bead Ball Chain | $813 | 0 | hiç (2 görüntülenme) | Chains |
| Chunky 10K Gold Rope Bracelet | $730 | 0 | hiç | Chains |
| 14K Gold Two-Tone Pave Curb Cuban Bracelet | $522 | 0 | hiç | Legacy |
| 14K Solid Yellow Gold Rolo Bracelet – Dainty | $525 | 0 | hiç | Chains |
| Gold Jesus Pendant 14K Tri-Color Rope | $528 | 0 | hiç | Faith |
| 10K Gold Lion & Eagle Pendant | $423 | 0 | hiç | Faith/Protection |
| 14K White Gold Rolo Link Bracelet | $413 | 0 | hiç | Chains |
| 10K White Gold Rope Bracelet | $406 | 0 | hiç | Chains |
| 10K Gold Hamsa Pendant Necklace | $226 | 0 | hiç | Protection |
| 10K Gold Miami Cuban – CZ Box Lock | $2.879 | 3 | 469 gün | Legacy |
| 14K Gold Miami Cuban – Shiny CZ Box | $1.742 | 2 | 391 gün | Legacy |
| 14K Solid Gold Ice Out Chain | $1.462 | 3 | 363 gün | Legacy |
| 14K Yellow Gold Puffed Heart Hoop Earrings | $1.011 | 2 | 672 gün | Love |
| 10K Gold Teddy Bear Bracelet | $722 | 2 | 620 gün | Love |
| 10K Solid Gold Jesus Pendant Two-Tone | $671 | 2 | 417 gün | Faith |
| 14K Gold Puffed Hoop Earrings | $538 | 1 | 551 gün | Love |
| 14K Solid Gold Butterfly Charm CZ | $525 | 1 | 1.050 gün | Love |
| 14K Gold CZ Hoop Huggie Evil Eye Earrings | $258 | 2 | 677 gün | Protection |
| 14K Yellow Gold Paperclip Chain Necklace | $2.090 | 1 | 365 gün | Chains |

**Desen:** 25'in ~20'si $500+ ve "iced-out / chunky / puffed / CZ" statement parça. Fiyat + ağır tasarım + zayıf dönüşüm = ölü sermaye. Öneri: pasifle (silme değil — `products.etsy_deleted_at`/arşiv deseni geri-dönüş bırakır).

---

## 3) FIX — trafik var, dönüşüm yok (öncelikli düzeltme)

Yüksek görüntülenme ama düşük satış → fiyat/foto/SEO ile para masada. Kapatma; **düzelt**.

| Listing | Görüntülenme | Ömür satış | Sinyal |
|---------|-------------:|-----------:|--------|
| 14K Miami Cuban Link Chain \| Italian Curb | **101.130** | 36 | Dönüşüm 0,4‰ — dev trafik, berbat dönüşüm. Fiyat/foto acil. |
| 10K Gold Nugget Heart Pendant | 54.036 | 41 | Trafik yüksek, dönüşüm düşük (0,8‰). |
| 10K Solid Gold Bead Ball Chain Necklace | 41.029 | 40 | $604 — fiyat/pozisyon testi. |
| Solid 14K Miami Cuban Link Chain | 39.255 | 11 | 0,3‰ dönüşüm. |
| 10K Gold Last Supper Pendant | 38.128 | 25 | 399 gün bayat; Faith'in trafik lideri. |
| 10K Solid Yellow Gold Men's CZ Ring | 24.147 | 43 | Sağlam trafik, canlandır. |
| 10K Gold Puffed Mariner Anchor Necklace | 22.295 | 19 | $1.858 — fiyat ağır. |
| 14K Solid Gold Rosary Necklace | 21.520 | 10 | $1.277, 647 gün bayat. |
| 10K Gold Miami Cuban Bracelet (CZ Box) | 18.996 | 15 | Fiyat testi. |
| 10K Solid Gold Nugget Stud Earrings | 17.791 | 33 | 375 gün bayat — yeniden aktive. |

---

## 4) KEEP★ — koru & besle (yıldız satıcılar, örnekler)

Bunlara dokunma; stok + fiyat pozisyonunu izle, reklamı bunlara kaydır.

- **14K Gold Evil Eye Pendant** — 1.466 satış, 36 son-90g. Mağazanın motoru (Protection).
- **14K Rope Chain Bracelet / Rope Bracelet** — 317 / 306 satış.
- **10K Nugget Ring (Men's)** — 291 satış, 167K görüntülenme.
- **14K Cornicello Necklace** — 155 · **14K Box Chain Bracelet** — 165 · **10K Heart Nugget Ring** — 163.
- **14K Franco Chain** — 141 · **10K Miami Cuban Bracelet** — 126 · **14K Paperclip Bracelet** — 121.
- **10K Herringbone Necklace** — 100, son-90g aktif · **14K Rose Gold Box Chain** — 88, son-90g 14.

---

## 5) Aksiyon özeti

1. **KILL 25 listing** → pasifle (arşiv-önce, silme değil). Katalog dikkati + reklam bütçesi + sermaye serbest kalır.
2. **FIX 10 listing** → yüksek-trafik/düşük-dönüşüm; fiyat + foto + SEO (özellikle 101K görüntülenmeli Miami Cuban Curb).
3. **KEEP★** → reklamı bu yıldızlara ve Koruma bölümüne yoğunlaştır.
4. **Yeniden yapılandırma** → katalogu 7 anlam bölümüne göre grupla (panel görünümü + Etsy Shop Sections). Sınıflandırma motoru: `lib/collections/chapters.ts`.

**Sonraki adımlar (bu denetimden ayrı):** (a) Listeler sayfasına bölüm facet'i + bölüm-bazlı özet; (b) bölümlerin canlı **Etsy Shop Sections**'a yansıtılması — canlı yazım olduğu için ayrı onayla, önce Etsy yazma izni + read-back doğrulaması.
