# Amuletta 2.0 — Soft UI (neumorphism) araştırma özeti (2026-11-04)

Kaynak notu: 2026'nın en sağlam iki pratisyen referansı Setproduct'ın neumorphism
rehberi (2026-06-26) ve Superdesign'ın neumorphism sayfası. Doğrulanamayanlar
işaretlendi.

## 1. 2025-2026 pratiği ("hibrit neumorphism")

- Çift gölge kalır ama gölge dışı ipuçları zorunlu: birincil butonda 1px vurgu
  kenarlığı veya etiket, girdi alanları yalnız inset + `:focus-visible`te görünür
  vurgu kenarlığı, 2px odak halkası, açık/kapalı durum gölgeyle değil renkle,
  gövde metni 16px ve üstü, gövde için 7:1 hedef (4,5:1 taban).
  https://www.setproduct.com/blog/neumorphism-design-guide
- Kenarlık neden şart: klasik tarifte kenar kontrastı ~1,4:1; WCAG 2.2 SC 1.4.11
  bileşen sınırı için 3:1 ister. Gölgeyi o kadar sertleştirmek görünümü öldürür;
  çözüm düz yüksek kontrastlı CTA + odak çizgisi + ikon/etiket durum ipucu.
  https://superdesign.dev/styles/neumorphism ·
  https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Referans tarif (açık): yüzey `#e0e5ec`, kabarık `-8px -8px 16px #fff, 8px 8px
  16px #a3b1c6`; basılı `inset 6px 6px 12px koyu, inset -6px -6px 12px açık`;
  `transition: box-shadow 160ms`. Koyu mod: taban `#2a2d32`, parlak taraf beyaz
  değil açık gri, gölge siyah değil koyu gri, **tersine çevirme, yeniden ayarla**.
  Blur ≈ 2 × offset. Işık daima sol üst.
- Köşe yarıçapı: 12-20px (girdi 12-16, kart 16-20); claymorphism 24-32px.
- Gölge rengini tabandan türet: Chrome ve MDN OKLCH relative color önerir:
  `oklch(from var(--surface) calc(l - 0.12) c h / .9)`.
  https://developer.chrome.com/blog/css-relative-color-syntax ·
  https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors
- "Soft UI 2.0": daha keskin, tanımlı gölgeler; güçlü highlight; seçici
  kullanım (kontrol ve kart); cam yüzeylerle harmanlama.
- **Kullanılmayacağı yer (açıkça):** veri yoğun tablo ve pano, uzun okuma,
  çok alanlı form, düşük görme. Soft UI *kabuk*tur (nav, kart, KPI, kontrol),
  *veri yüzeyi* değil. https://builtin.com/design-ux/neumorphism-accessibility
- Üreteçler: https://neumorphism.io/ · https://hype4.academy/tools/neumorphism-generator

## 2. Token tarifi: koyu yeşil + olive (OKLCH; WCAG 2 oranları, sRGB)

**Açık ("sage paper")**
- `--surface: oklch(0.93 0.025 115)` #e7ead8 (sayfa == kart, şart)
- `--shadow-hi: oklch(0.985 0.012 115)` #fafbf2 · `--shadow-lo: oklch(0.78 0.04 115)` #b6bb9e
  → `box-shadow: -8px -8px 16px hi, 8px 8px 16px lo`; basılı `inset 5px 5px 10px lo, inset -5px -5px 10px hi`
- `--text: oklch(0.28 0.06 150)` #0f3118 → 11,7:1 · `--text-2: oklch(0.46 0.05 150)` #446049 → 5,7:1
- `--hairline: oklch(0.60 0.04 120)` #7d8469 → 3,2:1 (1.4.11 için; girdi, birincil buton, tablo başlığı)
- Altın: `--gold-fill: oklch(0.74 0.14 85)` #d3a329 (1,9:1, yalnız dolgu/çizgi/KPI vurgusu, asla metin);
  `--gold-text: oklch(0.50 0.10 80)` #815c0a → 5,0:1; `--gold-ring: oklch(0.58 0.12 80)` #9f7100 → 3,6:1 odak halkası.

**Koyu ("deep green")**
- `--surface: oklch(0.27 0.035 155)` #182c1f · `--shadow-hi: oklch(0.34 0.04 155)` #273e2f · `--shadow-lo: oklch(0.16 0.03 155)` #031108
- `--text: oklch(0.94 0.02 120)` #e9eddf → 12,5:1 · `--text-2: oklch(0.76 0.03 130)` #abb5a1 → 7,0:1
- `--gold: oklch(0.82 0.13 88)` #e7bf57 → 8,5:1 (koyuda metin olarak güvenli) · `--hairline: oklch(0.55 0.04 150)` #617865 → 3,1:1

**Editoryal bölüm tonları** (aynı L, yalnız ton kayması; metin token'ları
hepsinde geçer, en kötü 5,4:1):
- Satış = moss `oklch(0.93 0.04 130)` / koyu `oklch(0.27 0.045 135)`
- Maliyet = olive `oklch(0.93 0.04 105)` / `oklch(0.27 0.04 110)`
- Listing = forest `oklch(0.91 0.045 150)` / `oklch(0.26 0.05 155)`
- Tasarım/öneri = lichen `oklch(0.935 0.035 92)` / `oklch(0.275 0.035 95)`
- Ayarlar = slate-green `oklch(0.925 0.015 175)` / `oklch(0.27 0.02 180)`
Her bölümün gölge çiftini relative color ile türet
(`oklch(from var(--section) calc(l + 0.055) c h)` / `calc(l - 0.15)`), böylece
ton değişimi tek değişkendir.

## 3. Soft UI'da veri yoğun tablo

- Satır yüksekliği: Carbon xs 24 / sm 32 / md 40 / lg 48 / xl 64; başlık satırı
  gövde satırıyla aynı boy; başlık 14px/600, gövde 14px/400; hover = katman
  rengi, odak = kenarlık, seçili = tint + kenarlık.
  https://carbondesignsystem.com/components/data-table/style
- 2026 rehberi: üç yoğunluk ön ayarı (sıkı/rahat/geniş); bir ekrandan uzun her
  tabloda yapışkan başlık; dondurulmuş ilk sütun + kenar gölgesi; tek ince satır
  ayracı, **tam ızgara yok**; sessiz hover; odak halkası asla yalnız renk; sayılar
  sağa; satıra sığdırmak için yazıyı küçültme; binlerin üstünde sanallaştır.
  https://www.setproduct.com/blog/data-table-ui-design
- Zebra: uzun/geniş tabloda; kısa tabloda ayraç + hover.
- Satır içi düzenleme: düzenlenebilir hücre sütunda ikonla VE hover'da ikonla
  işaretlenir; onay/iptal ikonu; hücrede doğrulama; kaydet/vazgeç her zaman.
  https://cloudscape.design/patterns/resource-management/edit/inline-edit/
- **Neumorfik kalıp okunur kalmak:** tabloyu hafif *inset* bir kuyuya koy
  (kapta tek yumuşak iç gölge), içinde düz satırlar, 1px hairline başlık;
  kabarık işlem yalnız araç çubuğu/filtre/sayfalama hapına ve aktif düzenleme
  hücresine (aktifken kabarık, yazılınca inset). Setproduct'ın "kart yumuşak,
  kontrol kenarlıklı, veri düz" ayrımı.

## 4. Doğal 3D gölgeli grafikler (SVG / Recharts)

- `<defs><filter id="shadow" height="200%"><feDropShadow dx="0" dy="10"
  stdDeviation="10"/></filter></defs>` + `<Line filter="url(#shadow)"/>`.
  Gradyan dolgu `<linearGradient>` + `fill="url(#id)"`.
  https://leanylabs.com/blog/awesome-react-charts-tips/
- Çubuk: `radius={[8,8,0,0]}`. **Doğrulanmadı:** kurulu Recharts sürümünde
  `filter` prop'unun `<Bar>`dan rect'e geçip geçmediği; güvenli yol özel
  `shape` ile `<Rectangle filter="url(#…)">`.
- "Doğal" tarif: ambient = düşük alfa, yüzey renkli `feDropShadow dy=6
  stdDeviation=8` (koyu gölge token'ıyla); kontak = ikinci sıkı gölge `dy=1
  stdDeviation=1`; üst ışık gradyanı +0,06 L. Gölgeyi bölüm tonuyla boya, asla
  siyahla.
- Performans: blur maliyeti alan × yarıçap; iç içe blur çarpar; `stdDeviation`
  animasyonu yok; grafik başına TEK filtre; `filterUnits="userSpaceOnUse"`;
  `prefers-reduced-motion`da filtre kapalı. Bu repodaki 4 FPS dersi (backdrop +
  SVG filtre yığını) geçerli. https://developer.chrome.com/blog/animated-blur/

## 5. Ödünç alınacak referanslar

- Creative Tim Soft UI Dashboard (Tailwind): düz tablo/grafik etrafında
  yumuşak kabuk, hafif kalkan KPI karoları.
- Dashon neumorphic dashboard (https://neumorph-dashboard.webflow.io/): koyu
  taban gölge kalibrasyonu, monokrom yeşil-gri üstünde tek sıcak vurgu.
- Apple Liquid Glass (iOS 26): ışığa tepki veren derinlik, metin opak yüksek
  kontrastlı katmanda.
- Setproduct demoları: hibrit bileşen kuralları.
- Superdesign Neumorphism kitaplığı: raised/flat/inset üçlüsü, koyu mod çiftleri.
- Ölü/doğrulanamayan: Nicecard (404), The Drum Machine (404), Themesberg demo (429).

**Sonuç:** kabuk = hibrit soft UI (nav, kart, KPI, buton, filtre); her kontrolde
≥3:1 hairline; tablolar düz inset kuyuda; grafik gölgeleri bölüm tonlu ve tek
paylaşımlı SVG filtresinden; tüm gölge çiftleri bölüm yüzey token'ından OKLCH
relative color ile türetilir.
