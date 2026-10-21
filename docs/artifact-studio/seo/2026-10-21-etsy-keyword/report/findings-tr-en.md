# byArtifactStudio Etsy Keyword Diagnosis, 21 October 2026

## TR

### Durum

byArtifactStudio mağazası son 30 günde (22 Eylül ile 21 Ekim 2026 arası) 518 ziyaret, 850 ürün görüntülemesi, 1 sipariş (830,47 USD) ve yüzde 0,2 dönüşüm aldı. Mağazanın 210 aktif ve 16 taslak ürünü var, ortalama fiyat 734 USD, en düşük 316 USD, en yüksek 2.087 USD. Bu ziyaretlerin yalnızca 12'si Etsy aramasından geldi, yani toplamın yüzde 2,3'ü. 114 ziyaret ücretli Etsy Ads, 175 ziyaret Etsy'nin kendi pazarlama ve SEO kanalları, 116 ziyaret Etsy uygulaması ve sayfaları, 63 ziyaret doğrudan ve yönlendirme, 13 ziyaret sosyal medya. Mağaza gösteriliyor ama aranmıyor. Etsy arama raporundaki 12 terim birer ziyaretle geldi ve dördü ürünle ilgisiz ("katze kleidung", "cute but psycho tshirt", "chevron diamond necklace canadian seller", "unique earrings gold plated"). İlgili olanlar bile tek seferlik: "solid gold bracelet", "men figaro bracelet", "red enamel ring", "10k earrings", "14k gold christmas jewelry", "domino pendant necklace gold".

### Teşhis

Sorun fiyat değil, listeleme kalitesi. 2.730 etiketin 1.378'i (yüzde 50) kelime salatası: içinde ürün adı geçmeyen sıfat yığınları ("handcrafted everyday", "gift tube him luxury", "sophisticated luxury", "minimalist statement"). 122 ürün SALAD, 21 ürün MIXED, 67 ürün OK sınıfında. SALAD ürünler 850 görüntülemenin 639'unu aldı ama bunu reklam sayesinde aldı; organik aramada görünmediler. 94 ürün 30 günde sıfır görüntüleme aldı. 36 üründe hiç özellik (attribute) doldurulmamış, 52 üründe dörtten az özellik var; Etsy bu ürünleri malzeme, karat, renk ve alıcı filtrelerinde gösteremiyor. 20 ürün "No Section" altında, 110 üründe video yok. Videolu 100 ürün görüntülemelerin yüzde 57'sini aldı (487 / 850). Bir ürün yanlış kategoride: mor mine düğme yüzük (4585880226) Stud Earrings altında. Tek sipariş olan 830 USD'lik dövme alyans, tam da etiketleri düzgün olan MIXED sınıfı bir üründü.

### Anahtar kelime kanıtı

Üç kaynak kullanıldı: mağazanın kendi Etsy arama terimleri (çok ince ama gerçek), eRank Bulk Keyword Tool (tutucu Etsy hacimleri, baş terimleri sıralamak için) ve Alura (20 tohum, 4.153 benzer kelime, genişlik için; mutlak hacimleri şişkin, KD ve skor göreli olarak güvenilir). Öne çıkanlar: "evil eye anklet" eRank'te aylık 1.195 arama ve yalnızca 1.231 rakip ürün (KD 1), katalogdaki en büyük boşluk. "evil eye bracelet" 2.146 arama, KD 57. "evil eye ring" 1.432 arama, 8.531 rakip, KD 39. "signet ring" 4.899 arama, KD 39; "gold signet ring" 1.511, KD 53; "mens signet ring" 1.533, KD 54. "gold pinky ring" 1.201 arama, KD 45. "snowflake necklace" 1.174 arama, KD 43. "solid gold bracelet" 2.284 arama, KD 59, 34.856 rakip; Alura'da KD 42 ve skor 75. "gold anklet" 1.239 arama, KD 58; Alura'da "solid gold anklet" KD 17. "14k mens bracelet" Alura'da KD 29, "gold enamel ring" KD 34 ve skor 81, "14k enamel ring" KD 14. Kaçınılacaklar: "christmas jewelry" (1,47 milyon rakip, KD 100), "gift for her" (5,4 milyon rakip), "minimalist jewelry" (1,06 milyon rakip), "mens gold bracelet" tek başına (73.709 rakip, KD 100).

### Karar: başlık ve etiket deseni

Her koleksiyon için birincil anahtar kelime başlığın ilk 40 karakterinde. Nazar koleksiyonunda "Evil Eye Bracelet in Solid Gold, ...", halhallarda "Solid Gold Lemon Anklet, Yellow Enamel Lemon Charm, 10K 14K 18K Ankle Bracelet, Summer Gift for Her", Noel koleksiyonunda motif önde ("Snowflake Necklace, Solid Gold Christmas Pendant, ..."), erkek ürünlerinde "Mens Figaro Bracelet, Solid Gold 2.5mm Chain, 10K 14K 18K Bracelet for Men, Gift for Him", kadın ürünlerinde "Solid Gold Bracelet, ...", "Gold Enamel Ring, ...", "Gold Signet Ring, ...", "Gold Huggie Earrings, ...". 13 etiket: 3 baş terim, 1 ila 2 karat veya malzeme, 4 stil (2'si ürüne özgü motif), 2 ölçü veya renk, 2 vesile, kişiselleştirme varsa kazıma etiketi. 210 ürünün tamamı için yeni başlık ve 13 etiket `data/optimization-matrix.csv` dosyasında; doğrulama sonucu 0 kural ihlali, 0 ortak etiket seti.

### Sıradaki iş

Claude Code, `CLAUDE.md` içindeki döngüyle (validate, plan, apply dry run, apply --yes 20'lik partiler, verify, status) başlık, etiket ve bölümleri Etsy Open API üzerinden uygular. Önce 20 ürünlük ilk parti onaya gelir: erkek zincir bilezikler, iki manşet, mavi taşlı nazar bilezik, dövme alyans ve erkek küpeler; bunlar zaten görüntüleme alan ama etiketleri çöpe giden ürünler. Senin elinde kalanlar: 36 üründe özellik doldurma (14 halhal, 13 Noel, 6 nazar, 3 erkek), 1 kategori düzeltme, 110 ürün için kısa video, açıklamaların ilk 160 karakteri. Etsy Ads 30 günde 114 ziyaret ve 0 sipariş getirdi; ilk 100 ürün uygulandıktan sonra bütçeyi erkek zincirleri, nazar bilezik ve mühür yüzüklere kaydır.

### Ölçüm

Baz çizgi: 518 ziyaret, Etsy Search 12 ziyaret (yüzde 2,3), 1 sipariş, 94 sıfır görüntülemeli ürün, 12 arama terimi. 30 gün hedefi (21 Kasım 2026): Etsy Search en az 80 ziyaret (yüzde 15), en az 60 farklı arama terimi, sıfır görüntülemeli ürün en fazla 40, en az 2 sipariş. 60 gün hedefi (21 Aralık 2026): Etsy Search ziyaretlerin yüzde 25'i, en az 5 sipariş, dönüşüm yüzde 0,8, tüm nazar ürünlerinde tam özellik ve video.

## EN

### Situation

In the last 30 days (22 September to 21 October 2026) byArtifactStudio had 518 visits, 850 listing views, 1 order ($830.47) and a 0.2% conversion rate across 210 active listings (plus 16 drafts), average price $734, range $316 to $2,087. Only 12 of those visits came from Etsy Search, 2.3% of the total. 114 visits were paid Etsy Ads, 175 came from Etsy's own marketing and SEO channels, 116 from the Etsy app and pages, 63 from direct and referral, 13 from social. The shop is being shown, not found. The 12 search terms in the Etsy Search report each brought a single visit and four are unrelated to the catalog ("katze kleidung", "cute but psycho tshirt", "chevron diamond necklace canadian seller", "unique earrings gold plated"). The relevant ones are one offs too: "solid gold bracelet", "men figaro bracelet", "red enamel ring", "10k earrings", "14k gold christmas jewelry", "domino pendant necklace gold".

### Diagnosis

Price is not the blocker, listing quality is. 1,378 of the 2,730 tags (50%) are word salad: adjective bags with no product noun ("handcrafted everyday", "gift tube him luxury", "sophisticated luxury", "minimalist statement"). 122 listings are SALAD class, 21 MIXED, 67 OK. SALAD listings took 639 of the 850 views, but through ads, not search. 94 listings had zero views in 30 days. 36 listings have no attributes filled and 52 have fewer than four, so Etsy cannot surface them in material, karat, colour and recipient filters. 20 listings sit in "No Section" and 110 have no video; the 100 listings with video took 57% of all views (487 of 850). One listing is in the wrong category: the purple enamel button ring (4585880226) is filed under Stud Earrings. The only order, the $830 hammered wedding band, is one of the few listings whose tags already name the product.

### Keyword evidence

Three sources were used: the shop's own Etsy search terms (thin but real), eRank Bulk Keyword Tool (conservative Etsy volumes, used to rank head terms) and Alura (20 seeds, 4,153 similar keywords, used for breadth; absolute volumes are inflated, KD and score are useful relatively). Highlights: "evil eye anklet" shows 1,195 monthly searches on eRank against only 1,231 competing listings (KD 1), the largest gap in the catalog. "evil eye bracelet" 2,146 searches, KD 57. "evil eye ring" 1,432 searches, 8,531 competitors, KD 39. "signet ring" 4,899 searches, KD 39; "gold signet ring" 1,511, KD 53; "mens signet ring" 1,533, KD 54. "gold pinky ring" 1,201 searches, KD 45. "snowflake necklace" 1,174 searches, KD 43. "solid gold bracelet" 2,284 searches, KD 59, 34,856 competitors; on Alura KD 42 and score 75. "gold anklet" 1,239 searches, KD 58; "solid gold anklet" KD 17 on Alura. "14k mens bracelet" KD 29 on Alura, "gold enamel ring" KD 34 with score 81, "14k enamel ring" KD 14. Terms to avoid as leads: "christmas jewelry" (1.47M competing listings, KD 100), "gift for her" (5.4M), "minimalist jewelry" (1.06M), "mens gold bracelet" on its own (73,709 competitors, KD 100).

### Decision: title and tag pattern

The primary keyword sits in the first 40 characters of every title. Evil eye pieces lead with "Evil Eye Bracelet in Solid Gold, ...", anklets with "Solid Gold Lemon Anklet, Yellow Enamel Lemon Charm, 10K 14K 18K Ankle Bracelet, Summer Gift for Her", Christmas pieces with the motif ("Snowflake Necklace, Solid Gold Christmas Pendant, ..."), men's pieces with "Mens Figaro Bracelet, Solid Gold 2.5mm Chain, 10K 14K 18K Bracelet for Men, Gift for Him", women's pieces with "Solid Gold Bracelet, ...", "Gold Enamel Ring, ...", "Gold Signet Ring, ...", "Gold Huggie Earrings, ...". 13 tags: 3 head terms, 1 to 2 karat or material tags, 4 style tags of which 2 are design specific, 2 size or colour tags, 2 occasion tags, plus an engraving tag when the listing is personalizable. New titles and tags for all 210 listings are in `data/optimization-matrix.csv`; validation ends with 0 rule violations and 0 shared tag sets.

### What happens next

Claude Code applies titles, tags and sections through the Etsy Open API using the loop in `CLAUDE.md` (validate, plan, apply dry run, apply --yes in batches of 20, verify, status). The first batch of 20 comes to you for approval: the men's chain bracelets, both cuffs, the blue stone evil eye bracelet, the hammered wedding band and the men's studs, the listings that already get views and waste them on salad tags. Your manual tasks: attributes on 36 listings (14 anklets, 13 Christmas, 6 evil eye, 3 men's), 1 category fix, short videos for 110 listings, the first 160 characters of each description. Etsy Ads brought 114 visits and 0 orders in 30 days; once the first 100 listings are applied, move the budget to the men's chains, the evil eye bracelet and the signet rings.

### Measurement

Baseline: 518 visits, Etsy Search 12 visits (2.3%), 1 order, 94 zero view listings, 12 search terms. 30 day target (21 November 2026): Etsy Search at least 80 visits (15%), at least 60 distinct search terms, zero view listings at most 40, at least 2 orders. 60 day target (21 December 2026): Etsy Search 25% of visits, at least 5 orders, 0.8% conversion, full attributes and video on every evil eye listing.
