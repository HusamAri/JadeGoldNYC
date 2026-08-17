# EON İspanyolca ses tonu — bağlayıcı belge

Tarih: **2026-08-15**. Kapsam: EON mağazasının İspanyolca (`es`) çeviri katmanı —
`product_translations.lang='es'` satırları ve Etsy listing çeviri bölümü.

Bu belge iki kaynağın harmanıdır:

1. **İngilizce EON ses tonu** — `docs/eon/strategy/2026-08-12-eon-strateji-devir-code.md`
   Bölüm 11 (VOICE). İlkeler dilden bağımsızdır, birebir taşınır.
2. **İspanyolca terminoloji kararları** — `docs/eon/seo/es-keyword-matrisi.md`.
   Kanonik ifadeler arama terimini de taşır.

## Neden bu belge var

13 İspanyolca metin çok ajanlı bir workflow'la üretildi. Her ajana "kendi
partisinde tutarlı ol" dendi; kimseye "mağaza geneli tek ses" denmedi çünkü
yazılı bir İspanyolca ses tonu yoktu. Sonuç: her metin kendi içinde tutarlı,
biçim kapısı tertemiz, ama **mağaza geneli nitelikler dörde bölünmüş** —
hitap (tú/usted), marka kuyruğunun beş bölümü, ölçü birimi biçimi ve karat
büyük/küçük harfi. Hiçbiri ajanın görüş alanında değildi; hepsi ancak tüm
sette koşulan kod sayacıyla görüldü.

Kural: **bu belgede yazılı olmayan bir mağaza-geneli nitelik, üretimden sonra
kodla ölçülür ve buraya yazılır.**

## 1. Dil çerçevesi

**Nötr Latin Amerika İspanyolcası.** Hedef kitle ABD'deki Latino alıcı
(matrisin pazar gerekçesi). Bölgeye özgü deyim ve argodan kaçınılır, tüm LatAm
pazarlarında anlaşılan yapı kullanılır.

Kullanıcı teyidi (2026-08-15): "castellano" = **İspanyolca dilinin kendisi**,
İspanya İspanyolcası değil. İspanya kalıpları yasak: `alianzas (de boda)`,
`vosotros` ve çekimleri, `coger`, `móvil`.

## 2. Ses tonu (İngilizce VOICE'un birebir karşılığı)

- **Sessiz, kesin, aceleci değil.** Pazarlama hype'ı yok.
- **Emoji yok**, hiçbir yerde. Süs işareti yok (`✓`, `•`, `★`).
- **Somut isimler ve gerçek sayılar çalışır; sıfatlar çalışmaz.**
  "anillo hermoso y elegante" değil — "2 mm de ancho, 1.5 mm de espesor".
- **Gözlemle, performans yapma. Göster, açıklama.**
- Ünlem işareti kullanılmaz. Büyük harfle bağırılmaz (bölüm başlıkları hariç).

## 3. Hitap: `tú`

Mağaza geneli **tek** hitap `tú`'dur: `escríbenos`, `tu talla`, `elijas`,
`tu pedido`. `usted` ve çekimleri (`escríbanos`, `su talla`, `su pedido`)
kullanılmaz.

Gerekçe: ABD Latino perakendesinde yaygın, daha yakın ve daha az mesafeli.
İki metin `usted` yazılmıştı, 2026-08-14'te `tú`ya çevrildi.

İstisna: hitap içermeyen metin (ör. özel sipariş dökümü) nötr kalabilir —
ama `usted`e kaymaz.

## 4. Biçim değişmezleri

| Nitelik | Kural | Örnek |
|---|---|---|
| Ölçü birimi | **Sayı + boşluk + birim** | `2 mm`, `1.5 mm`, `19.0 mm` — `2mm` değil |
| Karat (malzeme) | **Küçük harf `k`**, gövde metninde | `oro macizo de 10k`, `10k o 14k` |
| Karat (fiziksel damga) | **Büyük harf `K`** | `el sello 10K`, `sellada 14K por dentro` |
| Karat (başlık) | **Büyük harf `K`** | `Oro Macizo 10K Rosa` |
| Beden | `talla US 9`, `tallas US 4 a la 16` | |
| Ondalık | Nokta (`1.5`), İngilizce metinle aynı | |
| Bölüm başlığı | Büyük harf, tek satır, iki yanında boş satır | `SOBRE EON` |

**Ölçü birimi neden İngilizceden farklı:** canlı İngilizce metinlerde biçim
**bitişik** (`2mm`) — 374 bitişik / 17 boşluklu. İspanyolcada sayı ile birim
arasına boşluk konur (RAE/SI kuralı), bu yüzden ES tarafı **boşluklu**dur.
İki dilin farklı olması sapma değil, bilinçli karardır; eşitlemeye çalışma.

**Karat büyük/küçük harfi neden bölünüyor:** canlı İngilizce gövdede küçük
harf baskın (45 küçük / 14 büyük), başlıkta ise 13/13 büyük harf. Damga
istisnası olgusaldır — yüzüğün içine basılan mühür gerçekten `10K` okur,
onu küçültmek ürünü yanlış tarif eder.

## 5. Terminoloji kilidi

`es-keyword-matrisi.md`'den; kanonik ifade hem doğru hem aranabilir olmalı.

| Kavram | Kullanılacak | Kullanılmayacak |
|---|---|---|
| solid gold | `oro macizo` | `oro puro`, `oro sólido` (metin içinde; tag havuzunda ölçülebilir) |
| wedding band | `anillo de boda` | `alianza`, `sortija` |
| never plated / never filled | `nunca enchapado y nunca relleno` | `bañado`, `laminado` (aynı anlam, ama tek biçim seçildi) |
| comfort fit | `ajuste confort` / `interior redondeado` | `ajuste cómodo` |
| free engraving (kuyruk) | `el grabado no tiene costo` | `de cortesía`, `sin cargo` |
| free engraving (gövde maddesi / başlık) | `gratis` ya da `sin costo` | — matriste `grabado gratis` tag adayı, kısa biçim gövde maddesinde doğal |
| size | `talla` | `medida` (gövde metninde), `tamaño` |
| ring (genel) | `anillo` | **`banda`** — anglisizm; ayrıca `banda ancha` İspanyolcada "geniş bant internet" okunur |
| karat | `quilataje` (nitelik), `10k`/`14k` (değer) | |
| men's ring | `anillo para hombre` | `anillo masculino` |
| rose gold | `oro rosa` | `oro rosado` |

## 6. Yasak liste

Hiçbir İspanyolca metinde bulunamaz:

- Emoji ve süs işareti (`✓`, `•`, `★`, `♥`)
- `alianza` (İspanya kalıbı)
- `banda` (yüzük anlamında) — anglisizm; `banda ancha` ayrıca "geniş bant" okunur
- Elmas ya da taş iması (`diamante`, `brillante`) — ürünlerde taş yok
- `hipoalergénico` — kanıtlanmamış sağlık iddiası
- `reciclado` — tedarik zinciri doğrulanmadı
- Ömür boyu garanti (`garantía de por vida`, `para toda la vida`)
- Hediye listesi kalıbı ("Perfect Gift For" karşılığı)
- **Birinci tekil şahıs** (`corto cada anillo`) — marka çoğul konuşur ya da
  edilgen kalır
- HTML entity (`&amp;`, `&nbsp;`)

## 7. Kanonik marka kuyruğu (kelimesi kelimesine sabit)

Her İspanyolca listing açıklaması **tam olarak** bu blokla biter. Gövde
metnine (açılış, madde listesi, ürün gerçekleri) dokunulmaz; kuyruk
listing'e göre değişmez.

Bu blok, canlı İngilizce marka kuyruğunun (919 karakter, kanonik kaynak:
listing `4539764153`) sadık karşılığıdır — bölüm bölüm eşlenir:
`ABOUT EON` → `SOBRE EON`, `PERSONALIZATION` → `PERSONALIZACIÓN`,
`MATERIAL AND OPTIONS` → `MATERIAL Y OPCIONES`, `MADE FOR ONE` →
`HECHO PARA UNA PERSONA`, `EON` → `EON`.

```
SOBRE EON

EON hace oro macizo personalizado para quienes compran joyería como algo que se conserva y se hereda. Nuestro orfebre fabrica cada pieza por encargo, en oro macizo de 10k o 14k, nunca enchapado y nunca relleno.

PERSONALIZACIÓN

Agrega un grabado privado en el interior de la pieza: una fecha, unas coordenadas, iniciales, un nombre o unas pocas palabras. El grabado no tiene costo. Los estilos de letra disponibles y el límite de caracteres se indican en cada publicación.

MATERIAL Y OPCIONES

Cada publicación indica el quilataje, el color del metal, el ancho, el perfil y las tallas disponibles. La disponibilidad de oro amarillo, blanco y rosa varía según el diseño. El oro se cotiza al momento de tu pedido.

HECHO PARA UNA PERSONA

Nada se trata como inventario anónimo. Tu pieza se prepara con la talla, el metal y el grabado que elegiste. Las dudas sobre calce, materiales o personalización se responden antes de empezar la producción.

EON

Un significado hecho para durar. Se usa hoy. Lo llevan las manos que siguen.
```

**İstisna (belgelenmiş, tek):** `4543000739` — tükenmiş, tek parça özel sipariş
listing'i (379 karakter). Alıcıyla konuşulmuş bir siparişin dökümü olduğu için
marka kuyruğu taşımaz; kapanış satırı kanonik kapanışın ilk cümlesidir
(`Un significado hecho para durar.`). Bu bir varyant değil, kısaltmadır.

## 8. Başlık kalıbı

`es-keyword-matrisi.md`'deki kalıp geçerlidir:

```
Anillo de Boda de Oro [KARAT] [RENK], [PROFİL], Grabado Personalizado Gratis, [HEDEF]
```

Sınır: ≤140 karakter (Etsy tavanı). İki listing aynı başlığı ya da aynı ilk
45 karakteri paylaşamaz.

## 9. Doğrulama (üretimden sonra, kodla)

Ajan raporuna değil **ham metne** bakılır (`.md` dökümleri denetçi notu taşır,
sayacı kirletir — 2026-08-15'te yasak-token sayacı bu yüzden yanlış okundu).
Kaynak: `product_translations.description`.

| Sayaç | Hedef |
|---|---|
| Kanonik kuyruk varyant sayısı | **1** (istisna listing hariç) |
| `[0-9]mm` bitişik biçim | **0** |
| `usted` / `escríbanos` / `su talla` | **0** |
| Yasak token (Bölüm 6) | **0** |
| Gövdede büyük harf karat | **yalnız `sello`/`sellada`/`sellado` bağlamında** |
| Başlık > 140 karakter | **0** |
| Tekrar eden ES başlığı / açılış paragrafı | **0** |

2026-08-15 ölçümü (13 ES satırı): kuyruk varyant **1**, bitişik `mm` **0**,
`usted` **0**, yasak token **0**, `banda` **0**, damga büyük harf
**11/11 `sello` bağlamında**, malzeme küçük harf **51**, başlık aşımı **0**,
tekil başlık **13/13**. Repo dökümü ⇄ DB: **13/13 MD5 birebir**.

Sayaç yeşil olsa da **en az üç ham metin baştan sona gözle okunur** —
"0 ihlal" teslim değildir, yalnız aklına gelen ihlallerin yokluğudur.

## 10. Bu belge ne zaman güncellenir

- Etsy'nin İspanyolca rehberliği değişirse (belge tarih taşır, eşikler donmaz).
- Yeni bir mağaza-geneli sapma kodla ölçülürse — sapmanın kendisi değil,
  **kuralı** buraya yazılır.
- Terminoloji kararı Alura hacim ölçümüyle değişirse (`es-keyword-matrisi.md`
  ile birlikte güncellenir).
