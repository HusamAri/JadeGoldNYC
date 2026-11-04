# Tema laboratuvarı

Next bu konteynerde çalışmaz (SWC native binding yok); tema CSS'i gerçek
Tailwind v4 derleyicisiyle burada derlenir ve statik bir harnessle ölçülür.

```bash
node scripts/theme-lab/compile.mjs   # app/globals.css -> out.css (syntax hatası burada patlar)
node scripts/theme-lab/shoot.mjs     # açık/koyu x 5 ton ekran görüntüsü + WCAG kontrast tablosu
```

`lab.html` gerçek bileşenlerin sınıf dizelerini taşır (sidebar, KPI, buton,
girdi, tablo kuyusu). Uygulama içinde aynı yüzeyler `/dev/tema` rotasında
(yalnız geliştirme; prod'da 404) canlı bileşenlerle görülür.

Son ölçüm (2026-11-04): metin 11,1-12,5:1, ikincil metin 5,4-7,2:1, altın
metin 4,7-10:1, kâr/zarar 5,0-8,0:1, hairline 3,0-3,2:1; beş tonun hepsinde.
