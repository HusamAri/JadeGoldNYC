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
