# Buyer Memory — müşteri hafızası (ürün tasarımı)

Etsy alıcı ilişkisini tutmaz; tekrar alışta stil / beden / hediye bağlamı
unutulur. Panel bunu **tek odaklı** bir müşteri profilinde tutar.

## Best practice (özet)

Kaynaklar: Putler/Etsy CRM boşlukları, Customer 360, zero-party order attributes,
CraftPilot repeat-buyer, seller CRM notları.

1. **Tek kimlik (golden record)** — önce `buyer_email` (normalize), yoksa
   `buyer_name` + ülke. Winback (`0022`) aynı soft-key’i kullanır; onu yeniden
   icat etme.
2. **Timeline, silo değil** — sipariş + otomatik fact + elle not tek timeline’da.
   Satış notu / yorum notu / sepet notu **üçüncü kopya** olmaz.
3. **Otomatik fact + elle derinleştirme** — siparişten gelen size/width/SKU/ürün
   otomatik yazılır; stil tercihi, hediye hikâyesi, “nasıl konuşuldu” elle eklenir.
4. **TLDR üstte** — profil açılınca ilk 2 satır: kim, ne aldı, beden/stil, kime
   hediye. Detay altta.
5. **Dönüş hatırlatması** — yeni sipariş mevcut alıcıya bağlanınca satış detayı +
   Uyarı Merkezi + (isteğe) günlük özet: “geri döndü → önceki hikâye”.
6. **Temiz yüzey** — her bölümün tek işi var. Geri Kazanım yalnız “lapse filtresi”
   kalır; CRM oraya gömülmez.

## Panel akışı (tekrar yok)

| Yüzey | Tek iş |
|---|---|
| `/musteriler` | Liste + arama (isim/e-posta) |
| `/musteriler/[id]` | Profil: TLDR → facts → timeline → not ekle |
| `/satislar/[id]` | Sipariş. Üstte ince “Geri döndü” şeridi + profil linki (not formu yok) |
| `/sepet-kurtarma` | Yalnız lapse/winback aksiyonu; profil notlarına link |
| Uyarı Merkezi | `returning_buyer` uyarısı (önemli) |

**Yapılmayacak:** satış formuna ikinci not alanı, yorumlara müşteri biyografisi,
Geri Kazanım’a paralel CRM.

## Veri modeli (öneri)

```
buyers
  org_id, identity_key, email, name,
  first_order_at, last_order_at, order_count, lifetime_cents,
  tldr,                  -- kısa özet (elle veya ajan)
  created_at, updated_at
  UNIQUE (org_id, identity_key)

buyer_facts               -- yapılandırılmış hafıza
  buyer_id, key, value,  -- ring_size | width_mm | engraving | style |
                         -- gift_for | gift_size | sku | listing_title
  source,                -- etsy_variation | sku_infer | manual
  sale_id, sale_item_id, observed_at
  UNIQUE (buyer_id, key, sale_id) where sale-sourced

buyer_notes               -- serbest not
  buyer_id, body, kind,  -- manual | system
  created_by, created_at
```

`sales.buyer_id` nullable FK (backfill + sync sonrası dolar).

## Otomatik doldurma

Etsy `getShopReceipts` transaction’larında `variations` / `product_data`
(kişiselleştirme + beden/genişlik) gelir; bugün `EtsyTransaction` tipinde ve
`upsertSalesPage`’de **yutuluyor**. Öncelik:

1. Tip + sync: `variations`/`product_data` → `sale_items` jsonb veya facts.
2. SKU → `product_variants.properties` (size/width) yedek çıkarsama.
3. Profil rollup: en son bilinen `ring_size` / `width_mm` / `engraving_style`.

## Dönüş hatırlatması

Yeni sale upsert’ta `buyer_id` zaten varsa:

- Alert: “X geri döndü — son: {ürün}, beden {n}, hediye {y}”
- Satış detay şeridi aynı TLDR’ı gösterir
- Günlük digeste “bugün dönenler” satırı (0106 ile aynı kanal)

## Uygulama dilimleri (loop’lar bunları sürer)

1. **Capture** — Etsy variations sync + sale_items alanları
2. **Identity** — buyers tablosu + backfill sales
3. **Profil UI** — `/musteriler` tek odak (TLDR / facts / notes / timeline)
4. **Remind** — returning alert + sale banner + digest satırı
5. **Cleanup** — satış/yorum/sepet not silolarını profile yönlendir (migration path)

Hazır Cursor Automation prompt’ları: `docs/automations/buyer-memory-loops.md`.
