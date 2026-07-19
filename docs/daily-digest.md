# Günlük marka özet e-postası

Her sabah (cron `11:00 UTC`) org üyelerine marka renkli HTML özet gider:

- Son 24 saat gelir / sipariş (+ önceki 24s kıyas)
- 7 günlük gidişat
- Aksiyon bekleyenler (Etsy kopuk, stok, yorum, P0 görev, reklam…)
- Öneriler (reklam sinyalleri, boş gün uyarısı)
- Neler oldu / neler bitti (audit + biten görevler)

## Kurulum

1. Migration `0101_digest_email_settings.sql` uygulanmış olmalı (`digest_settings`).
2. Env:

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Jade Gold NYC <ozet@senin-domainin.com>"
CRON_SECRET=...
NEXT_PUBLIC_APP_URL=https://senin-domainin.com
```

3. Resend’de domain doğrula; yoksa test için `onboarding@resend.dev` kullan (yalnız kendi hesabına gider).

## Kullanım

- Ayarlar → **Günlük özet e-posta**: aç/kapa, HTML önizleme, şimdi gönder.
- Önizleme: oturum açıkken `/api/digest/preview`
- Cron: `GET /api/cron/daily-digest` + `Authorization: Bearer $CRON_SECRET`
- Tek org / kuru koşu: `?org=<uuid>&dry=1`

## Marka paletleri

| Org | Palet |
|-----|--------|
| Jade Gold NYC | Antique Gold `#B89347`, ivory, jade ink |
| EON | Siyah / sıcak kağıt |
| Diğer | Amuletta (mor vurgu) |
