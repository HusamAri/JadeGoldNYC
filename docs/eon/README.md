# EON 16-Listing Yayın Kiti (2026-07-16)

> **⚠️ GÜNCEL KATALOG: v3 — `katalog-v3.md`.** 39 karat-ayrık listing korunur;
> v3 transform'u **yarım bedenler ekler** (US 4–16 tam+yarım = 25) ve **2.0mm
> kalınlığı kaldırır** (tek 1.5mm) → **275 varyant/listing, 10.725 toplam**;
> ayrıca 39 açıklamadaki iki-kalınlık dilini temizler. Yapı temeli (SKU aile
> düzeni, gram tabloları, fiyat kalibrasyonu, SEO şablonu) v2'de tanımlıdır:
> **`docs/eon/katalog-v2.md`**. Aşağıdaki 16-listing kiti (v1) **emekli**dir;
> yalnız tarihsel kayıt olarak durur.

EON Fine Jewelry'nin 16-listing lansmanının **tam yayın kiti** — karar, onay paketi,
push girdisi ve QA motoru burada yaşar. Konteyner/scratchpad geçicidir; bu klasör
kalıcı kayıttır. Herhangi bir oturum (veya insan) sadece bu klasörle akışı bitirebilir.

## Durum (2026-07-16 itibarıyla)

- Panel DB'de **16 taslak** (`products`, org EON, `[EON NN · ...]` iç künyesi) + **228 varyant**
  (Width × Size-band, fiyat+gram, SKU `EON-NN-WMM-Bk`).
- Yayın-yargı loop'u (26 ajan + itiraz paneli) sonucu: **01-06 + 13-15 → 9/9 READY**.
  07-12 HOLD (gram teyidi bekliyor), 16 FAIL. Ayrıntı: `2026-07-16-yayin-karari.md`.
- Fiyatlar doğrulandı, değişiklik YOK (açılış indirimi baz fiyattan değil Etsy SALE'den).

## Runbook — sırayla

1. **Onay paketi** → Supabase Dashboard > SQL Editor'a `2026-07-16-onay-paketi.sql`
   dosyasının TAMAMINI yapıştır, çalıştır (idempotent). İçerik: quick-win tag setleri,
   açıklama ekleri, ONAYLANDI damgası, archived_at düzeltmesi, 0097+0098 migration,
   4 doğrulama SELECT'i. Sondaki SELECT sonuçlarını kontrol et (9a: 9 satır true,
   9b/9c: 0 beklenir).
2. **Ortam** → `.env.local` içine GERÇEK `ETSY_API_KEY`, `ETSY_API_SECRET`,
   `SUPABASE_SERVICE_ROLE_KEY` (şu an placeholder). Etsy UI'da kargo profili
   (5-7 iş günü + ABD ücretsiz takipli) ve iade politikası (30 gün) oluştur, ID'leri al.
3. **Kapaklar** → `eon-covers-01-16.zip` (Drive `03-listings` / sana gönderildi)
   içeriğini bir klasöre aç; `--images-dir` ile ver. (Görseller repo'ya bilerek
   konmadı — 16 MB; kalıcı kopya Drive + `eon-media` bucket'ı.)
4. **Push (taslak — asla publish etmez):**
   ```bash
   # prova
   npx tsx scripts/eon-push-drafts.ts --gate docs/eon/eon-gate-report-v2.json --dry-run
   # kanarya: yalnız 01 → Etsy Drafts'ta kontrol (footer yok, 20 varyasyon fiyatlı, kapak geldi)
   npx tsx scripts/eon-push-drafts.ts --gate docs/eon/eon-gate-report-v2.json \
     --images-dir <kapak-klasörü> --shipping-profile <ID> --return-policy <ID> --only 01
   # kalan 8
   npx tsx scripts/eon-push-drafts.ts --gate docs/eon/eon-gate-report-v2.json \
     --images-dir <kapak-klasörü> --shipping-profile <ID> --return-policy <ID> \
     --only 02,03,04,05,06,13,14,15
   ```
   Bilinen risk: Etsy late-2025'ten beri `readiness_state_id` isteyebilir — kanarya
   400 dönerse hata metnine bak, createForm'a alan eklemek küçük bir yama.
5. **Publish** → karar raporu §3'teki Etsy UI listesi TAMKEN, 3 dalga:
   Gün 0: 01-03 → +3-4 gün: 04-06 → +7-8 gün: 13-15.

## Publish'i bağlayan açık maddeler (taslak push'u bağlamaz)

- **Milgrain gramları (13-15):** paketteki 9d SELECT'i koş; band1-max ~2.0 g çıkarsa
  baz $315→$345 düzeltilir (taslakta kolay).
- **Karat damgası:** açıklamalara "Stamped 14k/10k inside the band" girdi — atölyeden
  damga teyidi alınmadan publish etme (ABD damga yasası karat yanında üretici markası ister).
- **Beyaz altın (02/05/14):** rodyumlu mu doğal mı? Cevap "rodyumsuz" ise paketteki
  §6 yorum satırları açılır; rodyumluysa metin kararı yeniden verilir ('never plated' çelişkisi).

## Dosyalar

| Dosya | Ne |
|---|---|
| `2026-07-16-yayin-karari.md` | 9/9 READY karar sentezi + push komutları + Etsy UI listesi + fiyat doğrulamaları |
| `2026-07-16-onay-paketi.sql` | Kullanıcı-koşumlu tek SQL bloğu (yukarıda 1. adım) |
| `eon-gate-report-v2.json` | `scripts/eon-push-drafts.ts`'in nihai girdisi (9 READY = PASS) |
| `eon16-approved-content.json` | Onaylı içeriğin yerel doğruluk kaynağı (tag+açıklama uygulanmış 16'lık set) |
| `eon-yayin-karar.json` | Karar verisi + yargıya karşı yapılan düzeltmelerin kaydı |
| `../../scripts/eon-qa/` | Deterministik QA motoru (`eon_listing_qa` + aile-farkında `eon16_qa`), yayın kapısı, paket üreticisi |

`scripts/eon-qa/gen_onay_paketi.py` girdi JSON'larını çalıştığı dizinde arar —
`docs/eon/` içinden koşulur (üretim kaydıdır; paket zaten üretildi).
