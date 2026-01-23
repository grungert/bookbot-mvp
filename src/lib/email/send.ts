import { getResend, FROM_EMAIL } from "./resend";
import { BookingConfirmationEmail } from "./templates/booking-confirmation";
import { CancellationNoticeEmail } from "./templates/cancellation-notice";
import { AppointmentReminderEmail } from "./templates/appointment-reminder";
import { UpgradeRequestUserEmail } from "./templates/upgrade-request-user";
import { UpgradeRequestAdminEmail } from "./templates/upgrade-request-admin";
import { format } from "date-fns";

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
    await resend.emails.send({
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
        bankName: process.env.BANK_NAME || "Bank Name",
        bankAccountName: process.env.BANK_ACCOUNT_NAME || "BookBot d.o.o.",
        bankIban: process.env.BANK_IBAN || "RS00 0000 0000 0000 0000 00",
        bankBic: process.env.BANK_BIC || "XXXXXXXX",
        paymentReference,
      }),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send upgrade request user email:", error);
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
    await resend.emails.send({
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
    return { success: true };
  } catch (error) {
    console.error("Failed to send upgrade request admin email:", error);
    return { success: false, error };
  }
}
