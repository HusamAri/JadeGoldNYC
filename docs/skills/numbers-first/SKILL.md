---
name: numbers-first
description: "Tablo/hesap teslimatlarında varsayılan format Apple Numbers'tır, Excel değil. Bu skill her tablo, hesap tablosu, spreadsheet, çalışma dosyası, veri girişi dosyası, fiyat/maliyet hesap dosyası, bütçe, rapor tablosu, katalog dökümü üretilirken TETİKLENİR — kullanıcı 'numbers', 'tablo', 'excel', 'spreadsheet', 'xlsx', 'csv', 'hesap dosyası', 'çalışma dosyası' dese de demese de, çıktı bir tablo dosyasıysa tetikle. Ayrıca xlsx skill'i tetiklendiğinde format kararı için bu skill ÖNCELİKLİDİR. Tetikleme: yalnız kullanıcı AÇIKÇA 'Microsoft Excel', 'Excel olsun', '.xlsx istiyorum' derse bu skill devre dışı kalır."
---

# Numbers birinci, Excel değil

Kullanıcı (Husam) Mac'te **Apple Numbers** kullanıyor. Tablo teslimatları ona göre
kurulur. **Kalıcı kural (2026-08-15 talimatı): Microsoft Excel açıkça istenmedikçe
Numbers kullan.**

Bu, `xlsx` skill'inin *format* tercihini ezer. O skill'in formül/kalite kuralları
(formül yaz, sonucu gömme; giriş hücrelerini işaretle; sıfır formül hatası)
geçerli kalır — yalnız hedef format değişir.

## Önce bu kısıtı bil: formüllü `.numbers` üretilemez

Bu ölçüldü, varsayım değil. Linux/konteyner ortamında formüllü bir `.numbers`
dosyası **üretilemez**:

| Yol | Sonuç |
|---|---|
| `numbers-parser` (4.19) | `.numbers` **yazar** — çok sekme, stil, yazı/arka plan rengi, kenarlık, hücre biçimi, başlık. Ama **formül yazamaz**: `=A2*106` düz `TextCell` olarak iner (`is_formula: False`). Kendi README'si: *"Formulas cannot be written to a document"* |
| Aspose.Cells | `.numbers`'ı **yalnız okur**. Pazarlama sayfası "kaydet" der, **kendi dokümanı** *"can read Numbers spreadsheets, but it does not support writing to them"* der — pazarlama sayfasına güvenme |
| Digits, apple-numbers-mcp, apple-numbers-automation | Formülü **gerçekten yazar** — çünkü AppleScript/JXA ile **Numbers.app'i sürerler**. `os: ["darwin"]`, macOS + Numbers kurulu + Otomasyon izni şart. Konteynerde çalışmaz |

Sonuç: **formüllü `.numbers`'ı yalnız Numbers.app üretebilir.**

## Karar ağacı

**1. Mac'te bir Numbers MCP sunucusu bağlı mı?** (`ListAgents`/tool listesinde
Digits ya da apple-numbers benzeri araç var mı — kontrol et, varsayma.)
→ Varsa **doğrudan `.numbers` üret**, formülleri gerçek formül olarak yaz. Bitti.

**2. Yoksa — çıktıda formül GEREKİYOR mu?**

- **Gerekiyorsa** (canlı hesap, veri girişi dosyası, kullanıcı gram/rakam
  girdikçe güncellenecek): **XLSX üret**, kullanıcıya Numbers'a çevirmesini söyle:
  *Numbers ile aç → Dosya > Farklı Kaydet → .numbers*. Numbers XLSX formüllerini
  native formüle çevirir, hesaplar canlı kalır.
  Bu ARA ADIMdır — **her seferinde açıkça söyle**, sessizce XLSX teslim etme.
- **Gerekmiyorsa** (statik rapor, döküm, okunacak liste): `numbers-parser` ile
  **doğrudan `.numbers` üret**. Stil ve renk tam çalışır, ara adım yok.

## Formül yazarken: ortak fonksiyon disiplini

XLSX üretiyorsan bile hedef Numbers'tır. Numbers'ın da bildiği fonksiyonlarla
sınırlı kal ki çeviride kırılmasın:

- **Güvenli:** `IF`, `OR`, `AND`, `NOT`, `ROUND`, `ROUNDUP`, `ROUNDDOWN`, `SUM`,
  `AVERAGE`, `MIN`, `MAX`, `COUNT`, `COUNTA`, `COUNTIF`, `SUMIF`, `VLOOKUP`,
  `INDEX`, `MATCH`, `ABS`, `CONCATENATE`, `LEN`, `LEFT`, `RIGHT`, `TRIM`
- **Kullanma:** `XLOOKUP`, `LET`, `LAMBDA`, `TEXTJOIN`, `IFS`, `SEQUENCE`,
  `FILTER`, dinamik dizi fonksiyonları, `_xlfn.*` ile başlayan her şey —
  Numbers bunları çevirmez, hücre hata verir.
- Koşullu biçim ve dondurulmuş başlık Numbers'a taşınır; **veri doğrulama
  (data validation) açılır listeleri taşınmayabilir** — kritikse ayrı sekmede
  düz liste olarak da bulundur.

## numbers-parser ile üretim (formülsüz yol)

Aşağıdaki her satır `numbers-parser` 4.19'a karşı gerçekten çalıştırıldı.

```python
from numbers_parser import Document, RGB
doc = Document()
doc.sheets[0].name = "Ayarlar"                # varsayılan sekmeyi YENİDEN ADLANDIR
doc.sheets[0].tables[0].name = "Ayarlar"      # tablo adı da değişir
doc.add_sheet("Veri")                          # sonraki sekmeler eklenir

doc.add_style(name="baslik", bold=True, font_size=11.0,
              font_color=RGB(255, 255, 255), bg_color=RGB(0x9A, 0x7A, 0x33))

t = doc.sheets["Ayarlar"].tables[0]
t.add_row(50); t.add_column(6)                 # varsayılan 12×8 — önce BÜYÜT
t.write(0, 0, "Başlık", style="baslik")        # str | int | float | bool | datetime
t.write("B2", 106.0)                           # A1 notasyonu da çalışır
doc.save("cikti.numbers")
```

Tuzaklar (hepsi ölçüldü):
- `Document()` **"Sheet 1"** adlı bir sekmeyle gelir ve **silinemez** —
  `del doc.sheets["Sheet 1"]` `TypeError: 'ItemsList' object does not support
  item deletion` verir. Doğrusu: `doc.sheets[0].name = "..."` ile yeniden
  adlandır, `add_sheet()`'i yalnız 2. sekmeden itibaren kullan. Yoksa dosyada
  boş bir "Sheet 1" kalır.
- Tablo varsayılan **12 satır × 8 sütun**. Sınır dışına `write()` yapmadan önce
  `add_row(n)` / `add_column(n)` ile büyüt.
- `font_size` **float** olmalı: `11` verirsen
  `TypeError: size must be a float number of points`. `11.0` yaz.
- Renk `RGB(r, g, b)` — hex string değil.
- Satır/sütun **0-indeksli**.
- `write()` formül kabul etmez — `"=A2*2"` yazarsan sessizce **metin** olur
  (`is_formula: False`). Bu hatayı yapma; formül gerekiyorsa karar ağacına dön.

## Teslim kuralları

- Dosya adında format belli olsun; kullanıcıya **hangi dosyayı nasıl açacağını**
  yaz.
- XLSX ara adımı kullandıysan sebebini **tek cümleyle** söyle — kullanıcı
  neden Excel gördüğünü bilmeli. Gerekçeyi commit/PR gövdesine gömüp
  kullanıcıya söylememek yeterli DEĞİLDİR (bu hata bir kez yapıldı).
- Kalıcı çözümü hatırlat: Mac'e [Digits](https://github.com/apeabody007/Digits)
  (`/plugin marketplace add apeabody007/digits`) ya da
  [apple-numbers-mcp](https://github.com/sweetrb/apple-numbers-mcp) kurulursa
  ara adım tamamen kalkar.

## Anti-örnekler

- ❌ Kullanıcı "numbers dosyası" dedi diye `.numbers` uzantılı ama içi XLSX olan
  dosya üretmek — Numbers açmaz, bozuk dosyadır.
- ❌ Formülleri Python'da hesaplayıp sonucu statik yazıp "Numbers'ta formül
  olmuyor" demek — kullanıcının veri girişi dosyası ölür. Doğrusu XLSX + çevirme.
- ❌ `.numbers` üretilemediği için sessizce XLSX verip geçmek.
- ❌ Aspose'un pazarlama sayfasına bakıp ".numbers kaydedebiliyorum" demek.
