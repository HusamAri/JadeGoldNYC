import { digestAssetUrl } from "@/lib/digest/brand";
import type { OrgDigest } from "@/lib/digest/types";

function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function severityColor(
  severity: "kritik" | "onemli" | "bilgi",
  theme: OrgDigest["theme"],
  dark = false,
): string {
  const t = dark ? theme.dark : theme;
  if (severity === "kritik") return t.danger;
  if (severity === "onemli") return t.warn;
  return t.muted;
}

function toneColor(
  tone: "up" | "down" | "flat" | "neutral" | undefined,
  theme: OrgDigest["theme"],
): string {
  if (tone === "up") return theme.ok;
  if (tone === "down") return theme.danger;
  return theme.muted;
}

function kpiTable(
  kpis: OrgDigest["kpis"],
  theme: OrgDigest["theme"],
): string {
  if (kpis.length === 0) return "";
  const cells = kpis
    .map(
      (k) => `
      <td class="d-card" style="width:${Math.floor(100 / Math.min(kpis.length, 3))}%;padding:14px 12px;background:${theme.card};border:1px solid ${theme.border};border-radius:14px;vertical-align:top;">
        <div class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${theme.muted};">${esc(k.label)}</div>
        <div class="d-ink" style="font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:600;color:${theme.ink};margin-top:8px;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;">${esc(k.value)}</div>
        ${
          k.deltaLabel
            ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;margin-top:6px;color:${toneColor(k.tone, theme)};">${esc(k.deltaLabel)}</div>`
            : ""
        }
      </td>`,
    )
    .join('<td style="width:10px;"></td>');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>`;
}

function sectionHead(
  eyebrow: string,
  title: string,
  theme: OrgDigest["theme"],
  hint?: string,
): string {
  return `
    <div style="border-left:3px solid ${theme.accent};padding-left:14px;margin-bottom:14px;">
      <div class="d-accent" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${theme.accent};">${esc(eyebrow)}</div>
      <div class="d-ink" style="font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:600;color:${theme.ink};margin-top:4px;">${esc(title)}</div>
      ${
        hint
          ? `<div class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${theme.muted};margin-top:4px;line-height:1.45;">${esc(hint)}</div>`
          : ""
      }
    </div>`;
}

function sectionPad(inner: string): string {
  return `<tr><td style="padding:22px 28px 8px;font-family:Helvetica,Arial,sans-serif;">${inner}</td></tr>`;
}

/**
 * Panel görseline yakın HTML digest.
 * Dış zemin: holo-drift JPG (açık/koyu). Kart: cam yüzeyi.
 * `@media (prefers-color-scheme: dark)` ile panel dark token’ları.
 */
export function renderDigestHtml(digest: OrgDigest): string {
  const t = digest.theme;
  const d = t.dark;
  const s = digest.prefs.sections;
  const bgLight = digestAssetUrl(t.bgImage);
  const bgDark = digestAssetUrl(d.bgImage);

  const lensChips = (
    [
      s.performance && "Satış",
      s.ads && "Reklam",
      s.actions && "Uyarılar",
      s.priceTips && "Fiyat",
      s.engagement && "İlgilenme",
      s.team && "Ekip",
      s.activity && "Aktivite",
    ].filter(Boolean) as string[]
  )
    .map(
      (label) =>
        `<span class="d-chip" style="display:inline-block;margin:0 6px 6px 0;padding:5px 10px;border:1px solid ${t.border};border-radius:999px;background:${t.card};font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${t.ink};">${esc(label)}</span>`,
    )
    .join("");

  const trendRows = digest.weekTrend
    .map(
      (day) => `
      <tr>
        <td class="d-ink d-rule" style="padding:9px 0;border-bottom:1px solid ${t.border};color:${t.ink};font-size:13px;">${esc(day.label)}</td>
        <td class="d-ink d-rule" style="padding:9px 0;border-bottom:1px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;color:${t.ink};font-size:13px;">${esc(day.revenueLabel)}</td>
        <td class="d-muted d-rule" style="padding:9px 0;border-bottom:1px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;color:${t.muted};font-size:13px;">${day.orders}</td>
      </tr>`,
    )
    .join("");

  const actionRows =
    digest.actions.length === 0
      ? `<tr><td style="padding:12px 0;color:${t.ok};font-family:Helvetica,Arial,sans-serif;font-size:13px;">Açık kritik uyarı yok. Günün kontrolü temiz.</td></tr>`
      : digest.actions
          .map(
            (a) => `
      <tr>
        <td class="d-rule" style="padding:14px 0;border-bottom:1px solid ${t.border};vertical-align:top;">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${severityColor(a.severity, t)};">${esc(a.severity)}</div>
          <div class="d-ink" style="font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:${t.ink};margin-top:4px;">${esc(a.title)}</div>
          <div class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${t.muted};margin-top:4px;line-height:1.45;">${esc(a.hint)}</div>
          <a class="d-accent" href="${esc(a.href)}" style="display:inline-block;margin-top:8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:${t.accent};text-decoration:none;">${esc(a.actionLabel)} →</a>
        </td>
      </tr>`,
          )
          .join("");

  const listBlock = (
    items: { whenLabel: string; summary: string }[],
    empty: string,
  ) =>
    items.length === 0
      ? `<p class="d-muted" style="margin:0;color:${t.muted};font-family:Helvetica,Arial,sans-serif;font-size:13px;">${esc(empty)}</p>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
          .map(
            (i) => `
        <tr>
          <td class="d-muted d-rule" style="padding:9px 0;border-bottom:1px solid ${t.border};width:7.5rem;vertical-align:top;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${t.muted};">${esc(i.whenLabel)}</td>
          <td class="d-ink d-rule" style="padding:9px 0;border-bottom:1px solid ${t.border};font-size:13px;color:${t.ink};line-height:1.4;font-family:Helvetica,Arial,sans-serif;">${esc(i.summary)}</td>
        </tr>`,
          )
          .join("")}</table>`;

  const suggestionRows =
    digest.suggestions.length === 0
      ? `<p class="d-muted" style="margin:0;color:${t.muted};font-family:Helvetica,Arial,sans-serif;font-size:13px;">Bugün ek öneri yok; metrikler dengede görünüyor.</p>`
      : digest.suggestions
          .map(
            (sug) => `
      <div class="d-rule" style="padding:12px 0;border-bottom:1px solid ${t.border};">
        <div class="d-ink" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${t.ink};">${esc(sug.title)}</div>
        <div class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${t.muted};margin-top:4px;line-height:1.45;">${esc(sug.body)}</div>
        <a class="d-accent" href="${esc(sug.href)}" style="display:inline-block;margin-top:6px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:${t.accent};text-decoration:none;">Panele git →</a>
      </div>`,
          )
          .join("");

  const priceRows =
    digest.priceTips.length === 0
      ? `<p class="d-muted" style="margin:0;color:${t.muted};font-family:Helvetica,Arial,sans-serif;font-size:13px;">Açık fiyat önerisi yok (veya hepsi karara bağlandı).</p>`
      : digest.priceTips
          .map(
            (tip, idx) => `
      <tr>
        <td class="d-accent d-rule" style="padding:12px 0;border-bottom:1px solid ${t.border};vertical-align:top;width:28px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${t.accent};font-weight:700;">${idx + 1}</td>
        <td class="d-rule" style="padding:12px 0;border-bottom:1px solid ${t.border};vertical-align:top;">
          <div class="d-ink" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:${t.ink};">${esc(tip.title)}</div>
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${tip.position === "pahali" ? t.warn : t.ok};margin-top:3px;">${tip.position === "pahali" ? "pahalı kaldı" : "çok ucuz"}</div>
          <div class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${t.muted};margin-top:4px;line-height:1.45;">${esc(tip.body)}</div>
          <a class="d-accent" href="${esc(tip.href)}" style="display:inline-block;margin-top:6px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:${t.accent};text-decoration:none;">Listing’e git →</a>
        </td>
      </tr>`,
          )
          .join("");

  const eng = digest.engagement;
  const engagementBlock = !eng
    ? ""
    : `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>
          <td class="d-header" style="width:88px;height:88px;background:${t.headerBg};border-radius:16px;text-align:center;vertical-align:middle;">
            <div style="font-family:Helvetica,Arial,sans-serif;font-size:28px;font-weight:700;color:${t.headerInk};">${eng.shopScore}</div>
            <div class="d-header-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:${t.headerMuted};">/ 100</div>
          </td>
          <td style="width:14px;"></td>
          <td style="vertical-align:middle;">
            <div class="d-ink" style="font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:${t.ink};">${esc(eng.shopLabel)}</div>
            <div class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${t.muted};margin-top:4px;">Pencere: ${esc(eng.windowLabel)}</div>
          </td>
        </tr>
      </table>
      ${
        eng.movers.length === 0
          ? `<p class="d-muted" style="margin:0;color:${t.muted};font-family:Helvetica,Arial,sans-serif;font-size:13px;">Hareket eden listing yok.</p>`
          : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <th align="left" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">Listing</th>
                <th align="right" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">Skor</th>
                <th align="right" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">Δ görüntüle</th>
                <th align="right" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">Δ favori</th>
              </tr>
              ${eng.movers
                .map(
                  (m) => `
              <tr>
                <td class="d-ink d-rule" style="padding:8px 0;border-bottom:1px solid ${t.border};font-size:13px;color:${t.ink};font-family:Helvetica,Arial,sans-serif;">${esc(m.title)}</td>
                <td class="d-accent d-rule" style="padding:8px 0;border-bottom:1px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;font-weight:600;color:${t.accent};">${m.score}</td>
                <td class="d-ink d-rule" style="padding:8px 0;border-bottom:1px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;color:${t.ink};">+${m.deltaViews}</td>
                <td class="d-muted d-rule" style="padding:8px 0;border-bottom:1px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;color:${t.muted};">${m.deltaFavorers >= 0 ? "+" : ""}${m.deltaFavorers}</td>
              </tr>`,
                )
                .join("")}
            </table>`
      }`;

  const teamRows =
    digest.teamPresence.length === 0
      ? `<p class="d-muted" style="margin:0;color:${t.muted};font-family:Helvetica,Arial,sans-serif;font-size:13px;">Son 24 saatte panel aktivitesi yok.</p>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <th align="left" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">Üye</th>
            <th align="right" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">Süre ≈</th>
            <th align="right" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">İşlem</th>
          </tr>
          ${digest.teamPresence
            .map(
              (p) => `
          <tr>
            <td class="d-ink d-rule" style="padding:9px 0;border-bottom:1px solid ${t.border};font-size:14px;color:${t.ink};font-family:Helvetica,Arial,sans-serif;">${esc(p.name)}</td>
            <td class="d-ink d-rule" style="padding:9px 0;border-bottom:1px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;font-weight:600;color:${t.ink};">${esc(p.minutesLabel)}</td>
            <td class="d-muted d-rule" style="padding:9px 0;border-bottom:1px solid ${t.border};text-align:right;font-variant-numeric:tabular-nums;color:${t.muted};">${p.events}</td>
          </tr>`,
            )
            .join("")}
        </table>
        <p class="d-muted" style="margin:10px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${t.muted};">Süre, panel işlemlerinin zaman aralığından yaklaşık hesaplanır.</p>`;

  const bodySections = [
    lensChips
      ? sectionPad(`<div style="margin-bottom:4px;">${lensChips}</div>`)
      : "",
    s.performance
      ? sectionPad(`
          ${sectionHead("Lens · satış", "Son 24 saat", t, "Gelir ve sipariş — önceki 24 saate kıyas.")}
          ${kpiTable(digest.kpis, t)}`)
      : "",
    s.ads
      ? sectionPad(`
          ${sectionHead("Lens · reklam", "Reklam (son 30)", t, "product_metrics anlığından — Etsy Ads panosuyla çapraz kontrol et.")}
          ${kpiTable(digest.adsKpis, t)}
          <div style="margin-top:12px;">
            <a class="d-accent" href="${esc(digest.adsHref)}" style="font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;color:${t.accent};text-decoration:none;">Reklamlar panosuna git →</a>
          </div>`)
      : "",
    s.trend
      ? sectionPad(`
          ${sectionHead("Lens · gidişat", "7 günlük trend", t)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <th align="left" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">Gün</th>
              <th align="right" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">Gelir</th>
              <th align="right" class="d-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:10px;color:${t.muted};font-weight:500;padding-bottom:6px;">Sipariş</th>
            </tr>
            ${trendRows}
          </table>`)
      : "",
    s.actions
      ? sectionPad(`
          ${sectionHead("Lens · uyarılar", "Açık uyarılar", t, "Bugün bakılması gerekenler.")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${actionRows}</table>`)
      : "",
    s.closedAlerts
      ? sectionPad(`
          ${sectionHead("Lens · kapananlar", "Kapanan uyarılar", t, "Son 24 saatte çözülenler.")}
          ${listBlock(digest.closedAlerts, "Kapanan uyarı yok.")}`)
      : "",
    s.priceTips
      ? sectionPad(`
          ${sectionHead("Lens · fiyat", "En değerli 5 fiyat önerisi", t, "Sapma × güven × fiyat farkına göre sıralı.")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${priceRows}</table>`)
      : "",
    s.engagement
      ? sectionPad(`
          ${sectionHead("Lens · ilgilenme", "Sayfa ilgilenme skoru", t, "Son iki senkron günü arasındaki görüntülenme ve favori hareketi.")}
          ${engagementBlock}`)
      : "",
    s.team
      ? sectionPad(`
          ${sectionHead("Lens · ekip", "Panelde kim ne kadar", t)}
          ${teamRows}`)
      : "",
    s.suggestions
      ? sectionPad(`
          ${sectionHead("Lens · öneri", "Öneriler", t)}
          ${suggestionRows}`)
      : "",
    s.activity
      ? `${sectionPad(`
          ${sectionHead("Lens · aktivite", "Neler oldu", t, "Yalnız ekip üyelerinin yaptığı işler — sistem güncellemeleri hariç.")}
          ${listBlock(digest.happened, "Son 24 saatte kullanıcı işlemi yok.")}`)}${sectionPad(`
          ${sectionHead("Lens · bitti", "Neler bitti", t)}
          ${listBlock(digest.finished, "Kapanan görev kaydı yok.")}`)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${esc(t.brandName)} — Günlük özet</title>
<style>
  :root { color-scheme: light dark; }
  @media (prefers-color-scheme: dark) {
    .d-outer {
      background-color: ${d.paper} !important;
      background-image: url('${esc(bgDark)}') !important;
    }
    .d-shell {
      background-color: ${d.surface} !important;
      border-color: ${d.border} !important;
    }
    .d-header { background-color: ${d.headerBg} !important; color: ${d.headerInk} !important; }
    .d-header-muted { color: ${d.headerMuted} !important; }
    .d-foot { background-color: ${d.card} !important; }
    .d-ink { color: ${d.ink} !important; }
    .d-muted { color: ${d.muted} !important; }
    .d-accent { color: ${d.accent} !important; }
    .d-card { background-color: ${d.card} !important; border-color: ${d.border} !important; }
    .d-chip { background-color: ${d.card} !important; border-color: ${d.border} !important; color: ${d.ink} !important; }
    .d-rule { border-bottom-color: ${d.border} !important; }
    .d-btn { background-color: ${d.accent} !important; color: ${d.paper} !important; }
  }
</style>
</head>
<body class="d-outer" style="margin:0;padding:0;background-color:${t.paper};background-image:url('${esc(bgLight)}');background-size:cover;background-position:center top;background-repeat:no-repeat;color:${t.ink};font-family:Helvetica,Arial,sans-serif;">
  <!--[if gte mso 9]>
  <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
    <v:fill type="frame" src="${esc(bgLight)}" color="${t.paper}"/>
  </v:background>
  <![endif]-->
  <table role="presentation" class="d-outer" width="100%" cellpadding="0" cellspacing="0" style="background-color:${t.paper};background-image:url('${esc(bgLight)}');background-size:cover;background-position:center top;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" class="d-shell" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background-color:${t.surface};border:1px solid ${t.border};border-radius:16px;overflow:hidden;box-shadow:0 18px 40px rgba(36,40,53,0.08);">
          <tr>
            <td class="d-header" style="padding:32px 28px 24px;background:${t.headerBg};color:${t.headerInk};">
              <div class="d-header-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.32em;color:${t.headerMuted};">${esc(t.wordmark)}</div>
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:26px;font-weight:600;margin-top:12px;line-height:1.2;letter-spacing:-0.02em;">Günlük mağaza brifingi</div>
              <div class="d-header-muted" style="font-family:Helvetica,Arial,sans-serif;font-size:13px;margin-top:10px;color:${t.headerMuted};line-height:1.5;opacity:0.9;">${esc(digest.orgName)} · ${esc(digest.windowLabel)}</div>
            </td>
          </tr>

          ${bodySections}

          <tr>
            <td class="d-foot" style="padding:28px 28px 24px;background:${t.card};font-family:Helvetica,Arial,sans-serif;text-align:center;">
              <a class="d-btn" href="${esc(digest.panelUrl)}" style="display:inline-block;padding:13px 24px;background:${t.accent};color:${t.surface};text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.04em;border-radius:999px;">Panele git</a>
              <div class="d-muted" style="margin-top:16px;font-size:11px;color:${t.muted};line-height:1.55;">
                Üretildi: ${esc(digest.generatedAtLabel)} · ${esc(t.brandName)}<br/>
                Bölümleri aç/kapa: <a class="d-accent" href="${esc(digest.settingsHref)}" style="color:${t.accent};text-decoration:none;">Ayarlar → Günlük özet</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderDigestSubject(digest: OrgDigest): string {
  const rev = digest.prefs.sections.performance
    ? digest.kpis.find((k) => k.label.startsWith("Gelir"))
    : null;
  const actions = digest.prefs.sections.actions
    ? digest.actions.filter((a) => a.severity === "kritik").length
    : 0;
  const score =
    digest.prefs.sections.engagement && digest.engagement
      ? `ilgi ${digest.engagement.shopScore}`
      : null;
  const parts = [
    `${digest.theme.brandName}`,
    "günlük özet",
    rev ? rev.value : null,
    actions > 0 ? `${actions} kritik` : null,
    score,
  ].filter(Boolean);
  return parts.join(" · ");
}
