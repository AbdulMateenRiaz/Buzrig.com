import { env } from '../../config/env.js'
import { logger } from '../../lib/logger.js'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Send an email using Resend API.
 * Falls back to console logging if RESEND_API_KEY isn't set.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const resendKey = (env as any).RESEND_API_KEY || process.env.RESEND_API_KEY

  if (!resendKey) {
    // Fallback: log the email content (for development)
    logger.info({
      to: options.to,
      subject: options.subject,
      note: 'Email not sent — RESEND_API_KEY not configured. Email content logged below.',
    }, 'Email (dev mode)')
    logger.info(options.html, 'Email HTML body')
    return true // pretend it sent successfully in dev
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Buzrig <noreply@buzrig.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error({ status: response.status, error }, 'Failed to send email via Resend')
      return false
    }

    logger.info({ to: options.to, subject: options.subject }, 'Email sent successfully')
    return true
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Email sending failed')
    return false
  }
}

/**
 * Build the password reset email HTML
 */
export function buildResetEmail(resetUrl: string, userName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; padding: 40px 20px; }
        .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 40px; }
        .logo { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 24px; }
        .logo span { color: #e02020; }
        h1 { font-size: 20px; color: #111827; margin: 0 0 12px; }
        p { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 16px; }
        .btn { display: inline-block; background: #e02020; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo"><span>●</span> BUZRIG</div>
        <h1>Reset your password</h1>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" class="btn">Reset Password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <div class="footer">
          <p>Buzrig — Autonomous AI Pentesting</p>
        </div>
      </div>
    </body>
    </html>
  `
}
