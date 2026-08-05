/**
 * Geriye dönük uyumluluk — asıl yol `lib/email/send.ts`
 * (Gmail SMTP öncelikli, Resend yedek).
 */
export {
  sendEmail,
  isEmailConfigured,
  defaultFromAddress,
  isSmtpConfigured,
  isResendConfigured,
  type SendEmailInput,
  type SendEmailResult,
} from "@/lib/email/send";
