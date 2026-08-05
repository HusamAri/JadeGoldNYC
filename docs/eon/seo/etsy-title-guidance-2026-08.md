# Etsy başlık kuralları ve TTG başlıkları — 2026-08

## Bulgu: Etsy başlıkları reddetmiyor

"Yazdığın başlıklar artık Etsy'de kabul görmüyor" şikâyeti araştırıldı (canlı
Etsy OpenAPI spec + Seller Handbook + API changelog, 2026-08-05). **2025–2026'da
daha önce geçerli olan başlıkları reddeden yeni bir kural bulunamadı.** Repodaki
104 üretilmiş başlık sert kural sözleşmesine karşı denetlendi: **0 ihlal**.

Gerçekte değişen iki şey:

1. **Ağustos 2025 — Etsy'nin TAVSİYESİ değişti** ([Seller Handbook][sh]):
   kısa, insan-okunur başlık; 15 kelimeden az; kelime tekrarı yok; alıcı/vesile
   terimleri ve promosyon dili etiketlere taşınsın. eRank'in aktardığına göre
   Etsy eski tarz başlıkların **cezalandırılmadığını açıkça doğruladı** — yani
   toplu yeniden yazım acil değil.
2. **Haziran 2025 — alıcı uygulaması başlıkları ~70 karaktere AI ile kısaltıp
   gösteriyor.** Gerçek başlık değişmez; yalnız mobil görünüm kırpılır. "Kabul
   görmüyor" izleniminin en olası kaynağı budur.

## Sert kurallar (Etsy REDDEDER)

| Kural | Sınır |
| --- | --- |
| Uzunluk | ≤ 140 karakter |
| İzinli karakterler | harf, rakam, noktalama, matematik sembolü, boşluk, `™ © ®` |
| Yasak | `$ ^ \``, para birimi sembolleri, emoji, `°`, kontrol karakterleri |
| Tek kullanım | `%` `:` `&` `+` — her biri en fazla 1 kez |
| Büyük harf | en fazla 3 TAMAMEN BÜYÜK kelime |
| Başlangıç | harf veya rakamla |

Doğrulanamayan iddialar (kullanmayın): virgül sınırı, tekrarlanan kelimenin
reddi/ceza alması, "ilk 40 karakter en ağır" rakamı.

## Rehberlik (tavsiye — sıralama cezası yok)

15 kelimeden az (~60–90 kr) · ana kelime ilk 3–5 kelimede · kelime tekrarlama ·
ürün adını düz söyle · alıcı/vesile ("gift for her", "mens", "his and hers") ve
promosyon ("free engraving") başlıktan ETİKETLERE · öznel sıfat yok.

## TTG kanonik başlıkları

Etsy'de taslak olarak açıldılar (2026-08-05 18:24) ve **eski başlıkları
taşıyorlar**. Aşağıdakiler kanoniktir; panelin toplu SEO gönderimi başlığa
bilerek dokunmadığı için **Etsy editöründen elle** girilmelidir.

| Listing | Başlık (79 kr · 14 kelime) |
| --- | --- |
| 4550516268 | `10K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit` |
| 4550506421 | `14K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit` |
| 4550506827 | `18K Two Tone Wedding Band, Solid Yellow and White Gold, Diamond Cut Comfort Fit` |

Eski başlık 133 kr / 24 kelime idi; "Gold" üç kez geçiyor, dört alıcı/vesile
terimi taşıyordu ve **"2mm to 12mm" artık yanlıştı** (eksen 6–12mm'ye çekildi).

Etiketlere taşınacak terimler: `mens wedding band`, `anniversary gift`,
`gift for him`, `his and hers rings`, `two tone ring`.

## Repoda düzeltilen bayat kurallar

- `lib/etsy/listing-audit.ts` — `TITLE_MIN_LENGTH` 110 → **40**. Eski eşik
  "140 bütçesini doldur" diyordu; hem rehberliğin tersiydi hem aynı dosyadaki
  `title_long` (>15 kelime) kuralıyla çelişiyordu (110 kr ≈ 18 kelime).
- `lib/growth-roadmap.ts` — "ilk 40 karakter + 140'ın tamamı" formülü güncel
  rehberlikle değiştirildi.
- `lib/seo/keyword-engine.ts` — üretilen başlıktan "Minimalist Gift for
  Him/Her" ve "for men/women" öbekleri kaldırıldı (etiketlerde zaten var),
  kelime tekrarı giderildi, `titlewords` kontrolü eklendi. 8.505 kombinasyonluk
  tam süpürmede tüm invariantlar temiz; uzunluk bandı 53–96 kr / ≤13 kelime.

[sh]: https://www.etsy.com/seller-handbook/article/1399426136697
