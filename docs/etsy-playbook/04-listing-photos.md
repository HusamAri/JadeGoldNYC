# 04 Listing görselleri, video, açıklama zorunlulukları, dönüşüm
Kaynak: `source/04-*.txt` (M4), okuma 2026-10-22.

## Zorunlu (Etsy politikası)
- **2026-10-22'den beri: her listing'de EN AZ BİR düzenlenmemiş, gerçek ürünün gerçek zeminde fotoğrafı** (o karede düzenleme/AI yok). Made-to-order: daha önce yapılmış gerçek parçanın fotoğrafı. Render, stok görsel yok; AI ile renk/doku/ana tasarım değiştirilmez. Yaptırım: iade yükümlülüğü, listing kaldırma, mağaza kapatmaya kadar [M4 S1 2026-10-22, S3 2026-10-05]. Slot serbest.
- Açıklamada malzeme, ayar, menşe, kim/nerede/nasıl yaptığı; üretim ortağı beyan edilir [M4 S3 2026-10-05]. Tasarım AI ile yapıldıysa AI beyanı [M4 S4 2025-06-10].
- Kişiselleştirmeli üründe ilk fotoğraf kişiselleştirilmiş BİTMİŞ parça [M4 S5].
- Yorum: önce özelde çöz (yanıt yorumu kilitler); yorum karşılığında teşvik yok [M4 S29, S3].

## Fotoğraf
- En çok 20; ilk fotoğraf ≥635 px (altı sıralamayı düşürür), ≥2000 px önerilir; yatay ya da kare, diğerleri aynı şekil; sRGB; >1 MB yüklenmeyebilir; GIF/şeffaf PNG yok [M4 S7 2025-08-26, S9].
- İlk fotoğraf: tek bitmiş ürün, kolaj yok, yazı yok, iyi ışık; 1:1, 4:3, 3:4 kırpmada kesilmesin [M4 S7].
- Set (en az 10): hero · elde ölçek · gravür makro · profil (genişlik/kalınlık) · DÜZENLENMEMİŞ gerçek · gerçek metal renkleri yan yana (renk değiştirilmemiş) · cetvel/para ölçek · damga yakın (14K/585) · gönderildiği gibi paket · stack/yaşam. Yazılı kartlar (font, beden, ayar/gram, bakım) slot 1 hariç [M4 §5].

## Video
- Listing başına 1; 3-15 sn; ≤100 MB; ≥500 px (1080 ideal); ses silinir [M4 S12]. Etsy "aramada görünümü iyileştirebilir" der; sıralama faktörü olduğuna dair birincil kaynak yok [M3 §1.6].

## Diğer sınırlar
- Kişiselleştirme metni 1-1.024 kr, ≤5 alan [M4 S5]; talimat 120 kr (UNVERIFIED). Ship-by uzatma bir kez, 21 gün [M4 S20]. Yorum penceresi 100 gün [M4 S24].
- Varyasyon "2 özellik / 70 kombinasyon" yalnız 3. taraf kaynak [M4 S19]; CLAUDE.md 3 eksen / 400 kuralı canlıda çalışıyor, o geçerli.

## Panelde açık çelişkiler (2026-10-22)
- Düzenlenmemiş gerçek fotoğraf kontrolü hiçbir kodda yok; Higgsfield setleri AI. Hangi listing'de gerçek fotoğraf olmadığı listelenmeli (sahip kararı + fotoğraf bankası).
- `lib/etsy/listing-audit.ts:98,196,298` "10 foto slotu" diyor (doğrusu 20); `LOW_IMAGE_THRESHOLD = 5` (set önerisi 10).
- `lib/etsy/create-listing.ts:815` `who_made: "i_did"`; üretim ortağı beyanı gerekiyorsa değişmeli (sahip kararı).
