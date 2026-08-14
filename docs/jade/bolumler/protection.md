# Koruma & Şans — bölüm dosyası

**Kaynak:** Drive `oo5 | Jade Gold NYC - Efe` →
`JADE_GOLD_NYC_PROJECT_INSTRUCTIONS.md` (marka çekirdeği, ses tonu) +
`JadeGoldNYC-Look-Book-and-Master-Prompts-2026-07-30.md` (Chapter I — Protection).
Çekilme tarihi: 2026-08-13. **Repo kopyası kanonik:** Drive dosyası değişirse bu
dosya elle güncellenir; içerik üretimi buradan beslenir (Drive'a bağımlı üretim
bir sonraki oturumda kaynağını kaybeder).

---

## 1. Bölümün tanımı

> **"Things you wear so nothing touches you."**

Look Book'un birinci bölümü. Kapsam: nazar (evil eye) kolyeleri (tüm varyantlar),
cornicello / İtalyan boynuzu, hamsa, fil, firavun (pharaoh), panter — kısaca her
muska formu.

**Hikâye (Look Book, birebir):** *"These are not decoration. They are function.
Somebody bought this because they were worried about something. Photograph it like
it has a job."*

Bu cümle bölümün metin stratejisinin de temeli: **koruma sembolü bir süs değil bir
işlevdir.** Metin bu işlevi anlatır — sembolün ne yaptığını, neden takıldığını,
kime verildiğini. Estetik övgü değil, anlam.

## 2. Marka sesi (PROJECT_INSTRUCTIONS §3–4)

- **Ton:** confident, warm, direct, knowledgeable. Proud, **never boastful**.
- Altını akıcı konuşur (karat, zincir tipi, ağırlık) ama **kapı bekçiliği yapmaz** —
  okuyucuyu bilgisizlikle suçlamaz, terimi açıklar.
- Konumlandırma: *heritage gold for New York's cultures* — anlam taşıyan gerçek
  som altın. Modern lüks sunum, sokak seviyesinde ruh.

### Sert kurallar (ihlali = QA hatası)
- **"Solid gold" her zaman, karat her zaman belirtilir.** Plated / gold-tone /
  gold-filled / vermeil dili **yasak** (`jade_listing_qa.py` FAKE_METAL).
- Karat gamı **yalnız 10K ve 14K**. 18K bu mağazada yok — metinde geçmesi hata.
- **Abartı değil doğruluk:** ağırlık, fiyat, ölçü uydurulmaz. Bilinmeyen sayı
  yazılmaz.
- Yayına hazır çıktı: placeholder, taslak-gibi metin yok.

### Yasak dil (robot/pazarlama dolgusu)
`high quality`, `perfect gift for`, `don't miss`, `limited time`, `must have`,
`best seller`, `top quality`, `100% satisfaction`, `look no further`,
`we are proud`, `amazing`, `stunning piece`, `elevate your`, `timeless elegance`.

Başlıkta riskli iddia: `best`, `cheapest`, `free shipping`, `guarantee`, `cure`,
`lowest price`.

## 3. Sembol sözlüğü (metin üretiminin çekirdeği)

| Sembol | Ne anlatır | Metinde kullanılacak dil |
|---|---|---|
| Nazar / evil eye | Kem gözü geri yansıtır; Akdeniz'den Anadolu'ya ortak | mavi göz, bakışı geri çevirir, en eski koruma işareti |
| Hamsa | Açık el — kötülüğe karşı durur, beş parmak beş duyu | el, avuç, bereket ve savunma |
| Cornicello | İtalyan boynuzu; şans ve kem göze karşı, Napoli geleneği | boynuz, İtalyan, kuşaktan kuşağa |
| Fil (elephant) | Uğur, güç, sadakat; hortum yukarı = şans tutar | güç, hafıza, yukarı kalkık hortum |
| Firavun / pharaoh | Mısır kraliyeti, otorite ve koruma | kral, kadim, otorite |
| Panter | Güç, sessiz koruma, tetikte duruş | tetikte, sessiz güç, zümrüt göz |

**Renk varlığı:** nazarın kobalt mavisi tüm katalogdaki **tek gerçek altın-dışı
renk**. Look Book bunu "kimsenin kullanmadığı bir varlık" diye işaretliyor —
metinde de mavi, altının yanında ayırt edici bir detay olarak anılır.

## 4. Bu bölümün ticari ağırlığı

- 17 listing · 180.436 görüntülenme · 6.862 favori · **2.069 ömür satışı**
- **14K Evil Eye Pendant** (`1203090834`): tek başına 1.466 satış — mağazanın tüm
  zamanlarındaki ünitelerin ~%24'ü. $51.60–54. **HERO** → `koruma-kurallari.md` §1:
  başlığın ilk 40 karakteri ve tag kökü dokunulmaz.
- 14K Cornicello Necklace (`1537611621`): 155 satış — KEEP★.

### Bölümün iç tutarsızlığı (düzeltilecek asıl sorun)
Açıklamalar iki ayrı şablondan geliyor:

| Küme | Uzunluk | Listing |
|---|---|---|
| Kısa | 419–891 karakter | 11 |
| Uzun | 1.728–2.235 karakter | 6 |

En çok görülen ürün (78.772 görüntülenme) **476 karakterlik** açıklamayla duruyor.
Alıcı aynı rafta bambaşka derinlikte iki metin görüyor.

### Foto eksiği (ayrı iş kolu — içerik turunda çözülmez)
3 fotoğrafla duran listingler: `1228150776` (10.683 görüntülenme),
`1209955532`, `1228152002`. Look Book Chapter VI: **frame 2 her zaman ölçek
karesi** — mağazanın 1 numaralı şikâyeti "fotoğraftakinden küçük geldi".

## 5. Açıklama iskeleti (Jade / Protection)

EON `katalog-v2.md §5` deseninin uyarlaması. EON'un `MAKE IT YOURS` bölümü Jade'de
**yok** (stoklu ürün, kişiselleştirme yok); yerine **SIZE & FIT** gelir — çünkü
Jade'in en pahalı şikâyeti ölçek belirsizliği.

```
[Açılış ~160 karakter]
  Birincil arama kelimesi + "solid 14K gold, never plated" + sembolün işlevi.
  Etsy'nin arama önizlemesinde görünen kısım burası.

THE DETAILS
  Karat / metal rengi · ürün tipi · taş varsa taş · zincir tipi ve uzunluğu

SIZE & FIT
  Kolye/charm ölçüsü mm VE inç · bail (askı) iç ölçüsü · zincir uzunluk
  seçenekleri · "ölçü bail dahil mi" sorusunun net cevabı
  → QA bunu ZORUNLU tutar: mm veya inch/cm geçmeyen açıklama HATA.

THE MEANING
  Sembolün ne anlattığı (§3 sözlüğü). Kısa, somut, tarihsel — mistik satış değil.

[Kapanış]
  Som altın taahhüdü + bakım/gündelik kullanım. Ağırlık bloğu buradan SONRA
  eklenir (injectWeightBlock her zaman sona yazar).
```

**Açıklamada YASAK:** fiyat, indirim, kargo menşei, iade/yanıt süresi vaadi,
ödül/çok-satan iddiası, URL, emoji, HTML, başka karat. Gram/ağırlık **prosa
içinde** anlatılmaz — yapısal ağırlık bloğu ayrı bir kuyruktur.

## 6. Tag stratejisi

13 tag, her biri ≤20 karakter, çok kelimeli, alıcının arama çubuğuna yazacağı
biçimde. Kova modeli (`lib/seo/keyword-engine.ts` `selectTags`): ne / nasıl / kim /
stil / neden.

**Bu bölümün asıl riski — yamyamlık (cannibalization):** 17 listing aynı
kelime ailesini paylaşıyor. `jade_listing_qa.py check_cross`: iki listing arasında
13 tag'ten **≥11 örtüşme = HATA**, ≥9 = uyarı. Hedef: kardeşler arası örtüşme **≤10**.

Ayrıştırma eksenleri: karat (10k/14k), form (pendant / necklace / bracelet /
earrings), sembol (evil eye / hamsa / cornicello / elephant / pharaoh / panther),
alıcı (mens / womens), niyet (gift / protection / good luck / italian).

Kaynak hacim verisi: `docs/jade/seo/alura-verisi-2026-08-01.md`
(ör. `gold evil eye pendant` — 104.750 hacim, KD 37).

## 7. Kapsam kararı

17 listing'in tamamına içerik yazılmaz.
`docs/listing-audit/2026-08-jade-gold-chapters-kill-keep.md` KILL adayları
(0–2 satış) içerik kapsamı **dışında** — kapatma/birleştirme ayrı karardır.

İçerik kapsamı: **~14 listing.** Hero (`1203090834`) kapsamda ama §1 kısıtlarıyla:
başlık önü ve tag kökü korunur, yalnız açıklama derinleştirilir.

## 8. Sonraki adım

Faz 2a: içerik üretimi → `listing_redesigns` staging → QA (0 hata + örtüşme ≤10)
→ panelde onay. **Push bu turda YOK** — canary (en az riskli listing, asla hero)
→ 48 saat → dalga, ayrı turda.

---

## 9. Faz 2a çıktısı (2026-08-13)

**Kapsam daraltıldı: 17 → 10 listing.** İki gerekçe:
- **KILL adayları (2):** `1717808152` 10K Hamsa Pendant Necklace (0 satış),
  `1480904845` 14K CZ Hoop Huggie (2 satış) — kapatma/birleştirme ayrı karar.
- **Uzun açıklamalı küme (4):** `1537611621`, `1435050061`, `1525338848`,
  `1731430357` (1.728–2.235 karakter). Bunlar zaten yapılandırılmış içerik
  taşıyor; körlemesine yeniden yazmak KAYIP olurdu (üretici 2.235 → 745'e
  düşürüyordu). Ayrı turda mevcut metin korunarak iskelete taşınacak.

Kalan **10 listing** (419–891 karakter) tam yeniden yazım aldı.

### Üretim motoru: `lib/jade/protection-copy.ts`

Üç kusur ancak GERÇEK ÇIKTI okunarak yakalandı — hiçbiri tsc/lint'in göreceği
türden değildi:

1. **Sembol yanlış tanınıyordu.** Nazar (evil eye) bu katalogda başka sembollerin
   başlığında ikincil süsleme olarak geçiyor ("Hamsa Necklace | CZ Stone *Evil
   Eye* Pendant"). Nazar önce sınandığı için hamsa parçaları nazar sanılıyordu.
   → Nazar EN SONA alındı: diğerlerinden hiçbiri eşleşmediyse parça gerçekten nazar.

2. **Yamyamlık ↔ kök-tekrarı ikilemi.** Kardeşleri ayırmak için sembol kelimesini
   her tag kovasına yaydım → `check_cross` düzeldi ama kök-tekrarı patladı
   ("panther" 11 tag'de, QA hatası). İki kural ters yönde çekiyor. Denge: sembol
   YALNIZ `ne` kovasında (≤4 tag); ayrışma nitelik + form + karat üzerinden.

3. **Nitelik tek başına yetmedi.** Dört listing `evil_eye/pendant/14K`; ikisi
   "Puffed Evil Eye Ocean Blue" ve "Evil Eye Ocean Blue" — gerçekten neredeyse
   aynı ürün. Tek listing'e bakan üretici bunları ayıramaz.
   → **Niyet ekseni (ANGLES)**: aynı kümedeki her listing sırayla farklı bir
   alıcıya konumlanır (womens/gift · mens · layering · unisex). Kozmetik hile
   değil, kanibalizasyonun gerçek çözümü: iki varyant aynı aramada yarışmak
   yerine iki ayrı alıcıyı hedefler. Bunun için toplu API gerekti
   (`buildProtectionBatch`) — yamyamlık ancak kardeşler birlikte görülünce çözülür.

### Doğrulama (ölçülmüş, iddia değil)

| Ölçüt | Sonuç |
|---|---|
| QA hatası (`jade_listing_qa.py`) | **21 → 1** |
| Kardeşler arası en yüksek tag örtüşmesi | **10/13** (hata eşiği ≥11) |
| Başlık benzersizliği | **10/10** (önce 3 listing aynı başlığı alıyordu) |
| Açıklama uzunluğu | 419–891 → **704–772** karakter (tutarlı) |
| typecheck · lint | temiz |

**Kalan tek hata veri eksikliği, kod kusuru değil:** `1209955532` 10K Cornicello
Pendant'ın canlı açıklamasında hiçbir mm/inç ölçüsü yok. Marka kuralı gereği
ölçü UYDURULMAZ → satır `dusuk` güvenle işaretlendi, ölçü elle girilene kadar
`approved` olamaz.

Üretilen içerik: `protection-uretilen.json` (bu dizinde).

### Sıradaki adım
Staging SQL'i uygulanır → panelde onay yüzeyi → canary (en az riskli listing,
**asla hero**) → 48 saat → dalga.
