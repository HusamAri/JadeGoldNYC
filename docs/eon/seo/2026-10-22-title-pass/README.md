# Kısa başlık geçişi 2026-10-22 (EON 185 + by Artifact Studio 210)

Neden: 2026-10-21 matrisleri playbook 03'e aykırıydı (EON medyan 23 kelime, "Mens … for Him and Her",
"Free Engraving", 13 aynı başlık, 16 yanlış ayar; Artifact "Gift for Her/Him", ayarsız "Solid Gold").
Yeni: <15 kelime, ayar "Gold"dan önce ve panelin sattığı ayar kümesiyle aynı, alıcı/hediye/indirim
sözcüğü yok, kardeşler tekil. Tag'ler değişmez (alıcı/hediye aramaları orada).

- Başlıklar: `titles.tsv` (EON, tam id), `../../../artifact-studio/seo/2026-10-22-title-pass/titles.suffix.tsv` (id son 6 hane).
- Panel ayar kümesi: `panel-karats.json` (panelde ayar yoksa orijinal başlığın ayarı).
- Üret + kapı: `python3 scripts/seo/title_pass_2026_10_22.py` → iki `apply-matrix.json`.
  Aynı kapı 10-21 başlıklarında EON 181/185, Artifact 210/210 listing'de ihlal buldu.
- Uygula: `ops/seo-apply?org=<org>&pass=titles-2026-10-22&ids=<≤10>` (kuru), `&apply=1` yaz; her parti
  taze token'la kuru tekrar = `already`. Canlı başlık 10-21 yazımından farklıysa `live-changed` atlanır.
- Geri alma: `audit_log` `etsy.seo_push` `diff.before`.
