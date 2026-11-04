# Amuletta 2.0 — kullanıcı dostu veri paneli araştırması (2026-11-04)

Kapsam: tek kişilik Etsy kuyumcu, ADHD, masaüstü + telefon, üç iş: satılan
kalem başına kâr, taslak listing'i Etsy'ye itme, stok/fiyat düzenleme.
Kaynaklar birincil (NN/g, GOV.UK, Polaris, Atlassian, W3C COGA, Baymard).

## 1. Bilgi mimarisi (3 işlik araç)
- Düz > derin: 3-4 üst seviye madde, en çok 2 seviye (liste → detay). https://www.nngroup.com/articles/flat-vs-deep-hierarchy/
- Masaüstünde nav daima görünür, hamburger arkasına saklanmaz (bulunabilirlik %20+ düşer). https://www.nngroup.com/articles/hamburger-menus/
- Etiketler işe göre ("Satış & kâr", "Etsy'ye taslak", "Stok & fiyat"), veri tipine göre değil. https://www.nngroup.com/articles/intranet-information-architecture-ia/
- Her sayfada TEK birincil buton; aynı aksiyon iki yerde çizilmez. https://polaris.shopify.com/components/actions/page-actions
- Sol dikey nav masaüstünde taranır, telefonda temiz katlanır. https://www.nngroup.com/articles/vertical-nav/

## 2. Ana sayfa
- KPI sayısı için kanıtlı bir sayı yok; kural: yalnız bugün aksiyon alacağın şey görünür, gerisi bir tık ötede. https://www.nngroup.com/articles/working-memory-external-memory/
- Vanity (ömür boyu ciro) yerine oran ve "aksiyon bekleyen" sayısı. https://www.nngroup.com/articles/vanity-metrics/
- "Dikkat gerektiren" listesi paraya göre sıralı ve sınırlı (~5); alarm yorgunluğu yük ekler. https://www.nngroup.com/videos/alert-fatigue-user-interfaces/
- Operasyonel ana sayfa: durum + aksiyon; pasta değil çubuk. https://www.nngroup.com/articles/dashboards-preattentive/
- Boş durum açıklar ve yönlendirir. https://www.nngroup.com/articles/empty-state-interface-design/
- Tazelik: her veri yüzeyinde "veri şu ana kadar: <kaynağın max zaman damgası>"; "senkron koştu" yeşili veri kanıtı değildir. https://www.basedash.com/blog/data-freshness-how-current-your-dashboard-data-really-is

## 3. Finansal tablolar
- Sayı sağa, metin sola, başlık veriyi izler, ortalama yok. https://polaris.shopify.com/components/tables/data-table · https://design-system.service.gov.uk/components/table
- `font-variant-numeric: tabular-nums` veri yüzeylerinde. 
- Binlik ayırıcı, kolon boyunca aynı ondalık, kuruş önemli değilse ondalık yok.
- Dört tablo görevi (bul, karşılaştır, tek satırı gör/düzenle, satırlara aksiyon). Inline edit yalnız dar tablolarda, düzenleme modu görünür farklı; geniş kayıt → modal olmayan yan panel; başlık + ilk kolon sabit; en çok 1-2 satır aksiyonu; "N kolon gizli" kontrolü. https://www.nngroup.com/articles/data-tables/
- Inline edit klavye sözleşmesi: Enter kaydeder, Esc iptal, görünür tik/çarpı. https://atlassian.design/components/inline-edit/usage
- Kaydetme geri bildirimi: alan başına "Kaydedildi" ya da açık Kaydet; kaydedilmemiş değişiklikte uyarı. https://www.nngroup.com/articles/efficiency-vs-expectations/
- Telefon: ilk kolon kilitli, kolon alt kümesi seçilebilir ya da kart/liste. https://www.nngroup.com/articles/mobile-tables/ · https://shopify.dev/docs/api/app-home/polaris-web-components/layout-and-structure/table

## 4. Form ve inline edit (ADHD / bilişsel yük)
- W3C COGA: 4.6 odaklanmaya yardım (kesintiyi sınırla, kısa kritik yol, fazla içerikten kaçın); 4.5 hatadan kaçın (geri dön, kolay geri al, veri kaybı yok, geri bildirim); 4.2.4 her adım net; 4.7 hafızaya yaslanma. https://www.w3.org/TR/coga-usable/
- Çok adımlı akışta sayfa başına tek soru, "Adım 3/5". https://design-system.service.gov.uk/patterns/question-pages/
- Yarım kalan işler için görev listesi + durum. https://design-system.service.gov.uk/components/task-list/
- Tek kolon, gruplanmış bölümler, kademeli açılım, hata alanın yanında, erken doğrulama yok. https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/
- "Emin misin?" yerine geri al; onay yalnız geri dönüşsüz (Etsy push, silme) ve sonucu adıyla söyler. https://www.nngroup.com/articles/confirmation-dialog/
- Aynı bilgiyi iki kez sorma (WCAG 2.2 3.3.7). https://dequeuniversity.com/resources/wcag-2.2
- Alan çıkışında inline doğrulama, düzelince hata silinir, olumlu onay. https://baymard.com/blog/inline-form-validation

## 5. Görsel ritim
- Gruplamayı kutu/çizgiden önce boşlukla yap. https://www.nngroup.com/articles/common-region/
- Az punto boyu; parlak renk yalnız kilit öğede. https://www.nngroup.com/articles/principles-visual-design/
- 2-3 renk; bir rengin anlamı her ekranda sabit. Bölüm renk kodlaması dikkati böler ve durum renkleriyle çarpışabilir: bölüm tonu zemin/eyebrow'da kalır, durum renkleriyle çakışmaz. https://www.nngroup.com/articles/color-enhance-design/
- Durum asla yalnız renkle; metin/ikon eşlik eder. https://spectrum.adobe.com/page/status-light
- Gereksiz görsel kaldırılınca önemli sayılar öne çıkar. https://www.nngroup.com/articles/complex-application-design/

## 6. Kaldırılacak anti-desenler
- Oturum popup'ları en yıkıcı overlay; kullanıcı refleksle kapatır, gerçek onayları da öldürür. https://www.nngroup.com/articles/popups/
- Aynı aksiyon/link birden çok yerde. https://www.nngroup.com/articles/duplicate-links/
- Kritik buton Ayarlar altında, modal aşırılığı, zayıf geri bildirim. https://www.nngroup.com/articles/top-10-application-design-mistakes/
- Yıkıcı buton zararsızın yanında. https://www.nngroup.com/articles/proximity-consequential-options/
- Dekoratif bölümler / kullanılmayan metrikler. https://www.nngroup.com/articles/characteristics-minimalism/

## Uygulanacak 10 madde
1. Nav = 3 iş adı + Ayarlar; masaüstünde hep görünür, telefonda alt bar; en çok 2 seviye.
2. Her sayfada tam bir birincil buton; aksiyon iki yerde görünmez.
3. Ana sayfa = "Dikkat" listesi (paraya göre, ~5) + ≤4 aksiyon sayısı + kaynak başına "veri şu ana kadar"; ömür boyu toplam ve pasta yok.
4. Her tablo: sayılar sağa `tabular-nums`, tutarlı ondalık, ilk kolon sabit ve okunur, başlık sabit, ≤2 satır aksiyonu.
5. İkincil kolonlar "Kolonlar (N gizli)" arkasında; telefonda seçilmiş alanlarla kart/liste.
6. Fiyat/stok inline edit: Enter kaydeder, Esc iptal, hücre başına "Kaydedildi ✓", kaydedilmemiş değişiklik korunur.
7. Taslak itişi = adım başına tek soru, "Adım x/y", ürün verisinden ön-dolu, kaldığı yerden devam.
8. Onay yalnız geri dönüşsüz dış yazımda (push, silme) ve sonucu söyler; gerisi geri al/toast.
9. Otomatik açılan popup, dekoratif panel, tekrar link yok; kritik aksiyon Ayarlar'a gömülmez.
10. Tek anlamsal renk seti (başarı/uyarı/tehlike + metin/ikon), 2-3 punto, kutu yerine boşluk; aynı anlam her ekranda.

Çekince: KPI sayısı için NN/g sayı vermez; "geri al > onay" uzman konsensüsü; Stripe/Linear bilgisi üçüncü taraf yorumudur.
