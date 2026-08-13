# Jade Gold NYC — mağaza yönetim sistemi

Bu klasör Jade Gold NYC Etsy mağazasının **yönetim iş kolunun** kalıcı kaydıdır:
kararlar, kurallar, araştırma endeksi ve çalıştırma talimatı burada yaşar.
Kaynak model EON (`docs/eon/`) — orada kanıtlanmış zincir (içerik → deterministik
QA → yayın kapısı → onay → canary → ölçüm) buraya uyarlandı.

> **EON'dan tek ama belirleyici fark:** EON boş sayfaydı, taslakları vardı.
> Jade Gold **canlı ve satan** bir mağaza: 121 listing, $2.49M ömür-boyu ciro,
> 9.170 satış. Bu yüzden buradaki sistemin birinci işi üretmek değil,
> **bozmamaktır**. Kurallar `koruma-kurallari.md`'de.

## Durum panosu

| Parça | Durum | Dosya |
|---|---|---|
| Anlam bölümleri (sınıflandırma motoru) | ✅ kurulu | `lib/collections/chapters.ts` |
| Bölümün DB'de kalıcılığı + elle sabitleme | ✅ 0138 | `supabase/migrations/0138_jade_chapters.sql` |
| Bölüm panosu + listeler facet'i | ✅ | `/tasarimlar/bolumler`, `/tasarimlar?chapter=…` |
| Yeniden tasarım staging tablosu | ✅ 0139 | `supabase/migrations/0139_listing_redesigns.sql` |
| İçerik QA motoru (deterministik) | ✅ | `scripts/jade-qa/jade_listing_qa.py` |
| Bölüm içeriği (Faz 2) | ⬜ başlanmadı | `docs/jade/bolumler/` |
| Canlı push akışı | ⬜ Faz 2 | — |

## Nasıl çalışıyoruz (oturum protokolü)

1. **Tek bölüm, tek dalga.** Katalogun tamamına asla dokunulmaz. Bir anlam
   bölümü seçilir (`/tasarimlar/bolumler`), o bölümün listingleri çalışılır.
2. **Kanıtla, varsayma.** Her durum iddiası (bu listing satıyor mu, tag kaç,
   foto kaç) canlı DB'den SQL ile doğrulanır — hafızadan konuşulmaz.
3. **Hazırlık staging'de yaşar.** İçerik `listing_redesigns` tablosuna yazılır.
   **Asla `products`'a değil** — orası Etsy'nin aynasıdır, her senkronda ezilir.
4. **Kapıdan geçmeden gönderim yok.** `jade_listing_qa.py` 0 hata vermeden ve
   koruma kuralları sağlanmadan hiçbir satır `approved` olmaz.
5. **Canary → bekle → grup.** Önce tek listing, 48 saat, sonra bölüm kalanı.
6. **Ölçüm zorunlu.** Push anında baseline (views/favs) yakalanır; 14 ve 30.
   günde karşılaştırılır. Ölçülmeyen değişiklik yapılmamış sayılır.
7. **İş bitince iz bırak.** Artefakt bu klasöre, ders `docs/second-brain.md`'ye,
   rapor kopyası Drive `oo5 | Jade Gold NYC - Efe` klasörüne.

## Kayıt nereye düşer

- **Panel/DB:** her `products` değişikliği `audit_log`'a trigger ile (0011);
  semantik olaylar `logAudit` ile (`etsy.redesign_push`). Görünüm: `/kayitlar`.
- **Repo:** kararlar ve paketler bu klasörde (teslimat repo'ya inmeden iş
  bitmiş sayılmaz — second-brain dersi).
- **Drive:** `oo5 | Jade Gold NYC - Efe` (id `1tDFhMfGZKmrKEjZCoGoDDGYUUult8TQV`).
  Kaynak endeksi: `arastirma/README.md`. Kod tarafında Drive API entegrasyonu
  **yok** ve bilinçli olarak eklenmiyor (MCP ile okunur/yazılır).

## Dosyalar

| Dosya | İçerik |
|---|---|
| `koruma-kurallari.md` | "Satanı bozma" sözleşmesi — dokunulmazlar, dalga kuralı, geri alma |
| `urun-gruplari.md` | Yedi anlam bölümü: tanım, kapsam, canlı performans, sınıflandırma kuralları |
| `arastirma/README.md` | Önceki tüm araştırmaların endeksi (Drive + repo) |
| `seo/` | 2026-08-01 SEO denetimi + Alura verisi (mevcut) |
| `bolumler/` | Faz 2+: bölüm başına içerik, karar, kapı raporu |

## Runbook — bir bölümü çalışmak (Faz 2)

```
1. SEÇ        /tasarimlar/bolumler → bölüm; koruma-kurallari.md'yi oku
2. ÖLÇ        bölümün listingleri: satış, trafik, dönüşüm, foto/tag durumu (SQL)
3. AYIR       kill / fix / keep★ (bkz. docs/listing-audit/2026-08-…-kill-keep.md)
4. YAZ        yalnız "fix" grubuna içerik → listing_redesigns (status=pending)
5. KAPI       python3 scripts/jade-qa/jade_listing_qa.py <export.json>  → 0 hata
6. ONAY       insan onayı → status=approved
7. CANARY     tek listing push → 48 saat bekle → Etsy'de gözle doğrula
8. DALGA      bölüm kalanı
9. ÖLÇ        14. ve 30. günde baseline karşılaştırması
10. İZ        docs/jade/bolumler/<bolum>.md + second-brain dersi + Drive kopyası
```

## İlk hedef (Faz 2)

**Koruma & Şans** — mağazanın motoru burada: 14K Evil Eye Pendant tek başına
1.466 satış (ömür-boyu birimlerin ~%24'ü). Hikâyesi en net, Look Book görsel
dili hazır (`JG_CH1_PROTECTION`). Sonra: İnanç (17 listing / yalnız 115 satış —
en zayıf verim) → Sevgi → Miras → biçim kovaları.
