# Amuletta 2.0 — rota envanteri ve silme planı (2026-11-04, salt okunur tarama)

Sahibin tanımladığı üç iş: **A** muhasebe (satış, maliyet, kâr), **B** yeni
listing önerilerini Etsy'ye göndermek, **C** listing stok ve fiyat düzenlemesi.

## Silinecek rotalar ve arkalarında ölen kod

| Rota | İş | Ölen kod | Kalan kodda referans |
|---|---|---|---|
| `arsiv` | Etsy görsel/video arşivi | `components/archive/*`, `lib/db/queries/listing-archive.ts`, `lib/etsy/media.ts` | nav-items |
| `gorsel-uretim/**` | Higgsfield foto kiti | `components/photo-kit/*`, `lib/photo-kit/{higgsfield,types}.ts` + prompts.json, `lib/db/queries/{generated-images,photo-production}.ts`, `app/api/gorsel/indir` | yok (`lib/photo-kit/strip-metadata.ts` KALIR: create-listing kullanıyor) |
| `indirimler` | bundle indirim eşleme | `components/discount/bundle-manager.tsx`, `lib/db/queries/discount-bundles.ts` | `reprice-actions.ts:287` revalidatePath; `lib/discount.ts` KALIR |
| `rehber` | statik kılavuz | yok | yok |
| `reklamlar/ice-aktar` | Ads CSV | `components/csv-import/ads-*`, `lib/csv/mappers/etsy-ads*` | nav-items; `ads-actions.ts` + `lib/ads/meta.ts` KALIR (alerts, digest) |
| `seo-etiketleri` | 13 tag panosu | `components/seo/seo-tag-board.tsx`, `lib/db/queries/seo-tags.ts` | nav-items; diagnostics.ts (zaten yetim) |
| `seo-yardimcisi` | başlık/tag üreteci | `components/seo/seo-helper-console.tsx`, `lib/seo/keyword-engine.ts` | yok |
| `sosyal/**` | içerik takvimi | `components/social/*`, `lib/db/queries/social.ts`, `lib/validations/social.ts` | yok |
| `yorumlar/**` | yorum + Gemini yanıt | `components/{review-form,review-response-panel,review-status-badge,rating-stars}.tsx`, `lib/db/queries/reviews.ts`, `lib/validations/review.ts`, `lib/ai.ts` | nav-items; `data-gaps.ts:72`; `lib/whats-new.ts`; `lib/digest/collect.ts` |
| `tasarimlar/bolumler/**` | anlam bölümleri | `components/chapters/*`, `lib/db/queries/listing-redesigns.ts` | `tasarimlar/page.tsx:215`; `lib/collections/chapters` + `queries/chapters` KALIR |
| `tasarimlar/pano` | tasarım panosu + video | `components/brand/pano-video-background.tsx`, `components/design-board/new-collection-form.tsx`, `design-status-badge.tsx`, `lib/validations/design-board.ts`, `pano/actions.ts` | `tasarimlar/page.tsx:197` |
| `tasarimlar/iyilestir` | açıklama denetimi | `components/listing-audit-board.tsx`, `iyilestir/actions.ts` | `tasarimlar/page.tsx:209`; `alerts.ts:488`; `lib/db/queries/listing-audit.ts` KALIR |
| `tasarimlar/[id]/duzenle` + `tasarimlar/yeni` | tasarım kaydı editörü | `components/design-form.tsx`, `components/design-board/{board-canvas,delete-board-button,new-board-form}.tsx`, `lib/db/queries/{designs,design-boards}.ts`, `lib/validations/design.ts` | yok |
| `listing-onerileri/artifact-2027` | tek seferlik 2027 kataloğu | klasördeki 12 dosya, `lib/artifact-2027/{catalog.ts,catalog.json,price-plan.ts}` | yok; `weight-plan.ts` + `jpeg-size.ts` KALIR |
| `ayarlar/pinterest` | Pinterest OAuth | `pinterest-connect-form.tsx`, `lib/pinterest/client.ts`, `app/api/pinterest/*` | settings-hub:105; `queries/pinterest` ayarlar sayfasında |
| `ayarlar/shopier` | Shopier senkron | `components/shopier-*`, `lib/shopier/*` | settings-hub:85; `lib/platform.ts:6` |
| `ayarlar/shopify` | Shopify OAuth | `shopify-connect-form.tsx`, `lib/shopify/*`, `app/api/shopify/*`, `app/api/ops/shopify-sync` | settings-hub:95; `lib/platform.ts:5`; `lib/supabase/middleware.ts:17` |
| `ayarlar/gunluk-ozet` | günlük e-posta özeti | `digest-settings-card.tsx`, `lib/digest/*`, `lib/email/*`, `app/api/digest/preview` | settings-hub:139 (gönderen cron YOK) |
| `ayarlar/etsy-guncellemeleri` | Etsy duyuruları | `lib/etsy-updates.ts` | settings-hub:145 |
| `ayarlar/buyume-stratejisi` | SEO/AEO notları | `lib/growth-roadmap.ts` | settings-hub:151 |

**Dikkat:** `app/(dashboard)/tasarimlar/actions.ts` KALIR;
`product-weight-input.tsx` `updateProductWeight`i kullanıyor ve kalan
`variant-editor.tsx` onu çağırıyor. Yalnız `createCollection`, `createDesign`,
`updateDesign`, `deleteDesign` gider.

**Bugün zaten yetim:** `components/{auto-refresh,cart-status-badge,delta-badge,
etsy-listing-grid,star-seller-cards,task-status-badge}.tsx`,
`components/panel/{panel-timeline,panel-diagnostic-card}.tsx`,
`components/diagnostics/diagnostic-board.tsx`, `components/pins/person-pin-edge.tsx`,
`components/layout/section-pattern.tsx`, `lib/db/queries/diagnostics.ts`,
`brand/{animated-logo,brand-hero,scroll-story}.tsx`,
`motion/{ambient-pointer,pressable,reveal}.tsx`, `.tl-shimmer`, `.liquid-bubble`,
`.jg-pressable`, `.h-serif`, `.ab-*` sınıfları.

## Panel ana sayfası (`panel/page.tsx`, 918 satır)

Kalacak: LoopStatus (listing döngüsü + kâr döngüsü), sadeleştirilmiş uyarı
merkezi, altın şeridi, gelir/maliyet trendi + 4 KPI, maliyet dağılımı.
Gidecek: SceneCutouts, GoldStream, WhatsNew (olmayan `/yildiz-satici`e
bağlanıyor), MarketPriceAlerts (rakip bandı), günlük sipariş grafiği, en iyi
müşteriler, satış kanalları, EditorialCard, SleepingBoxes, oturum senkron
popup'ı (PanelSyncPrompt; kurulum şeridi Satış & Maliyet sayfasında zaten var).

## Nav

`nav-items.ts`: `/seo-etiketleri`, `/arsiv`, `/reklamlar/ice-aktar`, "Müşteri"
grubu (`/yorumlar`) silinir. `whats-new-nav.tsx` olmayan `/yenilikler`e
bağlanıyor: `components/whats-new{,-badge}.tsx` + `lib/whats-new.ts` ile
birlikte silinir. `topbar.tsx` yalnız `/panel` ve `/kurulum`.

Uyarı türleri: silinen rotaya işaret edenler (`listing_audit_*` →
iyilestir, `ads_budget_eater` → reklamlar, yorum veri boşluğu → yorumlar) ve
zaten olmayan rotaya işaret edenler (`/analizler`, `/analizler/urunler`,
`/gorevler`) temizlenir; iş dışı türler (`inquiries_open`, `ads_wasted`,
`views_no_orders`, `revenue_decline`, `manual_metrics_stale`, `tasks_p0_open`)
kaldırılır.

## API ve cron

- `vercel.json` cron'ları (`etsy-sync`, `shipstation-sync`, `etsy-variants`) KALIR.
- 410 döndüren kapalı taslaklar silinir: `api/cron/{gold-reprice,reprice}`.
- Yalnız silinen sayfalara hizmet edenler silinir: `api/digest/preview`,
  `api/gorsel/indir`, `api/pinterest/*`, `api/shopify/*`, `api/ops/shopify-sync`.
- Boşa düşecek env değişkenleri: `PINTEREST_*`, `SHOPIFY_*`, `RESEND_*`,
  `EMAIL_FROM`, `GMAIL_*`, `SMTP_*`, `GEMINI_API_KEY`,
  `GOOGLE_GENERATIVE_AI_API_KEY`, `AI_GATEWAY_API_KEY`, `AI_MODEL`.
- `api/ops/*` tek seferlik bakım rotaları: çoğu B/C işine hizmet eder, dokunulmaz.

## Tema (`globals.css`, 2.563 satır)

`:root` 76 değişkeni `.dark`ta yeniden tanımlıyor. En çok kullanılan sınıflar:
`nm-pressed` 34 dosya, `page-stack` 28, `idx` 25, `nm-raised-sm` 14,
`scroll-x` 12, `glass-fluted` 10, `nm-raised` 8, `glass-board` 7. Holo
(sky/lilac/pink/peach/mint) palet, `holo-drift`, `lux-grain`, `jg-*` 27 sınıf
ve `frost-*` 15 sınıf yeni temada kaldırılacak gürültünün ana kaynağı.
