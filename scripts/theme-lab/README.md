# Tema laboratuvarı

Next bu konteynerde çalışmaz (SWC native binding yok); tema CSS'i gerçek
Tailwind v4 derleyicisiyle burada derlenir ve statik bir harnessle ölçülür.

```bash
node scripts/theme-lab/compile.mjs   # app/globals.css -> out.css (syntax hatası burada patlar)
node scripts/theme-lab/shoot.mjs     # açık/koyu x 5 ton ekran görüntüsü + WCAG kontrast tablosu
```

`lab.html` V7 defter sayfasının (Satış & Maliyet) gerçek sınıf dizelerini
taşır: editoryal ray, başlık, kurulum şeridi, tuner ekranı, defter bandı,
dekor kartı, düz tablo, osiloskop, düğme, segment, Dikkat satırları. Google
Fonts bağlantısı Fraunces / Inter Tight / JetBrains Mono'yu çeker (çevrimdışı
sistem yüzüne düşer). Mockup kaynakları `directions/` altındadır (V7 =
`editorial.html` `#V2`).

Son ölçüm (2026-11-04, V7): metin 13,8-14,1:1, ikincil 6,3-6,5:1, tablo
başlığı 4,3-4,4:1, zarar 5,4-5,6:1 (açık); koyuda hepsi >=5,8:1. Rapordaki
`gold` sütunu artık LCD'yi (koyu ekran üstü asit) sayfa zeminine karşı ölçer,
yani açıkta anlamsızdır; `hairline` sütunu girdi kenarını (`--hairline`) ölçer.
