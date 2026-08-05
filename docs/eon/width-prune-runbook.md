# Dar genişlik temizliği — runbook (2026-08)

## Karar

EON alyans kataloğunda dar genişlik bantları satılmıyor. İki ayrı kural:

| Aile | Kalkan genişlikler | Kalan en dar |
| --- | --- | --- |
| Milgrain (9 listing) | 2mm | **3mm** |
| Hammered (1 listing) | 2, 3, 4, 5mm | **6mm** |
| TTG iki-ton (3 taslak) | 2, 3, 4, 5mm | **6mm** |
| Basketweave / ribbed | — (zaten 6mm'den başlıyordu) | 6mm |

## Durum

- **TTG (TTG-R-1006/1406/1806):** tamamlandı. Etsy'ye hiç gitmemişlerdi, panelde
  doğrudan temizlendi (300 varyant silindi, 275 → 175/ayar). Repo tarafında
  `scripts/gen_catalog_ttg.py` katalog eksenini 6–12mm'ye çekti ve
  `supabase/migrations/0127–0129` yeniden üretildi; canlı DB üretici çıktısıyla
  birebir doğrulandı.
- **Milgrain + hammered (10 canlı listing):** Etsy'de canlı. Panelden tek başına
  silmek işe YARAMAZ — gece senkronu Etsy'yi doğruluk kaynağı sayar ve satırları
  geri getirir. Bu yüzden önce Etsy envanterinden düşürülmeleri gerekir:
  `/api/ops/prune-widths` rotası bunun içindir ve **production'da** tetiklenmelidir
  (Etsy OAuth token'ları üretildikleri app bağlamına kilitli — bkz. second-brain).

## Rotayı çalıştırma

Rota varsayılan olarak **kuru çalışır**; hiçbir şey yazmaz, yalnız neyin
kaldırılacağını sayar.

```bash
# 1) Kuru çalışma — hedefleri ve sayıları gör
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://<prod-domain>/api/ops/prune-widths" | jq

# 2) Tek listing'de dene (önce bir tanesinde kanıtla)
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://<prod-domain>/api/ops/prune-widths?listing=4543442596&apply=1" | jq

# 3) Hepsini uygula
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://<prod-domain>/api/ops/prune-widths?apply=1" | jq
```

`CRON_SECRET` yerine `PRUNE_ONE_SHOT_TOKEN` env'i tanımlanıp `?token=…` ile de
tetiklenebilir. Token tanımlı değilse o yol kapalıdır (fail-closed).

## Rotanın güvenlik davranışı

- **Hedefler `etsy_listing_id` ile sabit.** SKU öneki kullanılmaz: kopya
  listing'lerde SKU sahipliği el değiştirebiliyor (second-brain "aynı ürün"
  dersi), listing kimliği ise sabit.
- **Genişlik SKU deseninden okunur** (`-<N>MM-<beden>`). Desene uymayan SKU asla
  kaldırılmaz.
- **Listing boşaltılmaz.** Kalan offering sıfıra düşecekse işlem reddedilir.
- **Fiyat güvenliği devralınır.** Kalan bir offering'in canlı fiyatı okunamazsa
  PUT hiç yapılmaz (`buildInventoryUpdate` fırlatır) — fiyatı sıfıra çekme riski yok.
  Kaldırılacaklar payload kurulmadan önce elendiği için silinecek bir satırın
  bozuk fiyatı işlemi gereksiz yere iptal etmez.
- **Read-back doğrulaması.** Yazma sonrası envanter aynı turda geri okunur;
  hedef SKU'lar hâlâ duruyorsa panel aynasına DOKUNULMAZ (`verified: false`
  raporlanır). "200 OK" teslim sayılmaz — bu kural 2026-08 başlık geri-alınma
  vakasından geliyor.
- **Panel eşitlemesi yalnız doğrulandıktan sonra**: varyantlar silinir, çapa
  fiyat (`products.price_cents`) kalanların en düşüğüne çekilir, `audit_log`'a
  `etsy.variant_sync` satırı düşer.
- **Tekrar çalıştırma güvenli**: eşleşme kalmayınca `unchanged` döner, PUT yapılmaz.

## Uygulama sonrası beklenen tablo

| Listing | Aile | Önce | Sonra | Yeni çapa |
| --- | --- | --- | --- | --- |
| 4539517211 | 10K Yellow Milgrain | 275 | 250 | 3mm fiyatı |
| 4539506699 | 10K White Milgrain | 275 | 250 | 3mm fiyatı |
| 4539493533 | 10K Rose Milgrain | 275 | 250 | 3mm fiyatı |
| 4543953211 | 14K Yellow Milgrain | 275 | 250 | 3mm fiyatı |
| 4542485142 | 14K White Milgrain | 275 | 250 | 3mm fiyatı |
| 4540045731 | 14K Rose Milgrain | 275 | 250 | 3mm fiyatı |
| 4548748952 | 18K Yellow Milgrain | 275 | 250 | 3mm fiyatı |
| 4546520793 | 18K White Milgrain | 275 | 250 | 3mm fiyatı |
| 4548734437 | 18K Rose Milgrain | 275 | 250 | 3mm fiyatı |
| 4543442596 | 10K Hammered | 275 | 175 | 6mm fiyatı |

Toplam: Etsy'den 325 offering (9×25 + 100) düşer.

## Sonrasında yapılacak (ayrı adım)

Genişlik aralığını anlatan **metinler** bu rotanın işi değil; envanterle birlikte
değişmezler:

- Üç 18K milgrain taslağının başlığında `2mm to 12mm` geçiyor → `3mm to 12mm`.
- Sekiz listing'in açıklamasında 2mm'ye atıf var → genişlik rehberliği
  yeniden yazılmalı (regex ile değil; prose yeniden yazılır — second-brain kuralı).

Bu metin turu, Etsy başlık kuralları araştırmasıyla birlikte tek seferde yapılır.
