# Artifact Studio Instagram: ilk 5 gönderi (2026-10-14)

Kaynak dosya `posts.py`. `render.py` görselleri (`out/`), `captions.py` metni
(`captions.md`), `video.py` reel kurgusunu (`out/P1|P5/reel.mp4`) üretir.
Videolar sahibin onayıyla üretildi (2026-10-14, seedance_2_5, count 1, 2 × 80 kredi;
`video/jobs.json`). Reel'ler sessiz: Instagram'da trend ses uygulama içinde eklenir.

QA: V1'de antenler tek parça, gövde halkası ve bail korunuyor; V2'de 5 yaprak,
orta damarlar ve boncuklu göbek korunuyor (ilk ve son kare listing görseliyle karşılaştırıldı).

## Araştırmadan çıkan 5 kural

| Bulgu | Kaynak | Bu sette nasıl uygulandı |
|---|---|---|
| 1.000 takipçi altı hesapta Reels medyan 134 görüntüleme, carousel 56, tek görsel 23. Yeni hesapta erişim Reels'ten gelir. | Metricool + HypeAuditor (700M gönderi), [Contentdrips](https://contentdrips.com/blog/2026/06/instagram-reels-vs-carousels-2026-guide/) özeti | 5 gönderinin 2'si Reel ve ilk paylaşılan Reel |
| Carousel tek görselden 9 kat fazla kaydedilir; Q2 2026'da en yüksek etkileşimli format carousel (%0,50, Reels %0,48). | [Metricool 2026](https://metricool.com/press-release-instagram-study-2026/), [Socialinsider](https://www.socialinsider.io/blog/instagram-benchmarks/) | 2 carousel: biri kaydettiren rehber (P2), biri yorum aldıran seçim (P4) |
| Mücevherde carousel, izleyicinin bir stil ya da satın alma KARARINI çözdüğünde en çok kazanıyor (Reels +%3,2, carousel +%6,9). | [Vaizle, jewelry content study](https://insights.vaizle.com/jewellery-instagram-content-strategy/) | P2 "10K, 14K or 18K?" doğrudan bu karar |
| Soru içeren gönderi %36,7 daha çok yorum alıyor; en az bir hashtag'li gönderide görüntüleme %31,7 düşük. | [Metricool 2026](https://metricool.com/press-release-instagram-study-2026/) | Her caption bir soruyla biter; gönderi başına en çok 3 etiket (`captions.py` assert eder) |
| İlk 9 kare yeni ziyaretçinin "takip edeyim mi?" vitrini; 4:5 ve tutarlı dil. Reorder Grid ile sıra sonradan değişir. | [Socialkit, first 9](https://socialk.it/en/blog/instagram-first-9-grid-strategy), [Hopper](https://www.hopperhq.com/blog/how-to-rearrange-instagram-grid/) | Tüm feed kareleri 1080x1350; Reel kapaklarının metni orta 4:5 kırpımda kalır |

Sınır: veriler çoğunlukla satıcı araştırması ve sektör geneli; mücevher
çalışması yalnız görünür beğeni/yorumu ölçüyor. Yön göstergesi, satış kanıtı değil.

## Paylaşım sırası

| # | Gönderi | Format | Görev | Durum |
|---|---|---|---|---|
| 1 | P1 Openwork Moth | Reklam reel 12 sn (`out/P1/reel.mp4`) | Erişim | AD1 onayı bekliyor |
| 2 | P2 10K, 14K or 18K? | Carousel 6 | Kaydetme | Hazır |
| 3 | P3 Twig and Baroque Pearl | Tek görsel | Grid'e nefes, kış rengi | Hazır |
| 4 | P4 Pick a charm | Carousel 10 | Yorum | Hazır |
| 5 | P5 Poinsettia Necklace | Reklam reel 12 sn (`out/P5/reel.mp4`) | Erişim + hediye sezonu | AD2 onayı bekliyor |

Moth ve Twig yayında (sahip, 2026-10-14). Reel kuralı (sahip, 2026-10-14): reel YALNIZ
video olur ve tek ürünü tanıtan reklam videosudur; durağan kare kurgusu kullanılmaz.
İlk turdaki V1/V2 (5 sn) + kare kurgusu bu yüzden kaldırıldı; `video/jobs.json` kaydı durur.
Teslim: `python3 docs/artifact-studio/instagram/package.py <zip>` paylaşım sırasıyla zip kurar.

## Doğrulanan iddialar

- Karat yüzdeleri: 10K %41,7, 14K %58,5, 18K %75,0.
- "Nine golds" yalnız Moth ve Twig için yazıldı: katalogda 115 listing tam
  3x3 ızgara, 96'sının Karat özelliği yok, yani "her parça" denemez.
- Enamel metni katalogdan: "vitreous enamel, glass fused to gold, set flush";
  katalogda geçmeyen "hand-filled" kullanılmadı.
- FW26/27'de 8 motifin 8'i yüzük, küpe, kolye, bileklik olarak var (P4 caption'ı).
- P2/05'te karat yazılmadı: görselden ayar okunamaz.

## Yeniden üretim

```bash
python3 docs/artifact-studio/instagram/render.py <font_dizin>   # repo kökünden
python3 docs/artifact-studio/instagram/captions.py
python3 docs/artifact-studio/instagram/video.py     # reel kurgusu, video/V1.mp4 + V2.mp4 gerekir
```
Font dizini Pinterest setiyle aynı (`cormorant.ttf`, `cormorant-italic.ttf`, `plexmono.ttf`).
