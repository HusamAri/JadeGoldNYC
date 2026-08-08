# Dar genişlik temizliği — runbook (2026-08)

## Karar

Dar genişlik bandı her ailede aynı değil — profil ne kadar dar dokuya izin
veriyorsa en dar beden o. Aile başına ayrı kural:

| Aile | Kalkan genişlikler | Kalan en dar |
| --- | --- | --- |
| **Milgrain (9 listing)** | **— (dokunulmuyor)** | **2mm** |
| Hammered (1 listing) | 2, 3mm | **4mm** |
| TTG iki-ton (3 listing) | 2, 3, 4, 5mm | **6mm** |
| Basketweave / ribbed | — (zaten 6mm'den başlıyordu) | 6mm |

> **Karar geçmişi (2026-08).** İlk turda "milgrain 2mm kalksın, hammered 6mm'den
> başlasın" planlanmıştı; ikisi de revize edildi. Milgrain'de 2mm satılabilir bant
> olarak KALIYOR, hammered'da yalnız 2 ve 3mm kalkıyor — 4mm ve 5mm satışta.
> Rota hiç uygulanmadan revize edildiği için canlıda geri alınacak bir şey yok.

## Durum

- **TTG (TTG-R-1006/1406/1806):** tamamlandı. Panelde doğrudan temizlendi
  (300 varyant silindi, 275 → 175/ayar); `scripts/gen_catalog_ttg.py` katalog
  eksenini 6–12mm'ye çekti, `supabase/migrations/0127–0129` yeniden üretildi.
  Üçü de sonradan Etsy'ye çıktı (4550516268 / 4550506421 / 4550506827).
- **Milgrain (9 listing):** iş kalmadı — 2mm dahil tüm bant korunuyor.
- **Hammered (4543442596):** Etsy'de canlı, 2mm + 3mm = **50 varyant** kalkacak
  (11 genişlik × 25 beden; kalan 9 genişlik = 225 varyant). Panelden tek başına
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
| 4543442596 | 10K Hammered | 275 | 225 | 4mm fiyatı |

Toplam: Etsy'den **50 offering** (2×25) düşer. Milgrain listing'lerine
dokunulmadığı için onlar 275 varyantta kalır.

> ⚠️ **Vitrin fiyatı sıçrar.** Çapa `products.price_cents` kalanların en
> düşüğüne çekilir: **$410 → $670** (2mm yerine 4mm taban). Etsy'de listing'in
> "from" fiyatı bu — yani arama sonucunda görünen rakam %63 artar. Beklenen ve
> doğru davranış (ucuz bant satıştan kalkıyor), ama sürpriz olmasın diye burada.

## Sonrasında yapılacak (ayrı adım)

Yok. Genişlik aralığını anlatan metinler normalde envanterle birlikte değişmez
ve ayrı bir tur gerektirir — ama bu listing'de gerek kalmadı, DB'den doğrulandı:

```sql
-- title ilike '%2mm%' → false · description ilike '%2mm%' → false
select title ilike '%2mm%', description ilike '%2mm%'
from products where etsy_listing_id = 4543442596;
```

Başlık (`10K Solid Gold Hammered Wedding Band, Milgrain Comfort Fit Ring`) ve
açıklama genişlik aralığı vaat etmiyor, dolayısıyla rota koştuktan sonra metin
tarafında tutarsızlık oluşmaz. Milgrain kararı geri alındığı için o ailede de
metin işi yok.
