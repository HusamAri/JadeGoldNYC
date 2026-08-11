# Lintel video QA — yapay-görünüm testi (2026-08-11)

Kullanıcı kuralı: **yeni video üretimi YOK.** Bu rapor mevcut 18 videonun
kare-kare incelemesidir; karar "kullan / kullanma"dır, yeniden üretim değildir.

## Yöntem

1. 18 MP4 indirildi (Higgsfield CDN), her birinden 4 kare çekildi
   (t=0 / 2.5 / 5 / 7.8sn) + referans görselle yan yana kontrol sayfası.
2. Her sayfa gözle incelendi: ürün geometrisi/dokusu sadakati, metal rengi,
   el anatomisi, yapay parlama/doku, loop kapanışı.
3. Sayısal destek (gri-ton ortalama piksel farkı, 0=aynı):
   `ref↔t0` (referans sadakati), `t0↔t7.8` (loop), `t0↔t5` (hareket miktarı).

## Kararlar

### Konsept A — ürün orbit (listing galerisi adayı)

| Video | Karar | Not |
| --- | --- | --- |
| A-gld1008 | ✅ KULLAN | Temiz orbit, geometri sabit, loop iyi (7.1) |
| A-whg1008 | ✅ KULLAN | İçerik temiz; loop orta (39.8 — dönüş ortasında bitiyor) |
| A-rsg1008 | ✅ KULLAN | Kompozisyon ref'ten oynamış (24.5) ama doğal duruyor |
| A-gld1408 | ❌ KULLANMA | Ref'i ilk kareden terk etti (71.3!) + yapay yıldız parlamaları — "AI reklam" görünümü |
| A-whg1408 | ✅ KULLAN | Ref sadık, dolly temiz, loop iyi (7.6) |
| A-rsg1408 | 🟡 SINIRDA | Zeminde dokuma deseni kendiliğinden belirdi; yüzük stabil — kullanılabilir |
| A-gld1808 | ✅ KULLAN | Ahşap sahne tutarlı, loop iyi |
| A-whg1808 | ✅ KULLAN | En iyi orbitlerden; metal beyaz kaldı |
| A-rsg1808 | 🟡 SINIRDA | Neredeyse STATİK (hareket 3.5) — yapay değil ama video değeri düşük |

### Konsept B — elde (reklam/yedek adayı)

| Video | Karar | Not |
| --- | --- | --- |
| B-gld1008 | ✅ KULLAN | Tek sağlam el videosu: anatomi doğal, ürün sadık |
| B-whg1008 | ❌ KULLANMA | t=5'te cilt dokusu deri-gözenek yapaylığına dönüyor |
| B-rsg1008 | ❌ KULLANMA | t=5 makroda ürün PROFİLİ değişiyor (çift yiv görünümü) |
| B-gld1408 | ❌ KULLANMA | Satine merkez kayboldu (tam parlak yüzük) + eklem anatomisi bulanık |
| B-whg1408 | ❌ KULLANMA | t=2.5 parmaklar doğal dışı uzuyor; satine doku sıva gibi |
| B-rsg1408 | ❌ KULLANMA | t=5 parmak kaynaşması — en belirgin anatomi hatası |
| B-gld1808 | ❌ KULLANMA | Yüzükte patlamış parlama blob'u + parmak kalabalığı |
| B-whg1808 | ❌ KULLANMA | Düz el sebepsiz yumruğa dönüyor; beyaz altın SARIYA kaydı |
| B-rsg1808 | ❌ KULLANMA | Yüzük somon-pembeye kaydı, satine merkez kayboldu |

## Sonuç

- **Kullanılabilir: 8/18** (7 Konsept A + B-gld1008).
- 9 listing'in **8'i** için galeri videosu var; **GLD-R-1408 videosuz kalır**
  (A'sı da B'si de reddedildi — yeniden üretim kural gereği YOK).
- Ders: ürün-orbit üretimi güvenilir (%78 geçer), el/insan üretimi değil
  (%11 geçer). El görüntüsü gerekiyorsa AI video yerine gerçek çekim.
- Kontrol sayfaları scratchpad'de (`vid/sheets/*.jpg`) — konteynerle ölür;
  karar kaydı bu dosyadır. Video URL'leri Higgsfield galerisinde, job id'ler
  `video-plan.md`de.
