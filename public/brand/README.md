# Marka Görselleri — Jade Gold NYC

Bu klasördeki görseller panelde **Giriş ekranı** ve **Marka Görsel Kimliği**
(`/tasarimlar`) sayfasında kullanılır. Galeri görselleri **gerçek ürün
çekimleridir**: mağazanın referans ürün fotoğraflarından üretilip burada
**yerel** olarak (WebP) barındırılır. Dosya yoksa panel zarif bir
**jade→altın degrade** gösterir (kırık görsel olmaz).

Kaynak listesi `lib/brand-assets.ts` → `BRAND_GALLERY` (4 grup). Bir görseli
değiştirmek için aynı adla yeni bir `.webp` koyman ya da `src`/`caption`'ı
düzenlemen yeterli.

## Giriş ekranı
`BRAND_LOGIN_HERO` hâlâ Higgsfield CDN'inden servis edilir (bkz. `lib/brand-assets.ts`).
Yerele almak istersen `brand/login-hero.webp` ekleyip sabiti `/brand/login-hero.webp` yap.

## Galeri — `brand/gallery/` (12 görsel, 4 grup)

### Aydınlık · Krem & Keten
| Dosya | Görsel |
|---|---|
| `aydinlik-cuban.webp` | Miami Cuban bileklik · krem keten |
| `aydinlik-nugget.webp` | Nugget yüzük · krem mermer |
| `aydinlik-malgoz.webp` | Mal göz halat kolye · keten + zeytin |

### Koyu · Lav Taşı & Slate
| Dosya | Görsel |
|---|---|
| `koyu-franco.webp` | Franco zincir · lav taşı |
| `koyu-paperclip.webp` | Paperclip zincir · slate |
| `koyu-jesus.webp` | Jesus face yüzük · lav taşı |

### Model · Yaşam Tarzı
| Dosya | Görsel |
|---|---|
| `model-hamsa.webp` | Hamsa kolye · boyun |
| `model-dome.webp` | Dome band yüzük · el |
| `model-bamboo.webp` | Twisted bamboo halka küpe · kulak |

### NYC · Bağlam
| Dosya | Görsel |
|---|---|
| `nyc-horn.webp` | Italian horn · Little Italy |
| `nyc-butterfly.webp` | Butterfly pendant · krem taş |
| `nyc-rosary.webp` | Rosary kolye · katedral ışığı |

Boyut: galeri görselleri 4:5, ~1000px genişlik, WebP q80 (~40–145 KB/görsel).

---

## Logo sistemi — `brand/logo/` (vektörel, şeffaf arka plan)

Tümü **SVG** (ölçeklenebilir, arka planı **şeffaf**), tek renk **antik altın `#B89347`**.
Higgsfield'da üretilen logo sisteminin spesifikasyonuna (palet + geometri) birebir
sadık şekilde elle yeniden çizildi.

| Dosya | Mark |
|---|---|
| `logo/logo-primary.svg` | Birincil kilit: **JADE GOLD** + ince çizgi + **NYC** |
| `logo/logo-wordmark.svg` | Tek satır kelime markası **JADE GOLD** |
| `logo/logo-stacked.svg` | İstifli **JADE / GOLD / NYC** + kural çizgisi |
| `logo/monogram-jg.svg` | İç içe geçmiş **JG** monogramı |
| `logo/seal-badge.svg` | Dairesel mühür: “JADE GOLD · NEW YORK CITY” + merkezde JG |

> **Not (Higgsfield orijinalleri):** Higgsfield CDN host'u
> (`d8j0ntlcm91z4.cloudfront.net`) bu yürütme ortamının **ağ egress allowlist**'inde
> olmadığı için orijinal `.svg` üretimleri indirilemedi (sandbox **ve** Adobe
> connector ikisi de host'u reddetti). Host allowlist'e eklenirse birebir
> Higgsfield vektörleri bu dosyaların yerine konabilir.

## İkon seti — `brand/icons/` (8 çizgi ikonu, şeffaf)

Tek ağırlıkta ince çizgi (stroke `#B89347`), 24×24 viewBox, dolgusuz.

`icon-monogram` · `icon-diamond` · `icon-chain` · `icon-ring` ·
`icon-skyline` · `icon-column` · `icon-loupe` · `icon-shield`

## Marka kılavuzu sayfası — `brand/jade-gold-nyc-guidelines.html`

Tek-tuval (1728×1152) **marka kılavuz panosu**, kendi içinde bütün (fontlar Adobe
Fonts/Typekit, logolar inline SVG, fotoğraflar base64 gömülü). Referans görselden
**bilgiler çıkarılıp yeniden** kuruldu; **“brand aesthetic / brand voice”** bölümü
kaldırıldı, fotoğraflar panoya estetik biçimde dağıtıldı, logo + mühür gerekli
yerlerde kullanıldı.

- **Tipografi:** Meno Banner (yüksek kontrast Didone başlık) + ITC Avant Garde
  Gothic (geometrik sans — logo/etiket/gövde).
- **Palet:** Altın `#B89347` · Krem `#F2EFE6` · Taş `#A39F94` · Jade `#3F4A44` · Kömür `#131313`.
- **Bölümler:** Logo System · Colour · Typography · Submarks & Stamps · Iconography · Photography.
- Üretici: `scripts/build-brand-guidelines.mjs` (`node scripts/build-brand-guidelines.mjs`).

Uygulama dağıtıldığında pano `/(…)/brand/jade-gold-nyc-guidelines.html` yolundan
servis edilir; dosya kendi içinde bütün olduğu için tarayıcıda da doğrudan açılır.
