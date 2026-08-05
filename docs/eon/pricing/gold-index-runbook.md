# Altın-endeksli fiyatlama — runbook (2026-08)

## Ne kuruldu

Spot altın değiştikçe fiyatları endeksleyen kalıcı mekanizma (PR #325):

| Parça | İş |
| --- | --- |
| `gold_reprice_basis` | Org başına SON uygulanan spot tabanı (tohum: $4.090 = v4 grid) |
| `lib/pricing/gold-index.ts` | Saf motor — EON v4 formül portu + Jade metal-delta |
| `/api/ops/gold-reprice` | Gözetimli koşu (varsayılan kuru çalışma) |
| `/api/cron/gold-reprice` | Günlük 04:30 UTC otomatik koşu (Etsy senkronundan önce) |

- **EON:** v4 formülü yeniden hesaplar. İşçilik kademesi (30/40) hardcode
  değil — varyantın mevcut fiyatı ESKİ tabanla hangi kademede birebir çıkıyorsa
  o kademe kullanılır; uymayan varyant atlanır ve `taban-uyumsuz` olarak
  raporlanır (elle değiştirilmiş fiyat asla ezilmez).
- **Jade:** katalog formülle kurulmadığı için yalnız ham metal bedeli farkı
  (`gram × saflık × Δspot/ozt ÷ 31,1035 × 1,07`) mevcut fiyata eklenir, tam
  dolara yuvarlanır. Karat/gram çözülemeyen varyant atlanır + raporlanır.

## Güvenlik kapıları

1. Spot `gold-api.com`'dan çekilir; kotasyon 24 saatten bayatsa veya
   $3.000–6.000 aralığının dışındaysa HİÇBİR ŞEY yazılmaz. (2026-08-05 sondajı:
   ücretsiz/anahtarsız çalışan ikinci kaynak yok — stooq 404, goldprice.org 403,
   frankfurter/exchangerate anahtar istiyor. İlk sürümdeki stooq kaynağı hiç
   çalışmıyordu ve sessizce tek kaynağa düşüyordu; kaldırıldı.)
2. `|Δ| < %1` → deadband, sessiz no-op (cron her gün koşabilir).
3. `|Δ| > %10` → `blocked-max-step`; yalnız `force=1` ile (insan onayı) geçer.
4. Etsy PUT → AYNI turda read-back → yalnız doğrulanan listing'in paneli
   eşitlenir (ayna asla tek yönlü bozulmaz).
5. Taban yalnız TAM kapsamlı `apply` koşusunda ilerletilir; `listing=` kanıt
   koşusu tabanı kaydırmaz.

## Koşu sırası (prod'da, deploy sonrası)

```bash
# 1) Kuru çalışma — oran, hedef sayısı, atlananlar
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://<prod-domain>/api/ops/gold-reprice" | jq

# 2) Tek listing'de kanıtla (Etsy PUT + read-back; taban ilerlemez)
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://<prod-domain>/api/ops/gold-reprice?apply=1&org=eon&listing=4543953211" | jq

# 3) Tam uygulama (her iki org; taban yeni spota ilerler)
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "https://<prod-domain>/api/ops/gold-reprice?apply=1" | jq
```

Elle spot vermek gerekirse `&spot=4250` (mantık kapısından yine geçer).
Sonrası otomatik: cron her sabah koşar, %1'in altındaki oynama no-op'tur.

## Doğrulama kayıtları (2026-08-05 kurulum)

- Python motoru: v4 grid 5.148 hücre → sıfır sapma.
- TS portu ↔ Python: 3 profil × 2 spot ($4.090 ve $4.250) birebir;
  $4.090'daki değerler canlı DB `price_cents` ile birebir
  (71500 / 192000 / 318500 → 74000 / 199000 / 330000).
- Jade örneği: $450 · 3,2 g · 14K → $460 (+$10 ham metal farkı).
- Ekonomik not: TL-bazlı kur artışı (ör. gram-TL %7,5) USD cirolu mağazada
  marjı eritmez; endeks doğru büyüklük olan **USD/ozt** ile sürülür.
