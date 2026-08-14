# EON İspanyolca listing metinleri — repo kaynağı

Bu klasör, panelde üretilen İngilizce başlık revizyonlarının ve İspanyolca
çeviri katmanının **insan okunur kaynağıdır**. Her dosya bir listing'i anlatır.

## Neden repoda da duruyor

Etsy senkronu tek yönlü bir aynadır: dış tarafta yapılan bir düzenleme panelin
sakladığı metni sessizce ezebilir (bkz. `docs/second-brain.md`, 2026-08 vakası —
30 listing'e itilen başlıkların 23'ü ertesi sabah geri alınmıştı ve metinleri
kurtaran tek şey repodaki kaynak dosyaydı). DB satırı (`product_translations`)
akışın durumunu taşır; bu klasör metnin kendisini taşır.

## Akış

```
workflow üretir      → product_translations.status = 'draft'   + bu klasöre döküm
insan onaylar        → status = 'approved'
ops rotası push eder → status = 'pushed'  (read-back doğrulanmışsa)
read-back tutmazsa   → status = 'failed'  + neden note alanında
```

Push rotası: `app/api/ops/es-push/route.ts`. Onaysız satır kapıdan geçmez;
varsayılan kuru çalışmadır, gerçek yazma `?apply=1` ve ilk gerçek gönderim
`?listing=<id>` canary'si ile TEK listing'de denenir.

## Tag'ler burada YOK

Ne İngilizce tag revizyonu ne de İspanyolca tag seti bu turda yazıldı. İkisi de
ölçüm bekliyor: İngilizce tarafta Shop Manager listing CSV export'u (mevcut
tag'ler panelde görünmüyor), İspanyolca tarafta Alura Keyword Research hacim
verisi (Etsy arama sayfaları bu ortamdan çekilemiyor, `etsy.com` 403 döndürüyor).
Kural: **ölçülmeden hiçbir tag Etsy'ye yazılmaz.** Aday havuzu ve terminoloji
kararları bir üst klasörde: `../es-keyword-matrisi.md`.

Bu yüzden `product_translations.tags` 26 satırda da NULL'dır; `es-push` biçim
kapısı tags boşken tag alanına hiç dokunmaz, yani ölçüm gelmeden yanlış tag'in
Etsy'ye gitmesi yapısal olarak imkânsızdır.

## Dil kararı

Nötr Latin Amerika İspanyolcası (hedef kitle: ABD'deki Latin alıcı). İspanya'ya
özgü kalıplar (`alianzas de boda`) kullanılmaz. Açıklamalar kelime kelime çeviri
değil, anlam bazlı uyarlamadır — gerekçesi ve terminoloji tablosu keyword
matrisinde.
