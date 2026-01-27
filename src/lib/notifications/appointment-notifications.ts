import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
} from "@/lib/email/send";
import { whatsappAdapter } from "@/lib/channels/whatsapp";
import { getCompanyCredentials } from "@/lib/channels/whatsapp";
import { getTranslator } from "@/lib/i18n/backend";
import { format } from "date-fns";

interface NotificationChannelResult {
  success: boolean;
  sentAt: string;
  messageId?: string;
  error?: string;
}

export interface NotificationResult {
  email?: NotificationChannelResult;
  whatsapp?: NotificationChannelResult;
}

interface SendNotificationData {
  appointmentId: string;
  companyId: string;
  companyName: string;
  companyLanguage?: string;
  status: "CONFIRMED" | "CANCELLED";
  customerEmail?: string | null;
  customerName: string;
  serviceName: string;
  startTime: Date;
  duration: number;
  bookingChannel?: string | null;
  chatSessionId?: string | null;
}

export async function sendStatusChangeNotifications(
  data: SendNotificationData
): Promise<NotificationResult> {
  const result: NotificationResult = {};

  // 1. Email notification (always, if customer has email)
  if (data.customerEmail) {
    try {
      if (data.status === "CONFIRMED") {
        await sendBookingConfirmationEmail({
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          serviceName: data.serviceName,
          startTime: data.startTime,
          duration: data.duration,
          companyName: data.companyName,
        });
      } else if (data.status === "CANCELLED") {
        await sendCancellationEmail({
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          serviceName: data.serviceName,
          startTime: data.startTime,
          companyName: data.companyName,
        });
      }
      result.email = {
        success: true,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Failed to send notification email:", error);
      result.email = {
        success: false,
        sentAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // 2. WhatsApp notification (only if booked via WhatsApp and has chatSessionId)
  if (data.bookingChannel === "whatsapp" && data.chatSessionId) {
    try {
      // Look up the chat session to get the phone number
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: data.chatSessionId },
        select: { phoneNumber: true },
      });

      if (chatSession?.phoneNumber) {
        // Check company has WhatsApp credentials
        const credentials = await getCompanyCredentials(data.companyId);

        if (credentials) {
          const t = getTranslator(data.companyLanguage);
          const dateStr = format(data.startTime, "dd.MM.yyyy");
          const timeStr = format(data.startTime, "HH:mm");

          let messageText: string;
          if (data.status === "CONFIRMED") {
            messageText = t("notifications.whatsapp.confirmed", {
              service: data.serviceName,
              date: dateStr,
              time: timeStr,
            });
          } else {
            messageText = t("notifications.whatsapp.cancelled", {
              service: data.serviceName,
              date: dateStr,
              time: timeStr,
            });
          }

          const sendResult = await whatsappAdapter.send(
            {
              to: chatSession.phoneNumber,
              content: messageText,
            },
            data.companyId
          );

          result.whatsapp = {
            success: sendResult.success,
            sentAt: new Date().toISOString(),
            messageId: sendResult.messageId,
            error: sendResult.error,
          };

          // Save message to ChatMessage for conversation continuity
          if (sendResult.success) {
            const assistantMsg = await prisma.chatMessage.create({
              data: {
                sessionId: data.chatSessionId,
                role: "assistant",
                content: messageText,
                status: "sent",
                externalMsgId: sendResult.messageId || null,
              },
            });
            // Update with message ID if available
            if (sendResult.messageId && !assistantMsg.externalMsgId) {
              await prisma.chatMessage.update({
                where: { id: assistantMsg.id },
                data: { externalMsgId: sendResult.messageId },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to send WhatsApp notification:", error);
      result.whatsapp = {
        success: false,
        sentAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // 3. Update notificationLog on the Appointment
  try {
    await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { notificationLog: result as unknown as Prisma.InputJsonValue },
    });
  } catch (error) {
    console.error("Failed to update notification log:", error);
  }

  return result;
}
