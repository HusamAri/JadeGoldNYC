/**
 * Resend HTTP istemcisi — ek paket yok; cron / server action kullanır.
 * https://resend.com/docs/api-reference/emails/send-email
 */

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

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function defaultFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Amuletta <onboarding@resend.dev>"
  );
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
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
