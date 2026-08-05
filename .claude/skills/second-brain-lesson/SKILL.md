---
name: second-brain-lesson
description: Bir işin sonunda o işten çıkan dersi kalıcı "second brain" dosyasına tek satır-blok olarak yazma protokolü. HER uçtan uca işin son adımında (kod, veri, analiz, doküman, ops — fark etmez), kullanıcıya "bitti" demeden ÖNCE tetiklenir. Ayrıca şu ifadelerde tetiklenir - "dersi ekle", "second brain'e yaz", "bunu not et", "ders çıkar", "hafızaya al", "lesson learned", "add the lesson", "write this down for next time". Amaç - aynı hatayı iki kez yapmamak, işe yarayan yöntemi bir daha aramamak.
---

# Second brain — ders yazma protokolü

Bir iş bittiğinde **çıktı teslim edilir, ders kaydedilir.** Ders kaydedilmezse
bir sonraki oturum aynı yanlış varsayımdan başlar. Bu protokol her repoda,
her bağlamda aynıdır.

## Ne zaman

Şu üçü birden doğruysa yaz:

1. İş **uçtan uca bitti** (yalnız bir adım değil) ve doğrulandı.
2. O işte **öğrenilen bir şey var**: bir varsayım çürüdü, bir dış sistem
   beklendiği gibi davranmadı, bir doğrulama yöntemi işe yaradı, bir tuzağa
   düşüldü.
3. Ders **gelecekte davranış değiştirir** — yalnız "şunu yaptık" değil.

Bunlardan biri eksikse YAZMA. Dosyayı jenerik tavsiyeyle şişirmek, gerçek
derslerin okunmamasına yol açar.

## Nereye

Sırayla ara, ilk bulduğuna yaz:

1. `docs/second-brain.md`
2. Repo kökünde `SECOND-BRAIN.md` / `docs/lessons.md` / benzeri (grep: `second.brain|lessons.learned`)
3. Repo'nun `CLAUDE.md`/`AGENTS.md`'sinde işaret edilen dosya
4. Hiçbiri yoksa: `docs/second-brain.md` OLUŞTUR, başına protokol paragrafını
   yaz, ve `CLAUDE.md`'ye `@docs/second-brain.md` satırını ekle (her oturumda
   yüklensin diye).

Repo dışı / kişisel bağlamda (Barceló işi, Curated Chaos, kişisel karar) bu
skill'i kullanma — `vault-second-brain` skill'ine devret.

## Nasıl — biçim

Tek madde, tek blok. Şablon:

```
- **<Kural, emir kipiyle, tek cümle> (<YYYY-MM>):** <ne oldu — somut vaka,
  sayı/dosya/hata mesajıyla>. <neden oldu — kök neden>. Kural: <bir dahaki
  sefere ne yapılacak, uygulanabilir biçimde>. <Varsa: bunu ne kanıtladı>.
```

Kurallar:

- **Başlık kural olsun, olay değil.** "Etsy 404 aldık" değil; "Base URL zaten
  `/application` içeriyor — path'e ikincisini yazma".
- **Somut kanıt taşı**: dosya yolu, sayı, hata metni, SQL sonucu. Kanıtsız ders
  bir sonraki oturumda ikna etmez.
- **Nasıl doğrulandığını yaz.** Çoğu ders "kod doğru görünüyordu ama canlı
  ölçüm başka söyledi" biçimindedir; ölçüm yöntemi dersin yarısıdır.
- Dosyanın mevcut bölümlerine (süreç / ürün-UX / teknik gibi) uy; yeni bölüm
  açma.
- Uzunluk: 3-8 satır. Daha uzunsa ayrı bir doküman yaz, buraya tek satırla link ver.

## Bakım — her yazımda üç kontrol

1. **Tekrar varsa güçlendir, yenisini açma.** Aynı kuralın ikinci vakası
   geldiyse mevcut maddeye `Güçlendirme (<tarih>): <yeni vaka>` ekle. İki ayrı
   madde = iki zayıf ders.
2. **Çürüyeni sil.** Artık geçerli olmayan (API değişti, mimari değişti) maddeyi
   kaldır; sessizce bırakma.
3. **Geri çekilen teşhisi düzelt.** Bir ders yanlış çıktıysa üstünü çizme —
   maddeyi düzelt ve *neden yanıldığını* kurala dönüştür. En değerli dersler
   bunlardır.

## Teslim

Ders dosyası **işin commit'ine dahil edilir** — ayrı bir "sonra yazarım" adımı
yok. Scratchpad'e veya sohbete bırakılan ders ekip için yok hükmündedir ve
konteynerle birlikte ölür.

Kullanıcıya bitişi bildirirken dersi tek cümleyle özetle; tam metni tekrar
yapıştırma.

## Anti-örnekler (bunları yazma)

- "Değişikliklerden sonra typecheck çalıştırmak önemli." — jenerik, kimseye
  bir şey öğretmiyor.
- "Kullanıcı X istedi, yaptık." — olay kaydı, ders değil.
- "Dikkatli olmak gerekiyor." — uygulanabilir değil.
- Aynı turda 5 madde. Bir uçtan uca iş genelde 1, en fazla 2 gerçek ders üretir.
