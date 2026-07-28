# EON fiyat itişi — dry-run ön-izleme (2026-07-28)

> **Durum: ONAY BEKLİYOR — hiçbir fiyat değişmedi.** Bu ön-izleme, canlı fiyat
> modeli (katalog v3 üreticisi `docs/eon/gen_catalog_v3.py`, canlı DB ile daha
> önce birebir çapraz-doğrulanmış) ile yeni grid'in yerel karşılaştırmasıdır.
> Otoriter, varyant-düzeyi diff `scripts/eon-price-push-oneshot.ts` çalışınca
> canlı DB'den üretilir (aynı dosya adına yazar). Push, açık onay sonrası
> `--push` ile TEK SEFER uygulanır; script sonra emekliye ayrılır.

Kaynak grid: `2026-07-28-eon-etsy-giris-grid-spot4090-v2.xlsx` — spot $4.090,
çarpan 1,55, kalınlık 2.0mm standart, ETSY LISTE kolonu (442 hücre: 3 karat ×
11 genişlik × 13 tam beden + milgrain 14K/2mm 13 hücre).

## Özet

- Panel kapsamı: 39 aile × 275 varyant = **10.725** hücre (canlı Etsy alt-kümesi script'te çözülür).
- Yeni fiyatı olan: **4.329** (%40) — tamamı ARTIŞ; Δ min **+%50** · ort **+%70** · max **+%122**.
- GAP: **6.396** (%60) — aşağıda; varsayılan davranış: ATLA (canlı fiyat korunur).

Karat bazında (standart profiller):

| Segment | Hücre | Δ% min | Δ% ort | Δ% max |
|---|---|---|---|---|
| 10K standart | 1430 | +61.2 | +75.5 | +121.9 |
| 14K standart | 1287 | +50.2 | +59.4 | +88.5 |
| 18K standart | 1430 | +56.5 | +71.9 | +90.9 |
| YILDIZ GLD-R-1401 (14K dome, düşük ppg) | 143 | +75.2 | +85.4 | +117.8 |
| Milgrain (yalnız 14K × 2mm kapsanıyor) | 39 | +78.2 | +86.1 | +96.2 |

Örnek merdiven — 10K dome 4mm (GLD-R-1001):

| Beden | Eski | Yeni |
|---|---|---|
| 4 | $305 | $580 |
| 4.5 | $315 | **GAP** |
| 5 | $320 | $605 |
| 8 | $365 | $670 |
| 12 | $420 | $755 |
| 16 | $475 | $840 |

## GAP'ler — push öncesi karar gereken noktalar

1. **Yarım bedenler (5.148 hücre. kapsamın %48'i).** Grid yalnız tam beden
   içerir. Atlanırsa merdiven KIRILIR: ör. beden 8 $670 olurken 8.5 eski $365'te
   kalır — alıcı yarım bedene kaçar, tüm artış boşa düşer. **Öneri:** komşu tam
   bedenlerin orta noktası, $5'e yukarı yuvarlı (`--interpolate-half`; gram
   tablosundaki yarım-beden kuralının fiyat karşılığı).
2. **Milgrain kapsam dışı (1.248 hücre).** Grid'de milgrain yalnız 14K ×
   2mm var; panelde milgrain 9 aile (3 karat × 3 renk) × 11 genişlik. 10K/18K
   milgrain ve 3-12mm genişlikler için yeni fiyat YOK. Enterpolasyon karatlar
   arası türetilemez (İşçilik 40 farkı grid'e gömülü). **Öneri:** bu varyantlar bu
   turda atlanır (canlı fiyat korunur); EON'dan genişletilmiş milgrain sekmesi istenir.
3. **Yıldız aile GLD-R-1401.** Eski katalogda bilinçli düşük $/g (13.560 vs 15.820)
   ile fiyatlanmıştı; yeni grid yıldız ayrımı YAPMIYOR → standart 14K fiyatına
   döner (ort +%85). Kasıtlı mı, EON teyidi önerilir.
4. **Kalınlık/gram tabanı değişti.** Canlı katalog 1.5mm gram tablosuyla, grid 2.0mm
   standardıyla hesaplı — artışın bir kısmı kalınlık geçişi + spot 4090 + çarpan 1,55.
   Listing metinleri hâlâ 1.5mm anlatıyorsa fiyat-metin tutarlılığı ayrı iş kalemi.

## Uygulama (onay sonrası)

```bash
# 1) Otoriter dry-run (canlı DB; .env.local gerekli):
npx tsx scripts/eon-price-push-oneshot.ts --interpolate-half
# 2) Rapor onaylanınca TEK SEFER:
npx tsx scripts/eon-price-push-oneshot.ts --interpolate-half --push
```

Push güvenceleri: `pushListingPrices` (2025 envanter sözleşmesi: offering başına
`readiness_state_id` + `?legacy=false`; fiyat-sıfır korumaları; değişiklik yoksa PUT
yok — idempotent). Haritada olmayan SKU'nun CANLI fiyatı aynen geri yazılır (GAP =
koru). Push sonrası panel varyant fiyatları eşitlenir ve `audit_log`'a
`etsy.reprice` (source `script:eon-price-push-oneshot`) kaydı düşülür.

## Mirror durumu (PHASE 1 bağlantısı)

`pricing_engine_import` 630c7391 açıldı; canlıda 442 satırın 150'si MCP ile girdi,
kalanı migration `0121_pricing_engine_seed_20260728.sql` (idempotent) uygulanınca
tamamlanır. `scripts/import-pricing-engine.ts` gelecekteki grid güncellemelerinin
kalıcı içe aktarım yoludur.
