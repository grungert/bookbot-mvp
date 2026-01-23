/**
 * Email sending functionality using Resend or Gmail (Nodemailer)
 */

import { Resend } from "resend";
import nodemailer from "nodemailer";

// Email provider configuration
type EmailProvider = "resend" | "gmail" | "smtp" | "none";

function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return "gmail";
  if (process.env.SMTP_HOST) return "smtp";
  return "none";
}

// Initialize Resend if API key is provided
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Initialize Nodemailer transporter for Gmail or custom SMTP
function createNodemailerTransport() {
  const provider = getEmailProvider();

  if (provider === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  if (provider === "smtp") {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return null;
}

const nodemailerTransport = createNodemailerTransport();

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.GMAIL_USER || "noreply@example.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const APP_NAME = "BookBot";

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: string = "en"
): Promise<SendEmailResult> {
  const resetUrl = `${APP_URL}/${locale}/reset-password/${token}`;

  const subject =
    locale === "sr"
      ? "Resetovanje lozinke - BookBot"
      : "Reset Your Password - BookBot";

  const html =
    locale === "sr"
      ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #3B82F6; margin-bottom: 10px;">${APP_NAME}</h1>
  </div>

  <h2 style="color: #1f2937;">Resetovanje lozinke</h2>

  <p>Primili smo zahtev za resetovanje lozinke za vaš nalog.</p>

  <p>Kliknite na dugme ispod da biste postavili novu lozinku:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Resetuj lozinku</a>
  </div>

  <p style="color: #6b7280; font-size: 14px;">Ovaj link ističe za 1 sat.</p>

  <p style="color: #6b7280; font-size: 14px;">Ako niste zatražili resetovanje lozinke, možete ignorisati ovaj email.</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Ovaj email je poslat sa ${APP_NAME}. Ako imate pitanja, kontaktirajte nas.
  </p>
</body>
</html>
`
      : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #3B82F6; margin-bottom: 10px;">${APP_NAME}</h1>
  </div>

  <h2 style="color: #1f2937;">Reset Your Password</h2>

  <p>We received a request to reset the password for your account.</p>

  <p>Click the button below to set a new password:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Reset Password</a>
  </div>

  <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>

  <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    This email was sent from ${APP_NAME}. If you have any questions, please contact us.
  </p>
</body>
</html>
`;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send an email verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  locale: string = "en"
): Promise<SendEmailResult> {
  const verifyUrl = `${APP_URL}/${locale}/verify-email/${token}`;

  const subject =
    locale === "sr"
      ? "Potvrdite vašu email adresu - BookBot"
      : "Verify Your Email - BookBot";

  const html =
    locale === "sr"
      ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #3B82F6; margin-bottom: 10px;">${APP_NAME}</h1>
  </div>

  <h2 style="color: #1f2937;">Dobrodošli u ${APP_NAME}!</h2>

  <p>Hvala vam što ste se registrovali. Molimo vas da potvrdite vašu email adresu klikom na dugme ispod:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${verifyUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Potvrdi email</a>
  </div>

  <p style="color: #6b7280; font-size: 14px;">Ovaj link ističe za 24 sata.</p>

  <p style="color: #6b7280; font-size: 14px;">Ako se niste registrovali na ${APP_NAME}, možete ignorisati ovaj email.</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    Ovaj email je poslat sa ${APP_NAME}. Ako imate pitanja, kontaktirajte nas.
  </p>
</body>
</html>
`
      : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #3B82F6; margin-bottom: 10px;">${APP_NAME}</h1>
  </div>

  <h2 style="color: #1f2937;">Welcome to ${APP_NAME}!</h2>

  <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${verifyUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">Verify Email</a>
  </div>

  <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>

  <p style="color: #6b7280; font-size: 14px;">If you didn't sign up for ${APP_NAME}, you can safely ignore this email.</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
    This email was sent from ${APP_NAME}. If you have any questions, please contact us.
  </p>
</body>
</html>
`;

  return sendEmail({ to: email, subject, html });
}

/**
 * Unified email sending function that supports multiple providers
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const provider = getEmailProvider();

  // In development without any provider, log and return success
  if (provider === "none") {
    console.log(`[DEV] Email would be sent to: ${to}`);
    console.log(`[DEV] Subject: ${subject}`);
    // Extract URL from HTML for easy copying
    const urlMatch = html.match(/href="(http[^"]+)"/);
    if (urlMatch) {
      console.log(`[DEV] Action URL: ${urlMatch[1]}`);
    }
    return { success: true, messageId: "dev-mode" };
  }

  // Send via Resend
  if (provider === "resend" && resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });

      if (error) {
        console.error("Failed to send email via Resend:", error);
        return { success: false, error: error.message };
      }

      return { success: true, messageId: data?.id };
    } catch (err) {
      console.error("Error sending email via Resend:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  // Send via Gmail or SMTP (Nodemailer)
  if ((provider === "gmail" || provider === "smtp") && nodemailerTransport) {
    try {
      const info = await nodemailerTransport.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`Error sending email via ${provider}:`, err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  return { success: false, error: "No email provider configured" };
}
