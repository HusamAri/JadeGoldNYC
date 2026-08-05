# Günlük marka özet e-postası

Her sabah (cron `11:00 UTC`) seçili alıcılara marka renkli HTML brifing gider.
Tek satış özeti değil — çok lens’li bakış:

- **Satış** — son 24 saat gelir / sipariş (+ önceki 24s kıyas)
- **Reklam** — son 30 harcama, getiri, ROAS
- **7 günlük gidişat**
- **Açık uyarılar** + **kapanan uyarılar** (Çözüldü görevleri, yapılan reklam aksiyonları)
- **En değerli 5 fiyat önerisi** (sapma × güven × fiyat farkı)
- **Sayfa ilgilenme skoru** (listing görüntülenme/favori)
- **Panelde kim ne kadar** (audit’ten yaklaşık süre)
- **Neler oldu** — yalnız kullanıcı eylemleri (sistem/cron hariç)
- Öneriler (reklam sinyalleri, boş gün, yorum)

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

- Ayarlar → **Günlük özet e-posta**: aç/kapa, **alıcı listesi**, **neler gelsin**, HTML önizleme, şimdi gönder.
  - Alıcı kutusu doluysa yalnız o adreslere gider; boşsa org üyelerine.
  - İçerik tercihleri (`digest_settings.sections` + `actionLevel`):
    - performance, ads, trend, actions, closedAlerts, priceTips, engagement, team, suggestions, activity
    - Aksiyon eşiği: yalnız kritik → kritik+önemli → tümü
    - Kapalı bölüm mail HTML’inde hiç basılmaz
- Önizleme: oturum açıkken `/api/digest/preview`
- Cron: `GET /api/cron/daily-digest` + `Authorization: Bearer $CRON_SECRET`
- Tek org / kuru koşu: `?org=<uuid>&dry=1`

## Marka paletleri (panel token)

| Org | Açık | Koyu | Arka plan |
|-----|------|------|-----------|
| Amuletta / diğer | `#eaecf3` + indigo `#6b5bd6` | `#14161e` + `#a99bff` | `bg-amuletta-*.jpg` (holo-drift) |
| Jade Gold NYC | ivory + antik altın | kömür + altın | `bg-jade-*.jpg` |
| EON | sıcak kâğıt + siyah | koyu nötr | jade dokusu |

Mail HTML `prefers-color-scheme: dark` ile panel dark token’larına döner; arka plan görselleri `NEXT_PUBLIC_APP_URL` üzerinden gömülür.
