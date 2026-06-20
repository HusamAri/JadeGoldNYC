# Geliştirme Araçları (Claude Code)

Bu proje üzerinde çalışırken verimliliği artıran, değerlendirilmiş üç dış araç.
Hepsi **Claude Code geliştirme araçlarıdır** (üretim bağımlılığı değil) — yani
paneli daha iyi/hızlı *inşa etmek* için kullanılır, son ürüne dahil edilmez.

> Not: Bu ephemeral web ortamında kurulumlar oturumlar arası kalıcı değildir.
> Kalıcılık için aşağıdaki komutları yerel makinenizde veya ortam kurulum
> betiğinizde çalıştırın. `/plugin` komutları interaktif olduğundan kullanıcı
> tarafından çalıştırılır.

## 1. Superpowers — önerilen ✅
Agent için TDD / planlama / kod inceleme metodolojisi (MIT).
`/brainstorm`, `/write-plan`, `/execute-plan` ve yapılandırılmış inceleme akışı.

```
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

## 2. CodeGraph — önerilen (kod büyüdükçe) ✅
Kod tabanını tree-sitter + SQLite ile önceden indeksleyen MCP sunucusu; ajanların
gezinmesini ~%58 daha az araç çağrısı / ~%16 daha az token ile yapar (MIT).

```
# Kurulum (npm global) ve indeksleme
npm i -g codegraph        # veya repo README'sindeki tek satırlık kurulum betiği
codegraph init            # proje kökünde indeks oluştur (dosya değişiminde otomatik senkron)
```

Ardından bir MCP sunucusu olarak Claude Code'a ekleyin (komut: `codegraph mcp`).
`.mcp.json`'a eklenebilir; tam komutu repo README'siyle doğrulayın.

## 3. Harness — opsiyonel/deneysel 🟡
Doğal dil tanımından çok-ajanlı takım üretir (Apache-2.0). Yalnız çok-ajanlı
takım yaklaşımı istendiğinde.

```
/plugin marketplace add revfactory/harness
/plugin install harness@harness-marketplace
```

## Dahil edilmeyenler
LunarCrush, AWS Marketplace, Booking/Expedia/Tripadvisor, Spotify, Wix — bu proje
için ilgisiz.
