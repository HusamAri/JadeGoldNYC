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

## 4. Sıra

1. **Budama PR'ı** (inventory.md): rotalar, bileşenler, lib, api, env, nav,
   uyarı türleri, oturum popup'ı. Typecheck + lint + mevcut testler; Vercel
   preview yeşil.
2. **Tema PR'ı**: token'lar, bölüm tonu, nm sınıfları yeniden ayar, dekoratif
   katmanların sökümü, kart/buton/girdi hairline. Playwright açık/koyu ekran
   görüntüsü + computed contrast kontrolü.
3. **Tablo ve grafik PR'ı**: ızgara kolon modeli, inline edit sözleşmesi,
   ChartDefs gölge filtresi, ana sayfa yeniden kurulumu.

Her PR ayrı; 1 bitmeden 2 başlamaz (silinen kodun teması yazılmaz).
