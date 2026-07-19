# Günlük marka özet e-postası

Her sabah (cron `11:00 UTC`) org üyelerine marka renkli HTML özet gider:

- Son 24 saat gelir / sipariş (+ önceki 24s kıyas)
- 7 günlük gidişat
- Aksiyon bekleyenler (Etsy kopuk, stok, yorum, P0 görev, reklam…)
- Öneriler (reklam sinyalleri, boş gün uyarısı)
- Neler oldu / neler bitti (audit + biten görevler)

## Kurulum

1. Migration `0106_digest_email_settings.sql` uygulanmış olmalı (`digest_settings`).
2. `lib/supabase/middleware.ts` içinde `/api/cron` public olmalı (yoksa Vercel Cron login’e 307 alır).
3. Env (Gmail/Workspace SMTP öncelikli):

```bash
SMTP_USER=husamari@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx   # Google App Password
EMAIL_FROM="Jade Gold NYC <husamari@gmail.com>"
CRON_SECRET=...
NEXT_PUBLIC_APP_URL=https://senin-domainin.com
```

App Password: Google hesabı → Güvenlik → 2 adımlı doğrulama → Uygulama şifreleri.

Yedek (SMTP yoksa): `RESEND_API_KEY` + `RESEND_FROM_EMAIL`.

## Kullanım

- Ayarlar → **Günlük özet e-posta**: aç/kapa, **alıcı listesi** (elle), HTML önizleme, şimdi gönder.
  - Alıcı kutusu doluysa yalnız o adreslere gider; boşsa org üyelerine.
- Önizleme: oturum açıkken `/api/digest/preview`
- Cron: `GET /api/cron/daily-digest` + `Authorization: Bearer $CRON_SECRET`
- Tek org / kuru koşu: `?org=<uuid>&dry=1`

## Marka paletleri

| Org | Palet |
|-----|--------|
| Jade Gold NYC | Antique Gold `#B89347`, ivory, jade ink |
| EON | Siyah / sıcak kağıt |
| Diğer | Amuletta (mor vurgu) |
