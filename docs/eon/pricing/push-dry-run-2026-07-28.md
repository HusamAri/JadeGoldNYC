# EON fiyat itişi — dry-run ön-izleme v3 (2026-07-28)

> **Durum: TAZE DRY-RUN BEKLİYOR — hiçbir fiyat değişmedi.** Bu ön-izleme v3
> grid + ONAYLI kararlarla yerel modeldir (eski fiyat modeli canlı katalogla
> çapraz-doğrulanmış v3 üreticisi). Otoriter varyant-düzeyi diff, sen
> `.env.local` ile script'i koşunca canlı DB'den üretilir ve bu dosyanın
> yanına yazılır; push senin onayınla, senin makinende.

Onaylı kararlar: (1) `--interpolate-half` AÇIK (komşu ort., $5 yukarı);
(2) milgrain kapsamı v3 ile kapandı (MILGRAIN sekmesi 3 karat × 11 genişlik,
işçilik 40, gram tablosu dome ile aynı); (3) GLD-R-1401 artışı BİLİNÇLİ
(canlı $/g floor altındaydı); (4) 1.5mm metin / 2.0mm fiyat ayrı iş kalemi.

Kaynak: `2026-07-28-eon-etsy-giris-grid-spot4090-v3.xlsx` (sha256 `7245e98006a2c0c8…`,
spot $4.090, çarpan 1,55) — 858 grid hücresi + 792 enterpolasyon.

## Özet

- 39 aile × 275 varyant = **10.725** hücre; yeni fiyatı olan: **10.725** (%100.0).
- Model düzeyinde kalan GAP: **0** — v3 + enterpolasyon tam kapsıyor.
  (Çalışma anında tek olası kalıntı: SKU deseni çözülemeyen kayıtlar — script listeler.)
- Tüm değişimler ARTIŞ: Δ min **+%50.2** · ort **+%70.3** · max **+%134.4**. Düşen fiyat yok.

| Segment | Hücre | Δ% min | Δ% ort | Δ% max |
|---|---|---|---|---|
| 10K standart | 2750 | +61.2 | +75.6 | +121.9 |
| 14K standart | 2475 | +50.2 | +59.4 | +88.7 |
| 18K standart | 2750 | +56.5 | +71.9 | +91.1 |
| 10K milgrain | 825 | +62.6 | +79.7 | +134.4 |
| 14K milgrain | 825 | +51.1 | +61.9 | +96.2 |
| 18K milgrain | 825 | +57.3 | +73.7 | +94.6 |
| YILDIZ GLD-R-1401 (bilinçli düzeltme) | 275 | +75.2 | +85.5 | +117.8 |

Örnek merdiven — 10K dome 4mm (GLD-R-1001), yarım bedenler enterpolasyonlu:

| Beden | Eski | Yeni | Not |
|---|---|---|---|
| 4 | $305 | $580 |  |
| 4.5 | $315 | $595 | enterpolasyon |
| 5 | $320 | $605 |  |
| 8 | $365 | $670 |  |
| 8.5 | $370 | $680 | enterpolasyon |
| 12 | $420 | $755 |  |
| 16 | $475 | $840 |  |

Örnek — 14K milgrain 7mm US10 (v3'ün kapattığı eski GAP): eski $1125 → yeni $1775.

## Uygulama (senin makinende)

```bash
# 1) Otoriter dry-run (canlı DB + .env.local):
npx tsx scripts/eon-price-push-oneshot.ts --interpolate-half
# 2) Raporu onayladıktan sonra TEK SEFER:
npx tsx scripts/eon-price-push-oneshot.ts --interpolate-half --push
```

Güvenceler: `pushListingPrices` (2025 envanter sözleşmesi, fiyat-sıfır korumaları,
idempotent); haritada olmayan SKU'nun canlı fiyatı korunur; push sonrası panel
varyantları eşitlenir + `audit_log`'a `etsy.reprice` düşer; script sonra emekli edilir.

## Ayna durumu (PHASE 1)

Migration `0121` artık v3 seed'idir (858 satır, idempotent) ve MCP ile yarım kalan
v2 yüklemesini (150/442) temizler — canlıya uygulanınca ayna tek ve tam v3 olur.
`scripts/import-pricing-engine.ts` v3 düzenini (MILGRAIN karat kolonu) tanır;
gelecek grid güncellemeleri bu yoldan girer.

## Takip işi (push engeli değil)

- Listing metinleri 1.5mm anlatıyor, v3 fiyat tabanı 2.0mm — metin/künye
  güncellemesi ayrı iş kalemi olarak açılacak.
