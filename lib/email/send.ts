/**
 * Outbound e-posta — Gmail/Workspace SMTP öncelikli, Resend yedek.
 *
 * Gmail (Google Workspace):
 *   SMTP_USER=husam.ari@artifact-studio.com
 *   SMTP_PASS=<Google App Password>
 *   EMAIL_FROM="Jade Gold NYC <husam.ari@artifact-studio.com>"
 *   (opsiyonel) SMTP_HOST=smtp.gmail.com  SMTP_PORT=587
 *
 * Resend (yedek):
 *   RESEND_API_KEY=re_...
 *   RESEND_FROM_EMAIL=...
 */

import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string; skipped?: boolean };

function smtpUser(): string {
  return (
    process.env.SMTP_USER?.trim() ||
    process.env.GMAIL_USER?.trim() ||
    ""
  );
}

function smtpPass(): string {
  return (
    process.env.SMTP_PASS?.trim() ||
    process.env.GMAIL_APP_PASSWORD?.trim() ||
    ""
  );
}

export function isSmtpConfigured(): boolean {
  return Boolean(smtpUser() && smtpPass());
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function isEmailConfigured(): boolean {
  return isSmtpConfigured() || isResendConfigured();
}

export function defaultFromAddress(): string {
  const explicit =
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim();
  if (explicit) return explicit;

  const user = smtpUser();
  if (user) return `Amuletta <${user}>`;

  return "Amuletta <onboarding@resend.dev>";
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const user = smtpUser();
  const pass = smtpPass();
  if (!user || !pass) {
    return { ok: false, skipped: true, error: "SMTP kimlik bilgisi yok." };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  if (to.length === 0) return { ok: false, error: "Alıcı yok." };

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  const secure =
    process.env.SMTP_SECURE?.trim() === "1" ||
    process.env.SMTP_SECURE?.trim() === "true" ||
    port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: input.from ?? defaultFromAddress(),
      to: to.join(", "),
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    return { ok: true, id: info.messageId || "smtp" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "SMTP gönderim hatası";
    return { ok: false, error: msg };
  }
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      skipped: true,
      error: "RESEND_API_KEY yok — e-posta gönderilmedi.",
    };
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];
  if (to.length === 0) {
    return { ok: false, error: "Alıcı yok." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from ?? defaultFromAddress(),
      to,
      subject: input.subject,
      html: input.html,
      ...(input.replyTo ? { reply_to: input.replyTo } : {}),
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      ok: false,
      error:
        body.error?.message ||
        body.message ||
        `Resend HTTP ${res.status}`,
    };
  }

  return { ok: true, id: body.id ?? "unknown" };
}

/**
 * SMTP (Gmail) varsa onu kullan; yoksa Resend.
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  if (isSmtpConfigured()) return sendViaSmtp(input);
  if (isResendConfigured()) return sendViaResend(input);
  return {
    ok: false,
    skipped: true,
    error:
      "E-posta yapılandırılmadı — SMTP_USER/SMTP_PASS (Gmail) veya RESEND_API_KEY ekleyin.",
  };
}
