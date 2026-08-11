# Lintel listing videoları — araştırma + plan + üretim kaydı (2026-08-11)

## Etsy video kuralları (doğrulanmış)

Kaynaklar: Etsy Help (403 verdi, ikincil kaynaklardan çapraz teyit), Alura
listing-video rehberi, Shop Uploader rehberi. İçerik-çiftliği iddiaları
("listing başına 2 video") ELENDİ — iki güvenilir araç kaynağı hemfikir:

| Kural | Değer |
| --- | --- |
| Video / listing | **1** (galeriye tek video eklenir) |
| Süre | **5–15 sn** (15 sn üstü yüklemede kırpılır; 5 altı reddedilir) |
| Çözünürlük | min 500px, **tavsiye ≥1080px** |
| Dosya | ≤100MB; MP4/MOV/FLV/AVI/AAC/3GP/MPEG |
| Ses | **Etsy sesi tamamen siler** — sessiz tasarla |
| En-boy | zorunlu değil; **1:1 kare en güvenlisi** (mobil+masaüstü kırpmasız; galeri görsellerimiz de 1:1) |

Dönüşüm pratikleri (araştırma özeti): ilk 3 saniye kanca (parlama/ışık
hareketi); mücevherde makro doku + turntable dönüşü en etkili format;
giyilebilir üründe elde gösterim ilişkilendirmeyi artırır; kusursuz loop
(son kare ≈ ilk kare) izlenmeyi uzatır; video varlığı Etsy aramasında
zengin-görsel sinyali sayılır.

## Plan: listing başına 2 konsept

Etsy'ye yalnız 1 video girer → **A listing videosu, B yedek/reklam**
(Etsy Ads, Pinterest, A/B rotasyonu). 9 listing × 2 = 18 video.

| | Konsept A — "Işık Süpürmeli Orbit" | Konsept B — "Elde Işık Oyunu" |
| --- | --- | --- |
| Referans kare | `<sku>/01.jpg` (hero) | `<sku>/05.jpg` (on-hand) |
| Kamera | yavaş 360 orbit, 0.75x | yavaş dolly-in makroya, 0.75x |
| Kanca (0-2sn) | ray üzerinde kayan parlama | dönen el + ray parlaması |
| Gövde (2-6sn) | satine merkez dokusu ışık altında | parmakta makro, kumaş ataleti |
| Kapanış (6-8sn) | hero poza dönüş = loop | açılış poza dönüş = loop |
| Rol | listing galerisi | reklam/sosyal/yedek |

Üretim: Seedance 2.0 (Higgsfield), start_image = referans kare, 8 sn,
1:1, 1080p std, ses üretimi KAPALI (Etsy siliyor). Prompt yapısı:
seedance-prompt-builder skill bracket formatı — [CINEMATIC SETUP] renk
paleti aile ambiyansından (su/taş 10K, kireçtaşı/kum 14K, koyu ahşap/deri
18K), [SUBJECT] "no product drift", [ACTION TIMELINE] saniyeli, [NEGATIVE]
başarısızlık-modu listesi (el yok/taş yok/geometri değişmez; B'de yüz yok/
fazla parmak yok). Maliyet: 72 kredi/video × 18 = 1.296 kredi.

## Üretim kaydı

- Referanslar: 18 görsel Higgsfield'a yüklendi (media id'ler
  `scratchpad/lintel/media_ids.json` — geçici; kalıcı kayıt bu dosya).
- Konsept A jobları (2026-08-11): 1 GLD-1008 `80e586e3` · 2 WHG-1008
  `3e818a57` · 3 RSG-1008 `8f9b905a` · 4 GLD-1408 `ecbeecc9` · 5 WHG-1408
  `dec9d0d8` · 6 RSG-1408 `ade8864a` · 7 GLD-1808 `f9105fb3` · 8 WHG-1808
  `dd4c9051` · 9 RSG-1808 `5abfb167`
- Konsept B: A bitince gönderildi (eşzamanlılık limiti 429 verdi).
- Çıktılar panelde saklanmaz; Higgsfield galerisinden seçilip Etsy'ye elle
  yüklenir. Etsy API v3 video ucu ilerisi için aday (uploadListingVideo).

## Kabul kriterleri (yayın öncesi kontrol)

1. Ürün geometrisi referansla birebir (ray sayısı, genişlik oranı) — AI
   "ürün sürüklenmesi" en riskli hata.
2. Metal rengi doğru ayar/renkte kalmış (beyaz altın sararmamış).
3. İlk ve son kare yakın → kusursuz loop.
4. 5-15 sn bandında, 1080px, ≤100MB (Higgsfield MP4'leri uyar).
5. El videosunda parmak sayısı/anatomi doğal.
