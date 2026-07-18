-- 0105 - EON ve Jade Gold organik SEO pilot yol haritasi
--
-- Iki marka ayni operasyon panelini kullanir ancak arama alanlari, urun secimleri
-- ve marka dilleri birbirinden tamamen ayridir. Bu migration her org icin dokuz
-- Turkce gorev ekler. Tekrar calistirildiginda ayni basliklari yeniden olusturmaz.

with roadmap(org_id, sort_order, title, description, priority, lane, effort, due_date, notes) as (
  values
    -- EON
    ('9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid, 101,
      'EON SEO Pilotu 01: Dokuz canli listing icin baslangic verisini dondur',
      'Mevcut dokuz canli listing pilot setidir. Her listing icin son 30 gun goruntulenme, ziyaret, favori, sepete ekleme, siparis ve Etsy Search sorgularini kaydet. Degisiklikten onceki bu goruntu, sonraki sonuclari yargilayacagimiz referans olacak.',
      'P0', 'A', '2 saat', '2026-07-21'::date,
      'Reklam trafigi organik trafikten ayri tutulacak. EON icin bu pilot, markanin tum canli vitrini uzerinde calisir.'),
    ('9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid, 102,
      'EON SEO Pilotu 02: Her listinge tek bir arama alani ata',
      'Dokuz listingin her biri yalnizca bir ana satin alma niyetini sahiplensin. Karat, altin rengi, profil, uyum, genislik ve gravur eksenleri listingler arasinda paylastirilacak. Ayni ana sorgu iki listingde birincil hedef olmayacak.',
      'P0', 'A', '1 gun', '2026-07-22'::date,
      'EON kimligi korunacak: arama dili teknik katmanda calisir, marka metni gram ve fiyat bagiran bir katalog diline donusmez.'),
    ('9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid, 103,
      'EON SEO Pilotu 03: Talep ve rekabet verisini topla',
      'Etsy Marketplace Insights, paneldeki anahtar kelime arastirma katmani ve Google talep verisiyle her listing icin aday sorgulari olc. Arama hacmi, rekabet, urunle tam uyum ve satin alma niyetini birlikte puanla.',
      'P0', 'A', '1 gun', '2026-07-24'::date,
      'Yuksek hacim tek basina secim nedeni degildir. Daha dar fakat urunle tam eslesen sorgular once gelir.'),
    ('9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid, 104,
      'EON SEO Pilotu 04: Baslik etiket ve nitelikleri tek geciste yenile',
      'Secilen arama alanina gore basligi sade ve okunur hale getir. On uc etiketi tekrar koklerden arindir. Kategori ve nitelik alanlarini eksiksiz doldur. Dokuz listing tek kontrollu oturumda guncellenecek ve degisiklik kaydi tutulacak.',
      'P0', 'A', '2 gun', '2026-07-27'::date,
      'Guncellemeden sonra en az 14 gun baslik ve etiketlere dokunma. Etsy yeniden indeksleme surecini bozacak sik degisiklik yapma.'),
    ('9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid, 105,
      'EON SEO Pilotu 05: Arama vaadi ile ilk gorseli eslestir',
      'Her listingin ilk fotografi, hedeflenen sorgunun somut vaadini ilk bakista gostersin. Profil, renk, genislik ve yuzey farki mobil kucuk gorunumde okunur olmali. Marka dunyasi ikinci kareden itibaren derinlesir.',
      'P1', 'B', '2 gun', '2026-07-29'::date,
      'Etsy ilk gorseli aydinlik ve urun odakli kalir. EONun karanlik monolit sistemi marka karelerinde korunur.'),
    ('9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid, 106,
      'EON SEO Pilotu 06: Site icin organik arama mimarisini kur',
      'eonfinejewelry.com uzerinde dokuz listingi besleyecek koleksiyon ve rehber sayfalarini planla. Karat karsilastirmasi, comfort fit, alyans genisligi, yuzuk olcusu ve ic gravur gibi gercek alici sorularina ayri sayfalar ata.',
      'P1', 'B', '2 gun', '2026-08-01'::date,
      'Site Etsy aciklamalarini kopyalamaz. Her sayfa tek bir soruyu gercekten cozer ve ilgili listing ailesine yonlendirir.'),
    ('9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid, 107,
      'EON SEO Pilotu 07: Ilk uc dis SEO sayfasini yayinla',
      'Once satin alma kararina en yakin uc sayfayi yayinla: 10K 14K 18K karsilastirmasi, comfort fit rehberi ve alyans genisligi rehberi. Sayfa basligi, meta aciklama, ic baglantilar ve urun yapilandirilmis verisi tamamlanacak.',
      'P1', 'B', '3 gun', '2026-08-05'::date,
      'Metin EON sesinde kalir: sakin, kesin ve faydali. Arama kelimesi okuyucunun yuzune itilmez.'),
    ('9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid, 108,
      'EON SEO Pilotu 08: Pinterest ve ic baglantilarla dagit',
      'Her rehber icin bir soru pini, bir karsilastirma pini ve bir EON editoryal pini olustur. Pinler ilgili rehbere gider, rehber ilgili Etsy listingine baglanir. Instagram marka dunyasini kurarken Pinterest arama talebini yakalar.',
      'P2', 'B', 'surekli', '2026-08-08'::date,
      'Ayni gorsel dili koru fakat pin basliklarinda alicinin gercek sorusunu acikca kullan.'),
    ('9d0336c0-8772-456d-a80c-a5f2cfe7bbd0'::uuid, 109,
      'EON SEO Pilotu 09: On dort ve otuz gun sonucunu yargila',
      '14. gunde indekslenme ve tiklanma sinyallerini, 30. gunde ziyaret, favori, sepet ve siparis degisimini incele. Eslesme sorunu, tiklanma sorunu ve donusum sorununu birbirinden ayir. Kazanan arama alanlarini sonraki EON listinglerine yay.',
      'P1', 'owner', '2 saat', '2026-08-18'::date,
      'Basari yalniz goruntulenme degildir. Dogru sorgudan gelen nitelikli ziyaret ve siparis birlikte degerlendirilir.'),

    -- Jade Gold
    ('f155b853-dfaf-48fd-94c5-ddfcb856e07c'::uuid, 201,
      'Jade Gold SEO Pilotu 01: Dokuz sorunlu listing icin baslangic verisini dondur',
      'Pilot set: 1219136707 Nugget Ring, 1430538853 14K Cuban Chain, 1195581074 10K Cuban Bracelet, 1283581532 10K Cuban Necklace, 1336346678 Franco Bracelet, 1355681376 Valentino Bracelet, 1713308864 Heart Pendant, 1442796773 Valentino Necklace ve 1469384188 Bamboo Hoops. Son 30 gun organik performansini kaydet.',
      'P0', 'A', '2 saat', '2026-07-21'::date,
      'Bu dokuzlu yuksek trafik alirken yanlis niyet, tekrarli kok veya urun tipi celiskisi yasayan listinglerden secildi.'),
    ('f155b853-dfaf-48fd-94c5-ddfcb856e07c'::uuid, 202,
      'Jade Gold SEO Pilotu 02: Her listingin trafik sizintisini tanimla',
      'Her listing icin yanlis kitleyi ceken kelimeleri, tekrar eden kokleri ve eksik satin alma niyeti alanlarini yaz. Zincir ve bileklik tipi karisikliklari, celisen kadin erkek sinyalleri ve fazla genel gold ring gold chain ifadeleri oncelikli olarak temizlenecek.',
      'P0', 'A', '1 gun', '2026-07-22'::date,
      'Amaç daha fazla trafik degil, dogru trafigi yogunlastirmaktir.'),
    ('f155b853-dfaf-48fd-94c5-ddfcb856e07c'::uuid, 203,
      'Jade Gold SEO Pilotu 03: Dokuz ayri arama alani ata',
      'Her listinge bir ana ticari sorgu, iki destekleyici urun sorgusu ve ayri niyet slotlari ata. Urun tipi, karat, stil, alici, hediye ve kullanim eksenleri dengelenecek. Ayni ana sorgu pilot icinde iki kez sahiplenilmeyecek.',
      'P0', 'A', '1 gun', '2026-07-24'::date,
      'Mevcut paneldeki SEO onerileri baslangic girdisidir, otomatik olarak dogru kabul edilmez.'),
    ('f155b853-dfaf-48fd-94c5-ddfcb856e07c'::uuid, 204,
      'Jade Gold SEO Pilotu 04: Talep verisiyle keyword secimini dogrula',
      'Panelin kural ve AI adaylarini Etsy ve Google talep verisiyle zenginlestir. Hacim, rekabet, CPC, urun uyumu ve satin alma niyetini birlikte degerlendir. Her listing icin neden secildigi kayitli tek bir birincil sorgu belirle.',
      'P0', 'A', '1 gun', '2026-07-26'::date,
      'Yuksek goruntulenip satmayan listinglerde hacim artirmak yerine alaka ve niyet sikilastirilir.'),
    ('f155b853-dfaf-48fd-94c5-ddfcb856e07c'::uuid, 205,
      'Jade Gold SEO Pilotu 05: Baslik etiket ve nitelikleri tek geciste guncelle',
      'Basliklari alicinin dogal arama diline yaklastir. On uc etikette ayni kokun varyasyonlarini azalt ve bosalan alanlari alici, hediye, stil ve kullanim niyetiyle doldur. Kategori ve nitelik celiskilerini gider.',
      'P0', 'A', '2 gun', '2026-07-28'::date,
      'Dokuz listing guncellendikten sonra 14 gun boyunca SEO alanlarina dokunulmaz.'),
    ('f155b853-dfaf-48fd-94c5-ddfcb856e07c'::uuid, 206,
      'Jade Gold SEO Pilotu 06: Ilk gorsel ve fiyat vaadini aramayla hizala',
      'Organik goruntulenmesi yuksek fakat tiklanmasi veya satisi dusuk listinglerde ilk fotograf, baslik ve fiyat algisini birlikte incele. Aranan stil ilk karede acik gorunmeli. Yanlis hedeflenen urunler yalnizca keyword degisikligiyle iyi ilan edilmis sayilmayacak.',
      'P1', 'B', '2 gun', '2026-07-30'::date,
      'Keyword calisiyor fakat siparis gelmiyorsa sorun fiyat, gorsel, guven veya varyasyon olabilir.'),
    ('f155b853-dfaf-48fd-94c5-ddfcb856e07c'::uuid, 207,
      'Jade Gold SEO Pilotu 07: Dis SEO icin kategori ve rehber sayfalari kur',
      'Jade Gold sitesinde Cuban chain, nugget ring, Valentino jewelry, Franco bracelet ve bamboo hoop gibi ticari kategori sayfalari planla. Gercek alici sorulari icin karat, zincir uzunlugu, bileklik olcusu ve altin bakimi rehberleri olustur.',
      'P1', 'B', '3 gun', '2026-08-04'::date,
      'EONun miras ve kalicilik dili buraya tasinmaz. Jade Gold kendi sicak ve New York ritmindeki marka diliyle calisir.'),
    ('f155b853-dfaf-48fd-94c5-ddfcb856e07c'::uuid, 208,
      'Jade Gold SEO Pilotu 08: Pinterest ve organik dagitim dongusunu baslat',
      'Her kategori veya rehber icin arama niyetli pinler olustur. Pin, ilgili site sayfasina ve oradan dogru Etsy listingine gider. Kazanan urunler sosyal kanallarda tekrar edilir fakat Etsy reklamina bagimli bir gorunurluk modeli kurulmaz.',
      'P2', 'B', 'surekli', '2026-08-08'::date,
      'Dagitim performansi kaynak bazinda olculur: Etsy Search, Google, Pinterest ve sosyal trafik ayri tutulur.'),
    ('f155b853-dfaf-48fd-94c5-ddfcb856e07c'::uuid, 209,
      'Jade Gold SEO Pilotu 09: Sonuclari yargila ve 115 listinge yay',
      '14. gunde indeks ve tiklanma, 30. gunde donusum ve gelir etkisini incele. Dokuz pilot listingi kontrol gruplariyla karsilastir. Kazanan keyword mimarisini urun ailesine gore kalan aktif listinglere kademeli olarak uygula.',
      'P1', 'owner', '2 saat', '2026-08-18'::date,
      'Toplu yayilim ancak pilotta anlamli iyilesme gorulurse baslar. Ads sonucu organik basari gibi raporlanmaz.')
)
insert into public.tasks
  (org_id, title, description, status, priority, lane, effort, due_date, sort_order, notes)
select
  r.org_id,
  r.title,
  r.description,
  'todo',
  r.priority,
  r.lane,
  r.effort,
  r.due_date,
  r.sort_order,
  r.notes
from roadmap r
where exists (select 1 from public.organizations o where o.id = r.org_id)
  and not exists (
    select 1
    from public.tasks t
    where t.org_id = r.org_id
      and t.title = r.title
  );
