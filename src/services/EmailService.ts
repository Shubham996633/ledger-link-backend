import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '@/utils/logger';

export class EmailService {
  private transporter: Transporter | null = null;
  private fromAddress: string;
  private frontendUrl: string;

  constructor() {
    this.fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@ledgerlink.app';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      logger.warn('SMTP not fully configured — emails will be logged instead of sent');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      logger.info(`[EMAIL DRY-RUN] To: ${to} | Subject: ${subject}\n${html}`);
      return;
    }
    await this.transporter.sendMail({
      from: `"Ledger Link" <${this.fromAddress}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  }

  async sendPasswordReset(to: string, token: string, username?: string): Promise<void> {
    const url = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const html = this.template(
      'Reset your password',
      `Hi ${username || 'there'},`,
      `We received a request to reset your Ledger Link password. Click the button below to set a new one. This link expires in 1 hour.`,
      'Reset Password',
      url,
      `If you didn't request a reset, you can safely ignore this email.`
    );
    await this.send(to, 'Reset your Ledger Link password', html);
  }

  async sendEmailVerification(to: string, token: string, username?: string): Promise<void> {
    const url = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const html = this.template(
      'Verify your email',
      `Hi ${username || 'there'},`,
      `Click the button below to verify your email address and unlock all Ledger Link features.`,
      'Verify Email',
      url,
      `If you didn't sign up, you can ignore this email.`
    );
    await this.send(to, 'Verify your Ledger Link email', html);
  }

  private template(
    title: string,
    greeting: string,
    body: string,
    ctaLabel: string,
    ctaUrl: string,
    footer: string
  ): string {
    return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#161b22;border:1px solid #30363d;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:32px 40px 16px;">
            <div style="font-size:20px;font-weight:700;color:#e6edf3;">⛓ Ledger Link</div>
          </td></tr>
          <tr><td style="padding:0 40px;">
            <h1 style="color:#e6edf3;font-size:22px;margin:8px 0 24px;">${title}</h1>
            <p style="color:#c9d1d9;font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting}</p>
            <p style="color:#8b949e;font-size:14px;line-height:1.6;margin:0 0 28px;">${body}</p>
            <a href="${ctaUrl}" style="display:inline-block;background:#238636;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;font-size:14px;">${ctaLabel}</a>
            <p style="color:#6e7681;font-size:13px;line-height:1.6;margin:28px 0 0;">Or paste this link into your browser:<br/><span style="color:#58a6ff;word-break:break-all;">${ctaUrl}</span></p>
          </td></tr>
          <tr><td style="padding:32px 40px;border-top:1px solid #30363d;margin-top:32px;">
            <p style="color:#6e7681;font-size:12px;line-height:1.5;margin:0;">${footer}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  }
}
