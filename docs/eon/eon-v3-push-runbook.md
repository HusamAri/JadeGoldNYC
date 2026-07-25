# EON v3 — 34 Temiz Taslağı Etsy'e Toplu Push (Runbook)

34 temiz v3 taslağını (39 aile eksi zaten Etsy'de dokunulmuş 5: **02 GLD-R-1401
yıldız, 25 RSG-R-1003, 28 GLD-R-1004, 31 WHG-R-1004, 34 RSG-R-1004**) tek komutla
Etsy'e **taslak** olarak gönderir. Yayınlamaz. İdempotenttir: `etsy_listing_id`
dolu ürünü atlar, tekrar koşmak duplicate açmaz.

> **Neden konteynerden değil:** push aracı `scripts/eon-push-drafts.ts` gerçek
> Etsy kimliği ister; ajan konteynerinde `.env.local` ve bu secret'lar YOK. Bu
> yüzden komut, secret'ların bulunduğu ortamda (senin local/CI) koşulur. Gate
> dosyası hazır: `docs/eon/eon-gate-v3.json` (34 PASS).

## Ön koşullar

Repo kökünde `.env.local` (script CWD'den okur) — GERÇEK değerler:

```
ETSY_API_KEY=...
ETSY_API_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://sewbrqflcrlgczilrusw.supabase.co
```

- EON Etsy bağlantısı canlı olmalı (`etsy_connection` satırı, `listings_w` scope,
  geçerli refresh token). Panelde bir kez "Etsy'e bağlan" yapıldıysa yeterli.
- Taksonomi (Wedding Bands), kargo profili ve iade politikası verilmezse script
  **mağazadaki İLKİNİ** otomatik seçer.

## Komut

```bash
# 1) KURU PROVA — 34 ürün + varyant çözülüyor mu, hata yok mu (Etsy'e yazmaz)
npx tsx scripts/eon-push-drafts.ts --gate docs/eon/eon-gate-v3.json --dry-run

# 2) CANARY — yalnız tek listing (01 = GLD-R-1001), görselsiz taslak
npx tsx scripts/eon-push-drafts.ts --gate docs/eon/eon-gate-v3.json --only 01

# 3) KALAN 33 — canary Etsy'de doğrulandıktan sonra
npx tsx scripts/eon-push-drafts.ts --gate docs/eon/eon-gate-v3.json
#    (01 artık etsy_listing_id'li → otomatik atlanır, kalan 33 gider)
```

İsteğe bağlı bayraklar: `--images-dir <klasör>` (kapak `NN.jpg` rank-1),
`--shipping-profile <id>`, `--return-policy <id>`, `--taxonomy <id>`,
`--only 01,10,19` (seçili no'lar), `--qty 20`.

## Canary sonrası DOĞRULA (kritik)

1. **Etsy taslağı:** 275 offering; fiyat + SKU iki eksende (Width 513 × Ring Size
   514); yarım bedenler ("4.5") ve genişlikler ("6MM") geldi.
2. **Kişiselleştirme alanı geldi mi** — instructions ≤120 char düzeltmesi sonrası
   (bu düzeltme merge edildi: 115 char). Gelmezse script çıktısında uyarı olur.
3. **Kargo profili ABD-ÜCRETSİZ mi** — fiyatlara **$10 kargo payı gömülü**.
   Otomatik seçilen ilk profil ücretsiz DEĞİLSE alıcı çift öder → DUR, ücretsiz
   profil kur ve `--shipping-profile <id>` ile ver.
4. **Panel yazımı:** `products.etsy_listing_id` doldu (kısmi başarı = create OK +
   mirror fail → id yazılmaz → retry duplicate; çıktıdaki "mirror" uyarısına bak).

## Kapanış doğrulama (SQL)

```sql
select count(*) filter (where etsy_listing_id is not null) as pushed
from products p
where p.org_id=(select id from organizations where name='EON')
  and p.description ~ '\[EON (0[13-9]|1[0-9]|2[0-46-9]|3[0235-9])';  -- 34 hedef
-- beklenen: pushed = 34
```

## Kişiselleştirme + engraving style (tüm aktif/taslak)

Yeni create yolu (`lib/etsy/personalization.ts`) iki soru yazar: iç gravür
(30 char) + Engraving style dropdown (The Signature | The Ornament |
The Monument | The Editorial — FONT RENDER PLATES). Mevcut listing'leri
eşitlemek için (prod secret'larla):

```bash
# Kuru prova — sapmaları listeler, yazmaz
npx tsx scripts/eon-sync-personalization.ts --dry-run

# Kanonik 30-char + 4-plate style uygula
npx tsx scripts/eon-sync-personalization.ts

# + FONT RENDER PLATES görseli (rank 8; yoksa yükle, varsa değiştir)
npx tsx scripts/eon-sync-personalization.ts \
  --image docs/eon/assets/engraving-style.jpg
```

## Notlar

- **Görselsiz** taslak: Etsy taslağa izin verir ama YAYIN için her listing'e en az
  bir görsel şart. Görseller sonra panelden/`--images-dir` ile eklenir.
- **Atlanan 5 aile** ayrıca ele alınır (orphan/manuel push reconcile'ı); bu runbook
  onlara dokunmaz.
- **Token yarışı:** script refresh'te `etsy_connection`'ı döndürür; aynı anda canlı
  app'ten push yapma.
