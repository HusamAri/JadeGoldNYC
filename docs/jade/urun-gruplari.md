# Anlam bölümleri — tanım, kapsam, canlı durum

Katalog ürün tipiyle değil **alıcının aradığı anlamla** bölünür. İnsanlar altını
her zaman aynı dört şey için taktı: korunmak, inanmak, sevmek, iz bırakmak.
Geri kalan katalog (sembolik olmayan zincir/küpe/yüzük) biçim kovalarına düşer.

Motor: `lib/collections/chapters.ts` (saf, istemci-güvenli) — SQL karşılığı
`public.derive_chapter()` (migration 0138). İkisi **birebir aynı sıra ve desen**
taşır; biri değişirse diğeri de değişmeli.

## Canlı dağılım (2026-08-13, org Jade Gold, 121 listing)

| # | Bölüm | Etsy Section | Listing | Aktif | Görüntülenme | Favori |
|---|-------|--------------|--------:|------:|-------------:|-------:|
| — | Günlük Zincirler | Everyday Chains | 29 | 29 | 584.995 | 11.349 |
| 4 | Miras & Statü | Legacy & Statement | 29 | 26 | 543.645 | 6.898 |
| 2 | İnanç & Adanmışlık | Faith & Devotion | 19 | 17 | 144.132 | 2.411 |
| 1 | Koruma & Şans | Protection & Luck | 17 | 17 | 180.436 | 6.862 |
| — | Küpeler | Earrings & Hoops | 11 | 11 | 162.223 | 4.027 |
| 3 | Sevgi & Anlam | Love & Meaning | 11 | 11 | 162.143 | 4.356 |
| — | Yüzükler | Rings | 5 | 5 | 211.986 | 3.735 |

Kapsama **%100** — sınıflanmamış listing yok (kural dışı kalan "chains"
varsayılanına düşer). Aktif sayılar 2026-08-06 kill/keep denetimiyle birebir
tutuyor (`docs/listing-audit/2026-08-jade-gold-chapters-kill-keep.md`).

## Bölümler

### 1 · Koruma & Şans (protection)
Nazar, hamsa, cornicello (İtalyan boynuzu), fil, firavun, aslan/kartal — koruma
ve şans sembolleri. **Mağazanın motoru burada:** 14K Evil Eye Pendant tek başına
1.466 satış (ömür-boyu birimlerin ~%24'ü), $51.60 ile katalogun en ucuz girişi.
Favori oranı en yüksek bölümlerden (17 listing, 6.862 favori).

### 2 · İnanç & Adanmışlık (faith)
İsa, haç/crucifix, rosary, Last Supper, aziz, melek, madalyon. **En zayıf verim:**
19 listing, 144K görüntülenme, ~115 satış. Trafik lideri 10K Last Supper Pendant
(38K görüntülenme, 25 satış). Kill yoğunluğu burada yüksek.

### 3 · Sevgi & Anlam (love)
Kalp, teddy bear, kelebek — hediye/sevgi anlamı. Kalp nugget güçlü satıyor;
pahalı puffed/chunky hoop'lar ölü stok (kill listesinin büyük kısmı buradan).

### 4 · Miras & Statü (legacy)
Miami cuban, franco, mariner/anchor, curb, iced-out — ağır statü parçaları.
İkinci en büyük bölüm ve en büyük çelişki: 101K görüntülenmeli 14K Miami Cuban
Curb'ün dönüşümü ‰0,4. Trafik var, dönüşüm yok → fiyat/foto/SEO işi.

### — Günlük Zincirler (chains)
Rope, box, figaro, valentino, paperclip, herringbone, bead ball. En çok listing
ve en çok trafik. Rope/box günlük satıcılar sağlam.

### — Küpeler (earrings)
Hoop, huggie, stud. Hoop'lar istikrarlı; birkaç bayat listing var.

### — Yüzükler (rings)
Nugget, statement, alyans. **Listing başına en yüksek trafik:** 5 listing,
212K görüntülenme — 10K Nugget Ring tek başına 291 satış / 167K görüntülenme.

## Etsy vitrin bölümleri ≠ anlam bölümleri

Mağazada **14 canlı Etsy section** var ve taksonomisi **biçim-temelli**:

| Etsy Section | Aktif listing |
|---|---:|
| Pendants & Charms | 27 |
| Necklaces & Chains | 25 |
| Bracelets | 21 |
| Earrings | 20 |
| Cuban Link | 13 |
| Rings | 10 |
| GOLD BANGLES · GOLD SET · DIAMOND EARRINGS · Fine Silver · Fine Gold · SILVER CHAIN · CUSTOM ORDER · DIAMOND RING | **0** (8 bölüm) |

**İki eksen birbirine dik ve ikisi de gerekli:**
- **Etsy section** = alıcının vitrinde gördüğü yerleşim (canlı, biçim ekseni).
  Panel bunu `products.etsy_section_id` ile aynalar; **senkron yazar**.
- **Anlam bölümü (chapter)** = hikâye ekseni, iç çalışma birimi. Panel alanıdır,
  senkron dokunmaz.

Bir listing hem "Pendants & Charms" vitrininde durur hem "Koruma & Şans"
hikâyesini anlatır. Bu yüzden `CHAPTERS[].section` alanındaki İngilizce adlar
(Protection & Luck vb.) **öneridir, canlı karşılığı yoktur** — Etsy'de böyle
bir section yok. Vitrin değişikliği canlı yazımdır ve ayrı onay ister.

**Açık iş:** 8 boş section vitrinde yarım bir mağaza gösteriyor; doldurulacak
mı kaldırılacak mı kararı verilmeli (Etsy tarafında elle).

## Sınıflandırma kuralları

**Anlam biçimden önce gelir.** Sıra kritiktir: "Last Supper Ring" biçim olarak
yüzüktür ama bölümü **inanç**tır; "Cornicello Miami Cuban Necklace" hem koruma
hem cuban içerir → **koruma** kazanır. İlk eşleşen kural kazanır.

**Kelime sınırı zorunlu.** Sınırsız `ring` deseni her**ring**bone ve ste**rling**
içinde eşleşir — tüm zincirler yüzük olurdu. TS'te `\b`, Postgres'te `\m…\M`.

**Elle sabitleme.** Panelden bölüm değiştirildiğinde `chapter_locked = true`
olur ve otomatik yeniden sınıflama o satıra dokunmaz. Motorun kararsız kaldığı
parçalar (ör. "Lion & Eagle Pendant" — koruma mı statü mü) böyle çözülür.

**Yeni listing.** Etsy senkronu `chapter` yazmaz (panel alanıdır), yani yeni
listing NULL gelir. `/tasarimlar/bolumler` → «Yeniden sınıfla» boşluğu kapatır;
pano sınıflanmamışları ayrıca listeler ki sessizce atlanmasınlar.
