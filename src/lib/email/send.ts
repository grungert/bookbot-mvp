import { getResend, FROM_EMAIL } from "./resend";
import { BookingConfirmationEmail } from "./templates/booking-confirmation";
import { CancellationNoticeEmail } from "./templates/cancellation-notice";
import { AppointmentReminderEmail } from "./templates/appointment-reminder";
import { UpgradeRequestUserEmail } from "./templates/upgrade-request-user";
import { UpgradeRequestAdminEmail } from "./templates/upgrade-request-admin";
import { UpgradeApprovedEmail } from "./templates/upgrade-approved";
import { UpgradeRejectedEmail } from "./templates/upgrade-rejected";
import { InvoiceSentEmail } from "./templates/invoice-sent";
import { InvoicePaidEmail } from "./templates/invoice-paid";
import { NewBookingAdminEmail } from "./templates/new-booking-admin";
import { format } from "date-fns";
import prisma from "@/lib/prisma";

// Helper to fetch bank settings from database
async function getBankSettings() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: { in: ["BANK_NAME", "BANK_ACCOUNT_NAME", "BANK_IBAN", "BANK_BIC"] },
      },
    });

    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return {
      bankName: settingsMap["BANK_NAME"] || "Bank Name",
      bankAccountName: settingsMap["BANK_ACCOUNT_NAME"] || "BookBot d.o.o.",
      bankIban: settingsMap["BANK_IBAN"] || "RS00 0000 0000 0000 0000 00",
      bankBic: settingsMap["BANK_BIC"] || "XXXXXXXX",
    };
  } catch (error) {
    console.error("Error fetching bank settings:", error);
    return {
      bankName: "Bank Name",
      bankAccountName: "BookBot d.o.o.",
      bankIban: "RS00 0000 0000 0000 0000 00",
      bankBic: "XXXXXXXX",
    };
  }
}

interface AppointmentEmailData {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  startTime: Date;
  duration: number;
  companyName: string;
  notes?: string;
}

export async function sendBookingConfirmationEmail(data: AppointmentEmailData) {
  const { customerEmail, customerName, serviceName, startTime, duration, companyName, notes } = data;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Appointment Confirmed - ${companyName}`,
      react: BookingConfirmationEmail({
        customerName,
        serviceName,
        date: format(startTime, "EEEE, MMMM d, yyyy"),
        time: format(startTime, "h:mm a"),
        duration,
        companyName,
        notes,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
    return { success: false, error };
  }
}

export async function sendCancellationEmail(data: Omit<AppointmentEmailData, "notes" | "duration">) {
  const { customerEmail, customerName, serviceName, startTime, companyName } = data;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Appointment Cancelled - ${companyName}`,
      react: CancellationNoticeEmail({
        customerName,
        serviceName,
        date: format(startTime, "EEEE, MMMM d, yyyy"),
        time: format(startTime, "h:mm a"),
        companyName,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
    return { success: false, error };
  }
}

export async function sendAppointmentReminderEmail(data: Omit<AppointmentEmailData, "notes">) {
  const { customerEmail, customerName, serviceName, startTime, duration, companyName } = data;

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Appointment Reminder - ${companyName}`,
      react: AppointmentReminderEmail({
        customerName,
        serviceName,
        date: format(startTime, "EEEE, MMMM d, yyyy"),
        time: format(startTime, "h:mm a"),
        duration,
        companyName,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    return { success: false, error };
  }
}

interface AppointmentUpdateEmailData {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  startTime: Date;
  companyName: string;
  previousStartTime?: Date;
}

export async function sendAppointmentUpdateEmail(data: AppointmentUpdateEmailData) {
  const { customerEmail, customerName, serviceName, startTime, companyName, previousStartTime } = data;

  try {
    const resend = getResend();
    const newDate = format(startTime, "EEEE, MMMM d, yyyy");
    const newTime = format(startTime, "h:mm a");

    let body = `Hello ${customerName},\n\nYour appointment at ${companyName} has been updated.\n\n`;
    body += `Service: ${serviceName}\n`;
    body += `New Date: ${newDate}\n`;
    body += `New Time: ${newTime}\n`;

    if (previousStartTime) {
      body += `\nPrevious Date: ${format(previousStartTime, "EEEE, MMMM d, yyyy")}\n`;
      body += `Previous Time: ${format(previousStartTime, "h:mm a")}\n`;
    }

    body += `\nIf you have any questions, please contact us.\n\nBest regards,\n${companyName}`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Appointment Updated - ${companyName}`,
      text: body,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send appointment update email:", error);
    return { success: false, error };
  }
}

interface UpgradeRequestUserEmailData {
  userEmail: string;
  userName: string;
  planName: string;
  includeChatbot: boolean;
  extraCompanyCount: number;
  basePrice: number;
  chatbotPrice: number;
  extraCompaniesPrice: number;
  totalMonthlyPrice: number;
  paymentReference: string;
}

export async function sendUpgradeRequestUserEmail(data: UpgradeRequestUserEmailData) {
  const {
    userEmail,
    userName,
    planName,
    includeChatbot,
    extraCompanyCount,
    basePrice,
    chatbotPrice,
    extraCompaniesPrice,
    totalMonthlyPrice,
    paymentReference,
  } = data;

  try {
    const resend = getResend();
    const bankSettings = await getBankSettings();

    console.log("[EMAIL] Sending upgrade request user email to:", userEmail);
    console.log("[EMAIL] FROM_EMAIL:", FROM_EMAIL);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Upgrade Request Received - BookBot`,
      react: UpgradeRequestUserEmail({
        userName,
        planName,
        includeChatbot,
        extraCompanyCount,
        basePrice,
        chatbotPrice,
        extraCompaniesPrice,
        totalMonthlyPrice,
        bankName: bankSettings.bankName,
        bankAccountName: bankSettings.bankAccountName,
        bankIban: bankSettings.bankIban,
        bankBic: bankSettings.bankBic,
        paymentReference,
      }),
    });
    console.log("[EMAIL] User email result:", JSON.stringify(result));
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send upgrade request user email:", error);
    return { success: false, error };
  }
}

interface UpgradeRequestAdminEmailData {
  userName: string;
  userEmail: string;
  planName: string;
  includeChatbot: boolean;
  extraCompanyCount: number;
  basePrice: number;
  chatbotPrice: number;
  extraCompaniesPrice: number;
  totalMonthlyPrice: number;
  paymentReference: string;
  requestId: string;
}

export async function sendUpgradeRequestAdminEmail(data: UpgradeRequestAdminEmailData) {
  const {
    userName,
    userEmail,
    planName,
    includeChatbot,
    extraCompanyCount,
    basePrice,
    chatbotPrice,
    extraCompaniesPrice,
    totalMonthlyPrice,
    paymentReference,
    requestId,
  } = data;

  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("SUPER_ADMIN_EMAIL not set, skipping admin notification");
    return { success: false, error: "Admin email not configured" };
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";
  const adminPanelUrl = `${baseUrl}/en/super-admin/upgrade-requests`;

  try {
    const resend = getResend();
    console.log("[EMAIL] Sending upgrade request admin email to:", adminEmail);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `New Upgrade Request - ${userName || userEmail}`,
      react: UpgradeRequestAdminEmail({
        userName,
        userEmail,
        planName,
        includeChatbot,
        extraCompanyCount,
        basePrice,
        chatbotPrice,
        extraCompaniesPrice,
        totalMonthlyPrice,
        paymentReference,
        adminPanelUrl,
        requestId,
      }),
    });
    console.log("[EMAIL] Admin email result:", JSON.stringify(result));
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send upgrade request admin email:", error);
    return { success: false, error };
  }
}

interface UpgradeApprovedEmailData {
  userEmail: string;
  userName: string;
  planName: string;
  includeChatbot: boolean;
  extraCompanyCount: number;
}

export async function sendUpgradeApprovedEmail(data: UpgradeApprovedEmailData) {
  const { userEmail, userName, planName, includeChatbot, extraCompanyCount } = data;

  try {
    const resend = getResend();
    console.log("[EMAIL] Sending upgrade approved email to:", userEmail);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Subscription Activated - BookBot`,
      react: UpgradeApprovedEmail({
        userName,
        planName,
        includeChatbot,
        extraCompanyCount,
      }),
    });
    console.log("[EMAIL] Upgrade approved email result:", JSON.stringify(result));
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send upgrade approved email:", error);
    return { success: false, error };
  }
}

interface UpgradeRejectedEmailData {
  userEmail: string;
  userName: string;
  planName: string;
  adminNotes?: string;
}

export async function sendUpgradeRejectedEmail(data: UpgradeRejectedEmailData) {
  const { userEmail, userName, planName, adminNotes } = data;

  try {
    const resend = getResend();
    console.log("[EMAIL] Sending upgrade rejected email to:", userEmail);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Upgrade Request Update - BookBot`,
      react: UpgradeRejectedEmail({
        userName,
        planName,
        adminNotes,
      }),
    });
    console.log("[EMAIL] Upgrade rejected email result:", JSON.stringify(result));
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send upgrade rejected email:", error);
    return { success: false, error };
  }
}

// Invoice Emails

interface InvoiceSentEmailData {
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  currency: string;
  companyName: string;
  invoiceUrl?: string;
}

export async function sendInvoiceSentEmail(data: InvoiceSentEmailData) {
  const {
    customerEmail,
    customerName,
    invoiceNumber,
    issueDate,
    dueDate,
    total,
    currency,
    companyName,
    invoiceUrl,
  } = data;

  try {
    const resend = getResend();
    console.log("[EMAIL] Sending invoice email to:", customerEmail);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Invoice #${invoiceNumber} from ${companyName}`,
      react: InvoiceSentEmail({
        customerName,
        invoiceNumber,
        issueDate: format(issueDate, "MMMM d, yyyy"),
        dueDate: format(dueDate, "MMMM d, yyyy"),
        total: total.toLocaleString("en-US", { minimumFractionDigits: 2 }),
        currency,
        companyName,
        invoiceUrl,
      }),
    });
    console.log("[EMAIL] Invoice sent email result:", JSON.stringify(result));
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send invoice email:", error);
    return { success: false, error };
  }
}

interface InvoicePaidEmailData {
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  paidDate: Date;
  total: number;
  currency: string;
  companyName: string;
}

export async function sendInvoicePaidEmail(data: InvoicePaidEmailData) {
  const {
    customerEmail,
    customerName,
    invoiceNumber,
    paidDate,
    total,
    currency,
    companyName,
  } = data;

  try {
    const resend = getResend();
    console.log("[EMAIL] Sending invoice paid email to:", customerEmail);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: `Payment Received - Invoice #${invoiceNumber}`,
      react: InvoicePaidEmail({
        customerName,
        invoiceNumber,
        paidDate: format(paidDate, "MMMM d, yyyy"),
        total: total.toLocaleString("en-US", { minimumFractionDigits: 2 }),
        currency,
        companyName,
      }),
    });
    console.log("[EMAIL] Invoice paid email result:", JSON.stringify(result));
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send invoice paid email:", error);
    return { success: false, error };
  }
}

// Admin Notification Emails

interface NewBookingAdminEmailData {
  adminEmail: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  startTime: Date;
  duration: number;
  companyName: string;
  appointmentUrl?: string;
}

export async function sendNewBookingAdminEmail(data: NewBookingAdminEmailData) {
  const {
    adminEmail,
    customerName,
    customerEmail,
    serviceName,
    startTime,
    duration,
    companyName,
    appointmentUrl,
  } = data;

  try {
    const resend = getResend();
    console.log("[EMAIL] Sending new booking admin notification to:", adminEmail);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `New Booking - ${serviceName} with ${customerName}`,
      react: NewBookingAdminEmail({
        customerName,
        customerEmail,
        serviceName,
        date: format(startTime, "EEEE, MMMM d, yyyy"),
        time: format(startTime, "h:mm a"),
        duration,
        companyName,
        appointmentUrl,
      }),
    });
    console.log("[EMAIL] New booking admin email result:", JSON.stringify(result));
    return { success: true };
  } catch (error) {
    console.error("[EMAIL] Failed to send new booking admin email:", error);
    return { success: false, error };
  }
}
