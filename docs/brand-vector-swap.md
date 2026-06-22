# Higgsfield orijinal vektörlerini içeri alma (runbook)

`public/brand/logo` ve `public/brand/icons` altındaki SVG'ler şu an **spesifikasyona
sadık elle çizilmiş** recreate'ler. Higgsfield'da üretilen **orijinal** 13 vektörü
(5 logo + 8 ikon) yerine koymak için:

## Ön koşul — ağ egress allowlist
Bu yürütme ortamı host bazlı egress allowlist kullanıyor. Şu host'lar **eklenmeli**
(Claude Code on the web → ortam ağ ayarları), sonra **yeni bir oturum** başlat
(çalışan konteyner eski politikayı taşır):

- `d8j0ntlcm91z4.cloudfront.net` — Higgsfield CDN (orijinal `.svg` üretimleri)
- `at.adobe.com` — Adobe upload (Express aktarımı için)

Rehber: https://code.claude.com/docs/en/claude-code-on-the-web

## Adımlar (allowlist canlıyken)
```bash
# 1) Orijinalleri çek + ivory arka planı şeffaflaştır
node scripts/fetch-higgsfield-vectors.mjs            # public/brand/higgsfield/ (raw/ = ham)
#    İncele; iyiyse recreate'lerin üzerine uygula:
node scripts/fetch-higgsfield-vectors.mjs --apply    # public/brand/{logo,icons}/*.svg

# 2) Panoyu yeniden üret
node scripts/build-brand-guidelines.mjs              # public/brand/jade-gold-nyc-guidelines.html
```

## Adobe Express aktarımı (orijinal pano fotoğrafları gömülü olduğu için)
Pano ~871 KB (foto base64). Importer ne bu boyutu satır-içi ne de `vercel.app`/CDN
host'unu kabul ediyor. Çözüm: pano fotoğraflarını Adobe'a yükleyip HTML'i Adobe
host'lu URL'lerle küçültmek (`at.adobe.com` allowlist'te olmalı), sonra
`export_html_to_express`. Bu adımı Claude yeni oturumda yürütür.

## Pinlenmiş üretimler (recraft_v4_1)
| Hedef | Higgsfield dosyası |
|---|---|
| `logo/logo-primary` | `…_093843_926a6128….svg` |
| `logo/logo-wordmark` | `…_100956_091a4a60….svg` |
| `logo/logo-stacked` | `…_100841_6a6b9c80….svg` |
| `logo/monogram-jg` | `…_093815_f9d9622c….svg` |
| `logo/seal-badge` | `…_101057_7fff393b….svg` |
| `icons/icon-shield` | `…_102422_7a0fc878….svg` |
| `icons/icon-monogram` | `…_102308_ddd53cbe….svg` |
| `icons/icon-loupe` | `…_102155_1fd8aaa7….svg` |
| `icons/icon-diamond` | `…_102111_fbaba0cd….svg` |
| `icons/icon-chain` | `…_102038_e37af9a4….svg` |
| `icons/icon-skyline` | `…_102002_d99bfc42….svg` |
| `icons/icon-ring` | `…_101918_fffad31d….svg` |
| `icons/icon-column` | `…_101855_dd6c53b2….svg` |

> Not: “son 13 üretim” değişmişse `show_generations` ile güncel URL'leri alıp
> `scripts/fetch-higgsfield-vectors.mjs` içindeki eşlemeyi güncelle.

## Yüksek çözünürlüklü PNG render
Web ortamında tarayıcı yok; PNG için **masaüstü Claude Code** oturumu gerekir
(yerel tarayıcı + dosya sistemi). Orada `build-brand-guidelines.mjs` çıktısı
headless tarayıcıyla rasterize edilip PNG üretilebilir.
