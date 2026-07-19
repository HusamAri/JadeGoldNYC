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
): string {
  if (severity === "kritik") return theme.danger;
  if (severity === "onemli") return theme.warn;
  return theme.muted;
}

function toneColor(
  tone: "up" | "down" | "flat" | "neutral" | undefined,
  theme: OrgDigest["theme"],
): string {
  if (tone === "up") return theme.ok;
  if (tone === "down") return theme.danger;
  return theme.muted;
}

/**
 * E-posta istemcisine uyumlu, marka paletli HTML digest.
 * Tablo düzeni + inline stil; harici CSS/font yok.
 */
export function renderDigestHtml(digest: OrgDigest): string {
  const t = digest.theme;

  const kpiCells = digest.kpis
    .map(
      (k) => `
      <td style="width:33%;padding:14px 12px;background:${t.surface};border:1px solid ${t.paper};vertical-align:top;">
        <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${t.muted};">${esc(k.label)}</div>
        <div style="font-size:22px;font-weight:600;color:${t.ink};margin-top:6px;font-variant-numeric:tabular-nums;">${esc(k.value)}</div>
        ${
          k.deltaLabel
            ? `<div style="font-size:12px;margin-top:4px;color:${toneColor(k.tone, t)};">${esc(k.deltaLabel)}</div>`
            : ""
        }
      </td>`,
    )
    .join("");

  const trendRows = digest.weekTrend
    .map(
      (d) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${t.paper};color:${t.ink};">${esc(d.label)}</td>
        <td style="padding:8px 0;border-bottom:1px solid ${t.paper};text-align:right;font-variant-numeric:tabular-nums;color:${t.ink};">${esc(d.revenueLabel)}</td>
        <td style="padding:8px 0;border-bottom:1px solid ${t.paper};text-align:right;font-variant-numeric:tabular-nums;color:${t.muted};">${d.orders}</td>
      </tr>`,
    )
    .join("");

  const actionRows =
    digest.actions.length === 0
      ? `<tr><td style="padding:12px 0;color:${t.ok};">Açık kritik aksiyon yok. Günün kontrolü temiz.</td></tr>`
      : digest.actions
          .map(
            (a) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${t.paper};vertical-align:top;">
          <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${severityColor(a.severity, t)};">${esc(a.severity)}</div>
          <div style="font-size:15px;font-weight:600;color:${t.ink};margin-top:4px;">${esc(a.title)}</div>
          <div style="font-size:13px;color:${t.muted};margin-top:4px;line-height:1.45;">${esc(a.hint)}</div>
          <a href="${esc(a.href)}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:${t.accent};text-decoration:none;">${esc(a.actionLabel)} →</a>
        </td>
      </tr>`,
          )
          .join("");

  const listBlock = (
    items: { whenLabel: string; summary: string }[],
    empty: string,
  ) =>
    items.length === 0
      ? `<p style="margin:0;color:${t.muted};font-size:13px;">${esc(empty)}</p>`
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
          .map(
            (i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid ${t.paper};width:7.5rem;vertical-align:top;font-size:12px;color:${t.muted};">${esc(i.whenLabel)}</td>
          <td style="padding:8px 0;border-bottom:1px solid ${t.paper};font-size:13px;color:${t.ink};">${esc(i.summary)}</td>
        </tr>`,
          )
          .join("")}</table>`;

  const suggestionRows =
    digest.suggestions.length === 0
      ? `<p style="margin:0;color:${t.muted};font-size:13px;">Bugün ek öneri yok; metrikler dengede görünüyor.</p>`
      : digest.suggestions
          .map(
            (s) => `
      <div style="padding:12px 0;border-bottom:1px solid ${t.paper};">
        <div style="font-size:14px;font-weight:600;color:${t.ink};">${esc(s.title)}</div>
        <div style="font-size:13px;color:${t.muted};margin-top:4px;line-height:1.45;">${esc(s.body)}</div>
        <a href="${esc(s.href)}" style="display:inline-block;margin-top:6px;font-size:12px;font-weight:600;color:${t.accent};text-decoration:none;">Panele git →</a>
      </div>`,
          )
          .join("");

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(t.brandName)} — Günlük özet</title>
</head>
<body style="margin:0;padding:0;background:${t.paper};color:${t.ink};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${t.paper};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${t.surface};border:1px solid ${t.accent}33;">
          <tr>
            <td style="padding:28px 28px 18px;background:${t.ink};color:${t.paper};">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.28em;color:${t.accent};">${esc(t.wordmark)}</div>
              <div style="font-size:26px;margin-top:10px;line-height:1.25;">Günlük mağaza özeti</div>
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;margin-top:8px;color:${t.muted};">${esc(digest.orgName)} · ${esc(digest.windowLabel)}</div>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 8px;font-family:Helvetica,Arial,sans-serif;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:10px;">Son 24 saat</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${kpiCells}</tr></table>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px;font-family:Helvetica,Arial,sans-serif;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:8px;">Gidişat · 7 gün</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <th align="left" style="font-size:11px;color:${t.muted};font-weight:500;padding-bottom:6px;">Gün</th>
                  <th align="right" style="font-size:11px;color:${t.muted};font-weight:500;padding-bottom:6px;">Gelir</th>
                  <th align="right" style="font-size:11px;color:${t.muted};font-weight:500;padding-bottom:6px;">Sipariş</th>
                </tr>
                ${trendRows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 18px;font-family:Helvetica,Arial,sans-serif;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:4px;">Aksiyon bekleyenler</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${actionRows}</table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 18px;font-family:Helvetica,Arial,sans-serif;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:8px;">Öneriler</div>
              ${suggestionRows}
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 18px;font-family:Helvetica,Arial,sans-serif;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:8px;">Neler oldu</div>
              ${listBlock(digest.happened, "Son 24 saatte kayda değer olay yok.")}
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 22px;font-family:Helvetica,Arial,sans-serif;">
              <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${t.accent};margin-bottom:8px;">Neler bitti</div>
              ${listBlock(digest.finished, "Kapanan görev/olay kaydı yok.")}
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px;background:${t.paper};font-family:Helvetica,Arial,sans-serif;text-align:center;">
              <a href="${esc(digest.panelUrl)}" style="display:inline-block;padding:12px 22px;background:${t.accent};color:${t.paper};text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.04em;">Panele git</a>
              <div style="margin-top:14px;font-size:11px;color:${t.muted};line-height:1.5;">
                Üretildi: ${esc(digest.generatedAtLabel)} · ${esc(t.brandName)}<br/>
                Bu özeti kapatmak için Ayarlar → Günlük özet.
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
  const rev = digest.kpis.find((k) => k.label.startsWith("Gelir"));
  const actions = digest.actions.filter((a) => a.severity === "kritik").length;
  const parts = [
    `${digest.theme.brandName}`,
    "günlük özet",
    rev ? rev.value : null,
    actions > 0 ? `${actions} kritik` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
