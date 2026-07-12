# Jade Gold NYC — Veri Denetimi Raporu

**Tarih:** 12 Temmuz 2026
**Kapsam:** Yönetim paneli (ana panel + Satışlar modülü) KPI'larının kod formülleri ve ham veritabanı (Supabase) ile mutabakatı; Etsy ledger / ShipStation kaynaklarıyla çapraz doğrulama.
**Yöntem:** (1) Kod denetçileri formül+varsayım haritası çıkardı, (2) veri denetçileri aynı formülleri ham SQL ile yeniden hesapladı, (3) baş denetçi konsolidasyonu.

---

## 1. YÖNETİCİ ÖZETİ

**Trafik ışığı: Ciro/işlem KPI'ları SARI — Kâr ve marj KIRMIZI.**

Panelin gösterdiği rakamlar veritabanındaki veriyle **%100 uyumlu** (7 ana KPI'nın tamamında yeniden hesap sapması %0,00; mükerrer kayıt yok, para birimi tek tip USD, fee kolonları Etsy ledger'ıyla kuruşu kuruşuna mutabık). Sorun panelin hesap yapması değil, **veritabanının Etsy gerçeğini eksik temsil etmesi**: Etsy sync her siparişi "completed" yazdığı için 1.866 iade ($669.472 net, cironun ~%22'si) hiçbir KPI'dan düşülmüyor; brüt ciro ayrıca Etsy'nin tahsil edip devlete devrettiği $193.649 alıcı vergisini içeriyor. Maliyet tarafında durum daha ağır: satılan kalemlerin %39'unun hiçbir kaynakta gramajı yok, ayrıca gramajı/ayarı **çözülebilir** 3.625 kalemin maliyeti hiç yazılmamış (~$556.875 kesin eksik COGS). Sonuç: **ciro yönlü KPI'lar (~%22-28 şişkinlik payıyla) düzeltme katsayısı bilinerek kullanılabilir; kâr ve marj rakamı şu haliyle karar için güvenilir DEĞİLDİR** — gerçek kâr, panelde görünenden tahminen **$1,2M–$2,2M daha düşük** olabilir.

---

## 2. KPI GÜVEN TABLOSU

| KPI | Kaynak | Formül | Panel ↔ DB sapma | Gerçeğe göre hata payı | Güven |
|---|---|---|---|---|---|
| **Ciro (brüt)** — $3.036.379 | `sales.grand_total_cents` (Etsy sync + CSV) | `SUM(grand_total)`, iptal-dışlama no-op (`canceled` yazım hatası) | %0,00 | **+$669K iade + $194K vergi → ~%28 şişkin** (üst yön) | **DÜŞÜK** |
| **Net (kesinti sonrası)** — $2.864.103 | Ciro − `etsy_fees_cents` | `gross − fees` | %0,00 | +iade/vergi (yuk.) **+$62K ödeme işleme ücreti hariç**; CSV kaynaklı satışlarda fee eksik toplanır | **DÜŞÜK** |
| **Etsy Kesintisi** — $172.276 (%5,7 hesaplanmış, sabit değil) | `etsy_ledger_entries` → `rebuild_sales_etsy_fees` | transaction + offsite_ads fee'leri sipariş bazında | %0,00 (ledger ile birebir) | Kapsam bilinçli kısmi: ödeme işleme (−$62K net), reklam/listing (~$230K) sipariş bazına dağıtılmaz; fee iadeleri (+$46K) netlenmemiş; 763 satışta fee=0 | **ORTA** (ölçtüğü şey doğru, kapsamı dar) |
| **Sipariş** — 10.815 | `sales` count | `COUNT(*)` iptal hariç (no-op) | %0,00 | ~1.866 iade edilmiş sipariş "geçerli" sayılıyor (~%17) | **ORTA** |
| **Alıcı** — 9.619 | `COALESCE(buyer_email, buyer_name)` | `COUNT(DISTINCT ...)` | %0,00 | buyer_email **%100 NULL** → tamamen isim bazlı; aynı isim birleşir, yazım farkı çoğaltır (±%5-10 tahmini) | **ORTA** |
| **Altın Maliyeti** — $1.140.208 (gold_auto) | `costs` (gold_auto) ← gramaj×ayar fiyatı | SKU→varyant→gramaj, 14K $101/g · 10K $65/g | — | Kapsam cironun yalnız %39,7'si; **$557K hesaplanabilir maliyet yazılmamış** + gramajsız kalemlerde $0,5–1,0M ek eksik olası; dolu gramajların yalnız %11'i tartım (ShipStation) kaynaklı | **DÜŞÜK** |
| **Kâr / Marj** | Ciro − Σcosts (dashboard.ts) | `revenue − cost`, `profit/revenue` | formül sadık | Pay şişkin (iade+vergi), payda eksik (COGS) → **kâr $1,2M–$2,2M abartılı olabilir**; ayrıca dashboard.ts limit'siz sorgu (PostgREST satır tavanı riski, 10.815 satırda gerçek) ve ay-başı maliyet tarih kayması | **DÜŞÜK** |

Ek: "En çok satan ürünler" kartı indirim **öncesi** `line_total` kullanır (toplamda 2x şişkin, kalıcı ~%50 indirim kampanyası nedeniyle) ve `.limit(2000)` ile 11.339 kalemin ~%82'sini geniş dönemde hiç görmez.

---

## 3. HAYALET KÂR RİSKİ

Panel kârı, gelirin şişkinliği + maliyetin eksikliği nedeniyle aşağıdaki kalemler kadar "hayalet kâr" içerir:

| Kalem | Nitelik | Tutar ($) |
|---|---|---|
| İadeler cirodan düşülmüyor (1.866 iade, ledger REFUND_GROSS net) | **Kesin**, ölçüldü | **+669.472** gelir şişmesi |
| Alıcı vergisi ciroda (Etsy tahsil edip devreder, satıcıya geçmez) | **Kesin**, ölçüldü | **+193.649** gelir şişmesi |
| Hesaplanabilir ama yazılmamış altın maliyeti (3.625 kalem, tüm yıllara yayılmış — rebuild hiç geriye dönük koşmamış) | **Kesin**, ölçüldü | **+556.875** eksik COGS |
| Gramajsız 4.422 kalem ($2,05M liste / ~$1,02M tahsil edilen ciro) — maliyet yapısal olarak $0 | Tahmin (maliyetlenebilir segmentin ~%48 maliyet/ciro oranı uygulanırsa) | **+500.000 – 1.000.000** eksik COGS |
| Ödeme işleme ücreti "Net" kartında yok | Kesin, ölçüldü | +62.258 |
| **TOPLAM hayalet kâr aralığı** | | **≈ $1,2M – $2,2M** |

**Inferred gramajların katkısı (ayrı satır):** 73 varyant (dolu gramajların %4,7'si) "inferred" kaynaklı; hacim küçük olduğundan katkısı **±$20K–60K belirsizlik** bandındadır — asıl risk inferred değil, %84'ü "description" (ilan metninden regex) kaynaklı gramajların tartım doğrulamasının olmamasıdır.

---

## 4. VARSAYIM KAYDI

| # | Dosya | Varsayım / Kusur | Yön | Önem |
|---|---|---|---|---|
| 1 | `supabase/migrations/0048_sales_analytics.sql:24` | İptal dışlama `'canceled'` (tek L) yazılmış; şema `'cancelled'` — filtre no-op, UI metni ("iptaller hariç") yanlış beyan | kâr şişirir | Yüksek (bugün $0, latent) |
| 2 | `lib/etsy/sync.ts:402` | Her sipariş `status='completed'` hardcode; Etsy `receipt.status` hiç okunmaz → iptal/iade DB'ye asla yansımaz | kâr şişirir | **Yüksek ($669K)** |
| 3 | `lib/db/queries/dashboard.ts:57` | `refunded` hiçbir ciro hesabında dışlanmaz; iade tutarı ledger'da da bilerek maliyet dışı → iade P&L'e hiç girmez | kâr şişirir | **Yüksek** |
| 4 | `lib/db/queries/dashboard.ts` | Limit'siz select + JS toplama; PostgREST satır tavanı (10.815 satırda gerçek risk) → "Tüm zamanlar" sessizce kırpılabilir | kâr düşürür | Yüksek (doğrulanmalı) |
| 5 | `lib/etsy/sync.ts:395` | Brüt ciro kargo+alıcı vergisi dahil (`grandtotal`); vergi satıcıya geçmez | kâr şişirir | Orta ($194K) |
| 6 | `0040_sales_etsy_fees_from_ledger.sql` | Ödeme işleme + listing/reklam ücretleri sipariş bazlı "Net"e dahil değil (bilinçli tasarım, ama Satışlar sayfasında not yok) | kâr şişirir | Orta ($62K + dağıtılmamış ~$230K) |
| 7 | `lib/csv/mappers/etsy-sold-orders.ts:58` | `pick()` ilk dolu fee kolonunu alır — Card Processing + Transaction Fees TOPLANMAZ (kardeş mapper doğru toplar) | kâr şişirir | Orta |
| 8 | `lib/money.ts` / `lib/etsy/types.ts:106` | Parse edilemeyen para = sessizce 0; fee'siz 763 satış mevcut | kâr şişirir | Orta |
| 9 | `0054_idempotent_cost_rebuilds.sql:101` | Ledger maliyetleri ay başı tarihiyle yazılır → "Son 7/30 gün" pencerelerinde maliyet eksik, trend grafiğinde ayın 1'inde spike | kâr şişirir | Orta |
| 10 | `app/(dashboard)/satislar/page.tsx:37` | Kur çevirimi yok, her şey USD formatlanır — veri bugün %100 USD olduğundan **etkisiz** | iki yönlü | Düşük (bugün) |
| 11 | `0048:39` | Alıcı = `COALESCE(email, name)`; email %100 NULL → isim bazlı yaklaşık sayım | iki yönlü | Düşük (parasal etki yok) |
| 12 | `lib/db/queries/dashboard.ts:150` | Top ürünler indirim öncesi `line_total` + `.limit(2000)` → 2x şişkin ve eksik liste | yanıltıcı gösterim | Orta |
| 13 | data-gaps RPC | `count_actionable_unlinked_items` `pv.product_id IS NOT NULL` şartıyla 0 döner; gerçekte 4.700 bağlantısız kalem (%41,5) var — panel boşluğu gizler | görünürlük | Yüksek |
| 14 | `lib/gold-cost-entry.ts` | Gramaj kaynağı hiyerarşisi: %84 description-regex, %11 tartım, %5 inferred; "manual" hiç kullanılmamış | iki yönlü | Orta |

---

## 5. YÖNLENDİRME KARARI

**Panel şu haliyle "işletme nabzı" için kullanılabilir, kâr/fiyatlama kararları için kullanılamaz.**

**EVET — bu kararlar için bugün kullanılabilir:**
- Sipariş hacmi trendi, sezonluk yoğunluk, kampanya dönemi karşılaştırması (hepsi aynı yönde şişkin olduğundan **göreli** kıyas geçerli)
- Etsy kesinti oranı takibi (ledger'la birebir mutabık)
- Operasyonel takip: sipariş listesi, CSV import mutabakatı, mükerrer kontrolü

**HAYIR — önce düzeltme gerektiren kararlar:**
- **Kârlılık / fiyat artışı / ürün karlılığı:** COGS kapsamı %40'ta, iadeler görünmez → 1., 2. ve 4. aksiyon tamamlanmadan karar verilmemeli
- **Ürün portföy kararı (hangi ürün kazandırıyor):** kalemlerin %41,5'i ürünsüz + top-ürün kartı indirim öncesi → 3. aksiyon şart
- **Vergi/muhasebe raporlaması:** brüt, devredilen vergiyi içeriyor — muhasebeye bu ciro rakamı verilmemeli
- **Alıcı/sadakat analizi:** email boş, isim bazlı sayım yaklaşıktır

---

## 6. DÜZELTME SIRASI (etki / emek)

| # | Aksiyon | Etki | Emek |
|---|---|---|---|
| 1 | **İadeleri yansıt:** sync'te `receipt.status` oku; geriye dönük olarak ledger REFUND kayıtlarından ilgili satışları `refunded` işaretle ve tüm ciro formüllerinde dışla | **$669K** ciro düzeltmesi | Orta |
| 2 | **`rebuild_gold_costs`'u geriye dönük çalıştır** (RPC mevcut, sadece koşmamış) — 3.625 çözülebilir kalemin maliyeti yazılır | **$557K** COGS, kâr gerçekçileşir | **Düşük** |
| 3 | **1.371 ürünsüz varyanta product_id ata** (4.416 kalem otomatik bağlanır) + data-gaps RPC'deki `pv.product_id IS NOT NULL` şartını kaldır ki boşluk görünür olsun | Ürün bazlı analiz kapsamı %58,5 → ~%97 | Düşük-Orta |
| 4 | **Gramaj tamamlama programı:** en çok satan gramajsız SKU'lardan başlayarak ShipStation tartım / manuel giriş (4.422 kalem, ciro payına göre önceliklendirilmiş) | $0,5–1,0M eksik COGS kapanır | Yüksek (kademeli) |
| 5 | **Küçük kod düzeltmeleri paketi:** (a) `'canceled'`→`'cancelled'` typo, (b) dashboard.ts'i limit'siz JS toplamadan RPC'ye taşı, (c) sold-orders CSV mapper'ında iki fee kolonunu topla, (d) vergiyi ciro kartından ayır / ayrı göster, (e) Satışlar "Net" kartına "ödeme işleme hariç" notu | Latent hataları kapatır, beyan doğruluğu | Düşük |

---

*Denetim izi: kod formül haritası + ham SQL yeniden hesapları; tüm panel↔DB mutabakatları %0,00 sapma ile doğrulanmıştır. Bu rapor `docs/veri-denetimi-raporu.md` olarak şirket hafızasına eklenmiştir.*
