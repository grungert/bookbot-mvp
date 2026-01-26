/**
 * Message Formatter for Channel Integrations
 *
 * Converts rich UI components (service cards, date picker, time slots)
 * to text-based format suitable for WhatsApp and other messaging channels.
 */

import type { ChatUIComponent, ChatService, ChatTimeSlot, ChatBookingData } from "@/components/chat/types";
import type { OutgoingMessage, ListSection, MessageButton } from "./types";
import { getTranslator, type TranslatorFn } from "@/lib/i18n/backend";

/**
 * Format currency with proper symbol
 */
function formatCurrency(amount: number, currency: string): string {
  if (currency === "RSD") {
    return `${amount.toLocaleString()} RSD`;
  }
  if (currency === "EUR") {
    return `€${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Calculate discounted price for a service
 */
function getEffectivePrice(service: ChatService): { original: number; discounted: number | null } {
  const now = new Date();
  const hasActiveDiscount =
    service.discountType &&
    service.discountValue &&
    (!service.discountStartDate || new Date(service.discountStartDate) <= now) &&
    (!service.discountEndDate || new Date(service.discountEndDate) >= now);

  if (!hasActiveDiscount) {
    return { original: service.price, discounted: null };
  }

  const discountedPrice =
    service.discountType === "percentage"
      ? service.price * (1 - (service.discountValue || 0) / 100)
      : service.price - (service.discountValue || 0);

  return { original: service.price, discounted: Math.max(0, discountedPrice) };
}

/**
 * Format a service for text display
 */
function formatServiceText(service: ChatService, index: number): string {
  const { original, discounted } = getEffectivePrice(service);
  const priceText = discounted !== null
    ? `~${formatCurrency(original, service.currency)}~ ${formatCurrency(discounted, service.currency)}`
    : formatCurrency(original, service.currency);

  const badge = service.promotionalBadge || service.customBadgeLabel;
  const badgeText = badge ? ` [${badge}]` : "";

  return `${index + 1}. *${service.name}*${badgeText}
   ${service.duration} min | ${priceText}
   ${service.description || ""}`.trim();
}

/**
 * Format service selector UI for WhatsApp
 */
function formatServicesForWhatsApp(services: ChatService[], t: TranslatorFn): OutgoingMessage {
  // For 3 or fewer services, use buttons
  if (services.length <= 3) {
    const buttons: MessageButton[] = services.map((s, i) => ({
      id: `service_${s.id}`,
      label: s.name.substring(0, 20), // WhatsApp button label max 20 chars
    }));

    const servicesText = services
      .map((s, i) => formatServiceText(s, i))
      .join("\n\n");

    return {
      to: "", // Will be set by caller
      content: `${t("botChat.whatsapp.selectService")}\n\n${servicesText}`,
      buttons,
      header: t("botChat.whatsapp.ourServices"),
    };
  }

  // For more services, use a list
  const sections: ListSection[] = [
    {
      title: t("botChat.whatsapp.availableServices"),
      items: services.map((s) => {
        const { original, discounted } = getEffectivePrice(s);
        const price = discounted !== null ? discounted : original;
        return {
          id: `service_${s.id}`,
          title: s.name.substring(0, 24), // Max 24 chars for list title
          description: `${s.duration} min | ${formatCurrency(price, s.currency)}`.substring(0, 72),
        };
      }),
    },
  ];

  const servicesText = services
    .map((s, i) => formatServiceText(s, i))
    .join("\n\n");

  return {
    to: "",
    content: `${t("botChat.whatsapp.selectService")}\n\n${servicesText}\n\n${t("botChat.whatsapp.orChooseFromList")}`,
    listSections: sections,
    listButtonText: t("botChat.whatsapp.viewServices"),
  };
}

/**
 * Format date picker UI for WhatsApp
 * Since WhatsApp doesn't have a date picker, we offer common date options
 */
function formatDatePickerForWhatsApp(serviceName: string, t: TranslatorFn, language?: string): OutgoingMessage {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const locale = language === "sr" ? "sr-Latn" : "en-US";
  const formatDate = (d: Date) => {
    const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
    return d.toLocaleDateString(locale, options);
  };

  const todayLabel = t("botChat.whatsapp.today", { date: formatDate(today) }).substring(0, 20);
  const tomorrowLabel = t("botChat.whatsapp.tomorrow", { date: formatDate(tomorrow) }).substring(0, 20);

  const buttons: MessageButton[] = [
    { id: `date_${today.toISOString().split("T")[0]}`, label: todayLabel },
    { id: `date_${tomorrow.toISOString().split("T")[0]}`, label: tomorrowLabel },
    { id: `date_${dayAfter.toISOString().split("T")[0]}`, label: formatDate(dayAfter).substring(0, 20) },
  ];

  return {
    to: "",
    content: `${t("botChat.whatsapp.selectedService", { serviceName })}\n\n${t("botChat.whatsapp.selectDate")}\n\n1. ${todayLabel}\n2. ${tomorrowLabel}\n3. ${formatDate(dayAfter)}\n\n${t("botChat.whatsapp.orTypeDate")}`,
    buttons,
    header: t("botChat.whatsapp.selectDateHeader"),
  };
}

/**
 * Format time slots UI for WhatsApp
 */
function formatTimeSlotsForWhatsApp(
  serviceName: string,
  date: string,
  dateISO: string,
  slots: ChatTimeSlot[],
  t: TranslatorFn
): OutgoingMessage {
  if (slots.length === 0) {
    return {
      to: "",
      content: t("botChat.whatsapp.noSlotsAvailable", { serviceName, date }),
    };
  }

  // For 3 or fewer slots, use buttons
  if (slots.length <= 3) {
    const buttons: MessageButton[] = slots.map((slot) => ({
      id: `time_${slot.startTime}`,
      label: slot.displayTime,
    }));

    const slotsText = slots
      .map((slot, i) => `${i + 1}. ${slot.displayTime}`)
      .join("\n");

    return {
      to: "",
      content: `${t("botChat.whatsapp.availableTimes", { serviceName, date })}\n\n${slotsText}\n\n${t("botChat.whatsapp.selectTime")}`,
      buttons,
      header: t("botChat.whatsapp.selectTimeHeader"),
    };
  }

  // For more slots, use a list or numbered text
  const sections: ListSection[] = [
    {
      title: t("botChat.whatsapp.availableTimesTitle"),
      items: slots.slice(0, 10).map((slot) => ({
        id: `time_${slot.startTime}`,
        title: slot.displayTime,
        description: t("botChat.whatsapp.bookServiceAt", { serviceName, time: slot.displayTime }),
      })),
    },
  ];

  const slotsText = slots
    .map((slot, i) => `${i + 1}. ${slot.displayTime}`)
    .join("\n");

  return {
    to: "",
    content: `${t("botChat.whatsapp.availableTimes", { serviceName, date })}\n\n${slotsText}\n\n${t("botChat.whatsapp.replyWithNumber")}`,
    listSections: sections,
    listButtonText: t("botChat.whatsapp.viewTimes"),
  };
}

/**
 * Format booking confirmation card for WhatsApp
 */
function formatBookingCardForWhatsApp(booking: ChatBookingData, t: TranslatorFn): OutgoingMessage {
  const statusEmoji = booking.status === "CONFIRMED" ? "✅" : "⏳";

  return {
    to: "",
    content: `${statusEmoji} *${t("botChat.whatsapp.bookingConfirmedTitle")}*\n\n📋 *${t("botChat.whatsapp.bookingService")}* ${booking.service}\n📅 *${t("botChat.whatsapp.bookingDate")}* ${booking.date}\n🕐 *${t("botChat.whatsapp.bookingTime")}* ${booking.time}\n⏱️ *${t("botChat.whatsapp.bookingDuration")}* ${booking.duration}${booking.price ? `\n💰 *${t("botChat.whatsapp.bookingPrice")}* ${booking.price}` : ""}\n\n📝 *${t("botChat.whatsapp.bookingId")}* ${booking.appointmentId.slice(-8).toUpperCase()}\n\n${t("botChat.whatsapp.bookingThankYou")}`,
  };
}

/**
 * Main formatter function
 * Converts rich UI components to WhatsApp-compatible messages
 */
export function formatForWhatsApp(
  textContent: string,
  ui?: ChatUIComponent,
  language?: string
): OutgoingMessage {
  const t = getTranslator(language);

  // No UI component - just return the text
  if (!ui) {
    return {
      to: "",
      content: textContent,
    };
  }

  // Format based on UI component type
  switch (ui.component) {
    case "service-selector":
      return formatServicesForWhatsApp(ui.props.services, t);

    case "date-picker":
      return formatDatePickerForWhatsApp(ui.props.serviceName, t, language);

    case "time-slots":
      return formatTimeSlotsForWhatsApp(
        ui.props.serviceName,
        ui.props.date,
        ui.props.dateISO,
        ui.props.slots,
        t
      );

    case "booking-card":
      return formatBookingCardForWhatsApp(ui.props, t);

    default:
      // Unknown UI component - just return the text
      return {
        to: "",
        content: textContent,
      };
  }
}

/**
 * Parse user selection from WhatsApp reply
 * Handles button replies, list replies, and text input
 */
export function parseWhatsAppSelection(
  messageType: string,
  content: string,
  replyId?: string
): {
  type: "service" | "date" | "time" | "text";
  value: string;
} | null {
  // Button/List reply with ID
  if (replyId) {
    if (replyId.startsWith("service_")) {
      return { type: "service", value: replyId.replace("service_", "") };
    }
    if (replyId.startsWith("date_")) {
      return { type: "date", value: replyId.replace("date_", "") };
    }
    if (replyId.startsWith("time_")) {
      return { type: "time", value: replyId.replace("time_", "") };
    }
  }

  // Text input - try to parse as number selection
  const num = parseInt(content.trim(), 10);
  if (!isNaN(num) && num > 0) {
    // This is a number selection - will be handled by context
    return { type: "text", value: content.trim() };
  }

  // Plain text input
  return { type: "text", value: content.trim() };
}

/**
 * Format a simple text message for WhatsApp
 */
export function formatTextMessage(to: string, content: string): OutgoingMessage {
  return {
    to,
    content,
  };
}

/**
 * Format an error message for WhatsApp
 */
export function formatErrorMessage(to: string, error: string, language?: string): OutgoingMessage {
  const t = getTranslator(language);
  return {
    to,
    content: `❌ ${error}\n\n${t("botChat.whatsapp.errorRetry")}`,
  };
}
