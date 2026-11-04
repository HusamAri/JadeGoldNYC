# Amuletta 2.0 — uygulama planı (2026-11-04)

Sahibin isteği: panel yalnız üç iş için kullanılıyor: (A) muhasebe, (B) yeni
listing önerilerini Etsy'ye göndermek, (C) listing stok ve fiyat düzenlemesi.
Diğer her sekme ve içerik kalkar. Görsel dil: koyu yeşil + açık olive hibrit
soft UI, her ana bölüm ayrı editoryal tonda, cömert boşluk, odaklanması kolay
tablolar, doğal 3D gölgeli grafikler. Araştırma: `research-ux.md`,
`research-soft-ui.md`, `inventory.md`.

## 1. Bilgi mimarisi: 3 iş + Ayarlar

| Nav grubu (ton) | Rotalar (kalır) | Birincil buton |
|---|---|---|
| **Satış & Kâr** (moss) | `/satislar`, `/satislar/[id]`, `/satislar/maliyet` (+export), `/satislar/ice-aktar`, `/satislar/yeni`, `/maliyetler/**`, `/raporlar` | Etsy'den satışları çek (maliyet sayfası şeridi) |
| **Etsy'ye Taslak** (lichen) | `/listing-onerileri`, `/tasarimlar` (liste), `/tasarimlar/listing/yeni`, `/tasarimlar/listing/[id]` | Etsy'ye gönder |
| **Stok & Fiyat** (forest) | `/stok`, `/stok/varyant`, `/fiyat`, `/tasarimlar/{eksik-agirlik,etsy-agirlik,varyant-hesapla}` | Fiyatı Etsy'ye it |
| **Ayarlar** (slate-green) | `/ayarlar` (hub), `/ayarlar/{etsy,altin,shipstation,ekip,profil}`, `/kayitlar` (hub içinde "Şirket hafızası") | yok |
| Ana sayfa (`/panel`, olive) | Dikkat listesi (≤5, paraya göre) + 4 aksiyon sayısı + kaynak başına "veri şu ana kadar" + gelir/maliyet trendi + maliyet dağılımı çubuğu | yok |

Silinen rota, bileşen, kütüphane ve API listesi `inventory.md`de; silme
PR'ında her kalem commit mesajında adlandırılır. `api/ops/*`, üç cron ve
`api/notifications` dokunulmaz.

## 2. Tema token'ları (`app/globals.css`)

- Taban: `--surface` açık `oklch(0.93 0.025 115)`, koyu `oklch(0.27 0.035 155)`.
  Sayfa zemini == kart zemini (soft UI şartı).
- Gölge çifti relative color ile türetilir:
  `--nm-light: oklch(from var(--surface) calc(l + 0.055) c h)`,
  `--nm-dark: oklch(from var(--surface) calc(l - 0.15) c h)`; blur = 2 × offset;
  ışık sol üst; koyu modda yeniden ayar (asla tersleme).
- Bölüm tonu tek değişken: `[data-tone=moss|olive|forest|lichen|slate]`
  layout düzeyinde `--surface`i değiştirir, gölgeler kendiliğinden izler.
- Metin: açık `oklch(0.28 0.06 150)` / `oklch(0.46 0.05 150)`; koyu
  `oklch(0.94 0.02 120)` / `oklch(0.76 0.03 130)`. Hepsi 5,4:1 üstü, tüm tonlarda.
- Altın: dolgu `oklch(0.74 0.14 85)` yalnız KPI vurgusu/çizgi; metin olarak
  açıkta `oklch(0.50 0.10 80)`, koyuda `oklch(0.82 0.13 88)`.
- Hairline `≥3:1` her kontrolde (girdi, birincil buton, tablo başlığı):
  açık `oklch(0.60 0.04 120)`, koyu `oklch(0.55 0.04 150)`.
- Yarıçap 12 (girdi) / 16 (kart) / 20 (bölüm); `--motion-*` ve `--ease-*`
  token'ları kalır; holo palet, `holo-drift`, `lux-grain`, `frost-*`, `jg-*`
  dekoratif aile, GoldStream, SceneCutouts, SleepingBoxes, EditorialCard
  kaldırılır.
- Grafik: `--chart-ink` bölüm tonundan; gölge filtresi tek `<defs>` (ambient
  `dy=6 sd=8` + kontak `dy=1 sd=1`, bölüm tonlu, siyah değil);
  `prefers-reduced-motion`da filtre kapalı.

## 3. Tablolar ("odaklanması kolay")

- Tablo düz inset kuyuda; kabarık işlem yalnız araç çubuğu/filtre/sayfalama.
- Sayılar sağa, `tabular-nums`, tutarlı ondalık; başlık + ilk kolon sabit;
  tek ince ayraç, ızgara yok; sessiz hover; odak halkası.
- Satış & Maliyet ızgarası: varsayılan 9 kolon (ürün, tarih, adet, net gelir,
  altın, işçilik, taş, net kâr, marj); kalan 10 "Kolonlar (10 gizli)" ile açılır;
  satır genişletme = tüm dağıtımlar.
- Inline edit: Enter kaydeder, Esc iptal, hücrede "Kaydedildi ✓" + düzenleme
  ikonu; aktif hücre kabarık, yazılınca inset.
- Telefon: ilk kolon kilitli, seçilmiş alanlarla kart görünümü.

## 4. Sıra ve durum (2026-11-04)

Üçü de aynı dalda, ayrı commit'lerle bitti (PR #491): budama `5ca4375`,
tema `fc395a3`, tablo/grafik/ana sayfa bu commit. Doğrulama Next yerine
`scripts/theme-lab` (gerçek Tailwind derlemesi + Playwright kontrast ölçümü)
ve Vercel preview ile yapıldı; `/dev/tema` rotası yalnız geliştirmede açılır.


1. **Budama PR'ı** (inventory.md): rotalar, bileşenler, lib, api, env, nav,
   uyarı türleri, oturum popup'ı. Typecheck + lint + mevcut testler; Vercel
   preview yeşil.
2. **Tema PR'ı**: token'lar, bölüm tonu, nm sınıfları yeniden ayar, dekoratif
   katmanların sökümü, kart/buton/girdi hairline. Playwright açık/koyu ekran
   görüntüsü + computed contrast kontrolü.
3. **Tablo ve grafik PR'ı**: ızgara kolon modeli, inline edit sözleşmesi,
   ChartDefs gölge filtresi, ana sayfa yeniden kurulumu.

Her PR ayrı; 1 bitmeden 2 başlamaz (silinen kodun teması yazılmaz).

## 5. Amuletta 3.0 · V7 (2026-11-04, PR #492)

Sahip 2.0'ın yeşil/olive temasını reddetti ("renkler çok kötü, görünüş aynı")
ve yedi mockup turundan sonra **V7**'yi onayladı
(`scripts/theme-lab/directions/editorial.html` `#V2` bloğu = V7).

**Palet:** sis grisi zemin `#E9EBEF`, mürekkep `#1B1E26`, ikincil `#515665`,
sessiz `#8C92A1`, hairline `#C7CCD6` / `#D9DDE4`; TEK vurgu asit `#D8F53C`
(metin için `--neon-ink`); tozlu mavi `#AEB6D2` / `#7F89B3` yalnız dekor
kartında (`.gcard`, sayfa başına en çok bir). Zarar kil `#B5473A`. Bölüm
tonları sisin içinde ±0.004 kroma kayar; palet tek kalır.

**Tipografi:** Fraunces 300 / opsz 144 (başlık, defter rakamı, son kelime
italik), Inter Tight (gövde), JetBrains Mono (index etiketi, LCD, tablo
sayısı; 0,12–0,2em tracking, uppercase).

**Malzeme kuralı:** her yüzey düz ve hairline'lı; cam yok. Neumorph YALNIZ
göstergelerde yaşar: `.bezel` (dört vidalı çerçeve), `.screen` (tarama
çizgili koyu cam) + `.lcd`/`.dim`, `.fm` (kadran + asit iğne), `.knob`
(`--deg` ile döner), `.seg` (inset ray + kabarık aktif). Serpiştirilmiş
istisnalar: aktif nav satırı (`.toc-n.on`), Dikkat satırları (`.inset-row`),
kahraman CTA (`.cta-pill`). Bileşenler: `components/instruments`.

**Yapı kuralı (tema aynı, iskelet farklı):**

| Bölüm | Arketip | Ayırt edici parça |
|---|---|---|
| Panel | kumanda paneli | dört aksiyon sayısı dört farklı gösterge (LCD, halka, mekanik sayaç, dekor kartı) |
| Satış & Maliyet | defter | hairline band (tuner · gelir · COGS · dekor), düz defter tablosu, osiloskop + marj düğmesi |
| Etsy'ye Taslak | galeri | görsel ağırlıklı kartlar, sağda kuyruk rayı (tek halka); Listeler'de dekor bandı + kare ızgara |
| Stok & Fiyat | kumanda masası | solda yapışkan ekran + düğmeler + segment, sağda yoğun düz ızgara / konsol |
| Ayarlar | düz liste | kimlik satırı + iki hairline liste, canlı bağlantı asit nokta |

**Doğrulama:** Next konteynerde çalışmaz; `node scripts/theme-lab/compile.mjs`
(gerçek Tailwind v4) + `lab.html` (defter sayfasının gerçek sınıf dizeleri)
+ Playwright açık/koyu çekim ve WCAG ölçümü. Son ölçüm: metin 13,8–14,1:1,
ikincil 6,3–6,5:1, tablo başlığı 4,3–4,4:1, zarar 5,4–5,6:1 (açık); koyuda
hepsi ≥5,8:1. Kontrol kenarı (`--hairline`) ≥3:1; dekoratif `--rule`
çizgileri bilerek daha açık.

**Açık borç:** 38 dosya hâlâ `nm-raised/nm-pressed/glass-*` sınıfı taşıyor
(alt sayfalar: satış detayı, listing paneli, maliyetler, yorumlar, raporlar).
Token'lar nötrlendiği için düz görünürler; V7 yapısına taşınmaları ayrı tur.
