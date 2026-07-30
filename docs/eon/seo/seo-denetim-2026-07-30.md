# EON SEO denetimi — 28 canlı listing (2026-07-30)

> Tek geçişlik, **salt-rapor** denetim (Etsy'ye yazılmadı). Kaynak: panel DB
> aynası (products + etsy_listing_stats). Alura anahtar kelime verisi bu
> raporun ÜSTÜNE eklenip düzenlemeler elle yapılacak.
>
> **Metodoloji notları:**
> - **Kural 4 (başlık):** hedef bant 110–140 karakter. Motor bugüne dek yalnız
>   >140'ı flagliyordu (yön hatası) — bu turda `lib/etsy/listing-audit.ts`'e
>   `title_short` (<110) kontrolü eklendi.
> - **Kural 3 (views>25 & fav 0):** `etsy_listing_stats` günlük anlık görüntü
>   toplamaya yeni başladı (ilk kayıt 2026-07-30) — 30 günlük pencere HENÜZ
>   kurulamıyor; bu rapor ÖMÜR BOYU kümülatif sayaçları kullanır. 30 gün veri
>   birikince pencereli değerlendirme otomatik mümkün olur.
> - **Kural 5 (size-scale/style attribute):** panel DB'sinde Etsy attribute
>   aynası YOK (bilinen açık, phase-0 envanteri §5) — listing başına
>   denetlenemedi; kolon bu yüzden raporda 'veri yok' der. Aynalama işi ayrı.

## Listing tablosu

| Listing | Başlık (güncel) | Uzunluk | Tag | Attribute (kural 5) | Foto | Views | Fav | Kural 3 |
|---|---|---|---|---|---|---|---|---|
| 4539727911 | 10K Gold Band with Beveled Edge, Solid Yellow Flat Profile in 2mm–12mm | 70 ⚠️ **<110** | 13/13 | veri yok | 8/10 | 5 | 0 |  |
| 4543442596 | 10K Solid Gold Hammered Wedding Band, Milgrain Comfort Fit Ring | 63 ⚠️ **<110** | 13/13 | veri yok | 8/10 | 6 | 0 |  |
| 4539503643 | 10K Solid Rose Gold Beveled Wedding Band, 2mm to 12mm | 53 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 18 | 0 |  |
| 4539493533 | 10K Solid Rose Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm | 67 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 22 | 1 |  |
| 4539777194 | 10K Solid Rose Gold Wedding Band, Flat Profile, 2mm to 12mm | 59 ⚠️ **<110** | 13/13 | veri yok | 6/10 | 8 | 0 |  |
| 4539666999 | 10K Solid White Gold Dome Wedding Band, Comfort Fit, 2mm to 12mm | 64 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 111 | 4 |  |
| 4539506699 | 10K Solid White Gold Milgrain Wedding Band, Beaded Edge Vintage Ring, 2mm to 12mm | 81 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 33 | 3 |  |
| 4539780408 | 10K Solid White Gold Wedding Band, Flat Profile, 2mm to 12mm | 60 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 2 | 0 |  |
| 4539776628 | 10K Solid Yellow Gold Wedding Band, Knife Edge Profile Rings, 2mm to 12mm | 73 ⚠️ **<110** | 13/13 | veri yok | 6/10 | 9 | 0 |  |
| 4539777986 | 10K Yellow Gold Flat Wedding Band, Solid Gold Ring, Engraved (2mm-12mm) | 71 ⚠️ **<110** | 13/13 | veri yok | 5/10 | 63 | 5 |  |
| 4539517211 | 10K Yellow Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm | 63 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 30 | 1 |  |
| 4543938814 | 14K Solid Rose Gold Flat Wedding Band, 2mm to 12mm | 50 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 0 | 0 |  |
| 4540045731 | 14K Solid Rose Gold Milgrain Wedding Band, Vintage Beaded Edge Rings, 2mm to 12mm | 81 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 11 | 1 |  |
| 4542484518 | 14K Solid Rose Gold Wedding Band, Beveled Edge, 2mm to 12mm | 59 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 0 | 0 |  |
| 4543441480 | 14K Solid White Gold Wedding Band, Dome Comfort Fit, 2mm to 12mm | 64 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 2 | 0 |  |
| 4542485142 | 14K White Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm | 62 ⚠️ **<110** | 13/13 | veri yok | 6/10 | 9 | 0 |  |
| 4542485546 | 14K White Gold Ring With Beveled Edges, Flat Top Solid Band 2mm to 12mm | 71 ⚠️ **<110** | 13/13 | veri yok | 6/10 | 3 | 0 |  |
| 4544213291 | 14K Yellow Gold Beveled Band, Flat Top Unisex Wedding Ring (2-12mm) | 67 ⚠️ **<110** | 13/13 | veri yok | 8/10 | 0 | 0 |  |
| 4544156933 | 14K Yellow Gold Knife Edge Wedding Band, 2mm to 12mm | 52 ⚠️ **<110** | 13/13 | veri yok | 8/10 | 6 | 0 |  |
| 4543953211 | 14K Yellow Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm | 63 ⚠️ **<110** | 13/13 | veri yok | 6/10 | 5 | 0 |  |
| 4544663413 | 18K Solid Yellow Gold Wedding Band, Domed Comfort Fit, 2mm to 12mm | 66 ⚠️ **<110** | 13/13 | veri yok | **1**/10 ⚠️ | 0 | 0 |  |
| 4546520793 | 18K White Gold Milgrain Wedding Band, Beaded Edge, 2mm to 12mm | 62 ⚠️ **<110** | 13/13 | veri yok | **1**/10 ⚠️ | 0 | 0 |  |
| 4546619565 | 18K Yellow Gold Knife Edge Wedding Band, Center Ridge Profile, 2mm to 12mm | 74 ⚠️ **<110** | 13/13 | veri yok | **1**/10 ⚠️ | 0 | 0 |  |
| 4539776904 | Custom Engraved 10k Rose Gold Dome Band Ring, Comfort Fit (2mm-12mm) | 68 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 50 | 1 |  |
| 4539761531 | Custom Wedding Band in 10K Solid White Gold, Beveled Edge Design | 64 ⚠️ **<110** | 13/13 | veri yok | 6/10 | 1 | 0 |  |
| 4543927823 | Flat Wedding Band in Solid 14k Yellow Gold, 2mm to 12mm Engraved | 64 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 0 | 0 |  |
| 4539764153 | Gold Wedding Band, 10k Solid Yellow Domed Comfort Fit, 2mm to 12mm | 66 ⚠️ **<110** | 13/13 | veri yok | 8/10 | 187 | 7 |  |
| 4544441878 | Solid 14K Rose Gold Dome Wedding Band, Comfort Fit, Free Engraving (2-12mm) | 75 ⚠️ **<110** | 13/13 | veri yok | 7/10 | 0 | 0 |  |

## Tag listeleri (13/13 dolu olsa da içerik Alura ile karşılaştırılacak)

- **4539727911** — 10k gold band, gold wedding band, beveled edge ring, flat wedding band, solid gold ring, mens wedding band, yellow gold ring, minimalist gold ring, classic wedding band, plain gold band, womens gold band, mirror finish ring, made to order ring
- **4543442596** — 10k gold ring, gold wedding band, hammered ring, milgrain ring, mens wedding ring, comfort fit ring, unisex gold ring, minimalist ring, anniversary ring, handmade ring, promise ring, retro vintage ring, vintage engagement
- **4539503643** — 10k rose gold ring, solid rose gold band, beveled gold band, beveled edge ring, mens wedding band, womens wedding band, anniversary ring, promise ring, engraved gold band, stacking gold ring, wide gold band, minimalist gold ring, unisex gold ring
- **4539493533** — solid 10k gold ring, 10k gold band, mens wedding band, womens wedding ring, milgrain ring, beaded edge band, vintage style ring, stacking ring, anniversary ring, gold promise ring, thin gold band, engraved gold ring, custom engraved ring
- **4539777194** — 10k rose gold ring, solid gold band, flat wedding band, minimalist gold ring, anniversary ring, gold promise ring, engraved gold ring, thin gold band, wide gold band, stacking gold ring, his and hers band, men's wedding band, women's wedding band
- **4539666999** — solid 10k gold ring, 10k white gold band, white gold dome ring, comfort fit band, gold ring for him, gold ring for her, anniversary ring, engraved gold band, custom engraved ring, minimalist gold ring, thin gold band, wide gold band, wedding ring
- **4539506699** — 10k gold ring, white gold band, solid gold ring, milgrain band, beaded edge ring, vintage gold ring, mens wedding band, womens gold ring, promise ring, thin gold band, engraved gold band, wedding band, classic wedding ring
- **4539780408** — 10k white gold ring, flat wedding band, anniversary ring, promise ring, engraved gold ring, thin gold band, wide gold band, stacking gold ring, minimalist ring, plain gold band, 10k gold band, Men's wedding Band, Women's gold ring
- **4539776628** — solid 10k gold ring, 10k gold band, knife edge ring, architectural ring, mens wedding band, womens wedding ring, anniversary ring, engraved gold ring, custom engraved band, thin gold band, wide gold ring, minimalist gold ring, his and hers rings
- **4539777986** — 10k gold band, 10k wedding band, flat wedding band, solid gold band, yellow gold band, plain wedding band, mens wedding band, gold wedding ring, flat gold ring, 10k gold ring, unisex wedding band, simple gold ring, womens gold band
- **4539517211** — solid 10k gold, 10k gold band, milgrain ring, beaded edge band, wide gold ring, mens wedding band, womens gold ring, unisex gold ring, anniversary ring, promise ring, engraved gold band, stacking gold ring, custom engraved ring
- **4543938814** — flat wedding band, flat gold ring, rose gold band, 14k rose gold ring, solid 14k gold ring, mens wedding band, womens wedding band, engraved gold ring, custom engraved ring, anniversary ring, promise ring, stacking gold ring, wide gold ring
- **4540045731** — 14k rose gold ring, solid 14k gold band, milgrain gold ring, beaded edge ring, vintage wedding band, unisex wedding band, anniversary ring, stacking gold ring, engraved gold band, custom engraved ring, thin gold band, men's gold ring, women's XXL band
- **4542484518** — 14k rose gold ring, rose gold band, mens wedding band, womens wedding ring, beveled wedding band, flat gold band, anniversary ring, promise ring, engraved gold band, custom engraved ring, thin gold band, stacking gold ring, wide gold ring
- **4543441480** — 14k white gold ring, solid 14k gold band, mens wedding band, womens wedding ring, anniversary ring, his and hers band, dome wedding ring, comfort fit band, thin gold band, wide gold ring, engraved gold ring, custom engraved ring, stacking gold ring
- **4542485142** — milgrain band, beaded edge ring, solid 14k gold ring, 14k gold band, 14k white gold ring, womens wedding band, mens gold band, anniversary ring, engraved gold ring, stacking gold ring, thin gold band, wide gold ring, promise ring gold
- **4542485546** — 14k white gold ring, solid gold band, beveled edge ring, flat top band, white gold band, plain gold band, custom gold ring, beveled gold band, 14k flat band, made to order ring, mens wedding band, flat band ring, solid gold ring
- **4544213291** — 14k gold band, beveled wedding band, flat wedding band, solid gold ring, yellow gold band, mens wedding band, custom engraved ring, plain gold band, womens gold band, beveled edge ring, minimalist gold ring, flat top ring, anniversary ring
- **4544156933** — 14k gold band, solid gold ring, knife edge ring, knife edge band, mens wedding band, womens gold ring, unisex wedding ring, anniversary ring, promise ring, engraved gold ring, thin gold band, wide gold band, modern gold ring
- **4543953211** — solid 14k gold, 14k gold band, milgrain ring, beaded edge band, mens wedding band, womens wedding band, anniversary ring, promise ring, custom engraved ring, personalized band, stacking gold ring, wide gold ring, thin gold band
- **4544663413** — solid 18k gold ring, 18k gold band, mens wedding band, womens wedding band, anniversary ring, dome wedding ring, comfort fit band, thin gold band, wide gold ring, engraved gold band, stacking gold ring, plain gold band, unisex wedding band
- **4546520793** — solid 18k gold ring, 18k white gold band, milgrain gold band, beaded edge ring, wide gold band, womens gold band, mens wedding ring, anniversary ring, promise ring gift, engraved gold ring, custom engraved band, stacking gold ring, thin gold band
- **4546619565** — 18k gold ring, solid 18k band, mens wedding band, unisex gold ring, knife edge ring, modern gold band, anniversary ring, promise ring, thin gold band, wide gold ring, stacking gold ring, custom engraved ring, engraved gold band
- **4539776904** — custom engraved ring, simple wedding band, domed gold ring, wide gold ring, engraved gold ring, comfort fit ring, personalized ring, polished gold ring, plain gold band, mens wedding band, anniversary ring, dome wedding band, dome wedding ring
- **4539761531** — custom wedding band, 10k white gold band, beveled wedding band, custom size band, wedding band custom, beveled edge ring, 10k white gold ring, mens wedding band, womens wedding band, wide gold band, thin gold band, his and hers band, engraved gold band
- **4543927823** — flat wedding band, 14k gold band, solid gold band, yellow gold band, plain wedding ring, engraved gold ring, gold wedding ring, handmade gold ring, custom engraved ring, flat gold ring, mens wedding band, 4mm gold band, simple gold ring
- **4539764153** — gold wedding band, 10k gold band, solid gold band, comfort fit ring, dome wedding ring, yellow gold ring, half round band, plain wedding ring, simple gold ring, 10k wedding band, classic gold band, mens wedding band, anniversary ring
- **4544441878** — solid 14k gold ring, rose gold band, dome wedding rings, comfort fit band, men's wedding band, women's promise ring, anniversary ring, engraved gold ring, personalized band, stacking ring, minimalist ring, thin gold band, wide gold ring

## Özet bulgular

1. **Başlık <110 karakter (kural 4): 28/28 listing.** En kısa: 4543938814 (50 kr.), 4544156933 (52 kr.), 4539503643 (53 kr.), 4539777194 (59 kr.), 4542484518 (59 kr.). 140 karakterlik bütçenin ortalama %53'i kullanılmıyor — Alura long-tail'leri buraya girecek.
2. **Tag: 28/28 listing 13/13 dolu.**
3. **Kural 3 (views>25 & fav 0, kümülatif): 0 listing.** 25 view eşiğini geçen 6 listing'in hepsi ≥1 favori almış (dönüşüm sinyali sağlıklı); 18 view/0 fav ile 4539503643 izlenmeli.
4. **Foto <5 (dönüşüm riski): 3 listing** — 4544663413 (1/10), 4546520793 (1/10), 4546619565 (1/10). Özellikle 3×18K listing tek fotoğrafla canlıda.
5. **Kural 5 (attribute):** hiçbir listing için doğrulanamadı — attribute aynası kurulana dek bu kural fiilen kör.

Ortalama başlık uzunluğu **65 karakter**; 110+ olan yalnız 0 listing.

