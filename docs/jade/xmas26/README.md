# Jade Gold NYC · Noel 2026 · 40 yeni listing

10 bileklik (B1–B10), 10 kolye (N1–N10), 10 küpe (E1–E10), 10 broş (P1–P10). Hepsi 14K sarı
altın; mine (ice-blue / deep jade-green / deep berry + nazar lacivert/beyaz) ya da küçük
lab-grown taşlarla. Her parça atölye gerçekliğinden geçti (tezgâh sırası, BOM, arıza modları,
tolerans), Jade fiyat motoruyla fiyatlandı, Etsy metni yazıldı, hero görseli üretildi ve kalan
15 karenin promptu Etsy'deki amacıyla birlikte hazırlandı.

Sahibe teslim yüzeyi **`image-book.html`** (Artifact olarak da yayınlandı). Bu klasördeki her
şey o sayfayı üreten kaynaktır.

## Boru hattı (sırayla, hepsi `python3 -I` ile koşar)

| Adım | Dosya | Girdi → Çıktı |
|---|---|---|
| 0 | `work/evidence.json`, `work/evidence_summary.json` | Web araştırması: mineli 14K döküm, flush taş yuvası, broş iğnesi, küpe post'u (kaynaklar içinde). |
| 1 | `work/reality_<KAT>.json` | Kategori başına 10 tasarım + bağımsız doğrulayıcı (CAD düzeltmeleri `required_changes`). |
| 2 | `work/copy_<KAT>.json` · `manual_copy.py` | Etsy metni. Bileklik/küpe ajan yazdı; kolye/broş haftalık limit yüzünden `manual_copy.py` ile elle yazıldı. |
| 3 | `assemble.py` | `work/copy_*.json` + `work/fixes.json` → `spec.json`; uygulanan düzeltmeler `work/applied.json`. |
| 4 | `catalog.py` | `spec.json` → `catalog.json` (fiyat + Etsy kapıları, 40/40 assert). |
| 5 | `prompts.py` | `catalog.json` → `prompts.json` (40 × 16 kare) + `images/jobs.json` (hero işleri, parametreler sabit). |
| 6 | Higgsfield | `images/jobs.json` prompt'ları birebir gönderildi → `images/heroes/raw/<ID>.png` (git dışı). |
| 7 | `heroes.py` | raw → `images/heroes/<ID>.jpg` (Etsy, meta sıyrılmış, <1 MB) + `images/heroes/crops/<ID>.jpg` (02–16 için TEK referans) + `web/<ID>.jpg` (1600 px). |
| 8 | `review.py` → `images/heroes/status.json` | Her hero için `ok` / `check` / `redo` + sebep + düzeltilmiş prompt (saklanan prompt'tan assert'li `replace` ile türetilir). Kontak baskısına bakılarak `review.py` içinde elle yazılır. Sahibin kendi ürettiği hero `images/heroes/raw/<ID>.png` olarak konur, 7 yeniden koşulur. |
| 9 | `page.py` | `catalog.json` + `prompts.json` + `status.json` + `jobs.json` → `image-book.html`. |
| 10 | `maker_book.py` | `catalog.json` + `work/evidence_summary.json` + `status.json` → `Jade-Noel-2026-Uretici-Kitabi.pdf` (üreticiye giden teklif kitabı: perakende fiyat YOK; görsel notları; bundled Chromium ile basılır). |

Yeniden üretmek için 3 → 4 → 5 → 9 → 10 yeterlidir; 6–8 yalnız görsel değişince.

## Fiyat

`lib/jade/pricing.ts` birebir aynalanır (`catalog.py` üstü): `cost = round(g × 10600) + 500 + 150`,
`list = ceil((cost + 25) / (0.75 × (0.905 − 0.25)) / 100) × 100`, ödenen = list × 3/4. Yalnız
**altın gramı** fiyatlanır; mine ve taş gram hesabına girmez. $106/g tedarikçinin her şey dahil
14K oranı: ayrı işçilik satırı yok, doğrulanmış 18K oranı yok → 40 parçanın hepsi 14K.

## Görsel kuralları

- Model `nano_banana_2_1`, oran 4:3, çözünürlük **`2k` açıkça geçilir** (varsayılan 1k, 2026-10-13
  dersi), düşünme `high`, adet 1, seed `20261200 + indeks`. 2 kredi/kare, çıktı 2400 × 1792.
- Batch'te 7'den fazla eşzamanlı gönderim `429 rate_limit` düşürür; iş açılmaz, kredi yanmaz,
  küçük grupla yeniden gönderilir.
- Hero referanssız; 02–16 kareleri o ürünün `crops/<ID>.jpg` kırpımını tek referans alır
  (tam hero referans verilirse kadrajı da gelir, 2026-09-27 dersi).
- QA: boyut + tekil hash kapıları, sonra kontak baskısı (kategori başına 8'li) ve şüpheli
  karelerde 1100 px merkez kırpımı; sonuç `status.json`.

## Açık sorular (sahibe)

1. Mineli parçalar için tedarikçinin gram-dışı mine fiyatı yok; `$106/g` her şey dahil kabul
   edildi. İlk siparişte bir kupon parça ile fırınlanmış mine (zinc-free 14K, ≤790 °C) denenmeli.
2. Fırınlı mine olmazsa soğuk mine (epoksi) düşüşü: açıklamalarda beyan cümlesi hazır
   (`work/evidence.json` → `cold_enamel_disclosure`), kullanılırsa `manual_copy.py`/`fixes.json` ile basılır.
3. Küpe arkalıkları ~0,25 g varsayım; zincir gramları üretici tablosundan değil hesaptan. Tartım gelince
   `spec.json` gramları güncellenir, 4 → 5 → 9 koşulur.
4. Doğrulayıcının CAD değişiklikleri (`work/reality_*.json` → `required_changes`) açıklamaya girdi
   ama çizime girmedi; üretim öncesi çizimde uygulanmalı.

## Bu turun dersi

`docs/second-brain.md`, 2026-10-18 "Noel 40" bloğu.
