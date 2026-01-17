import { getResend, FROM_EMAIL } from "./resend";
import { BookingConfirmationEmail } from "./templates/booking-confirmation";
import { CancellationNoticeEmail } from "./templates/cancellation-notice";
import { AppointmentReminderEmail } from "./templates/appointment-reminder";
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
