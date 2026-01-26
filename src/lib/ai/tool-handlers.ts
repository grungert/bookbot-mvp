import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { getAvailableSlots, isSlotAvailable } from "@/lib/utils/slots";
import { sendBookingConfirmationEmail, sendNewBookingAdminEmail } from "@/lib/email/send";
import { addMinutes, format, parseISO } from "date-fns";
import type {
  ToolParams,
  GetServicesParams,
  GetDatePickerParams,
  GetAvailableSlotsParams,
  CreateBookingParams,
  SearchAppointmentsParams,
  UpdateBookingStateParams,
} from "./tools";
import type { ChatUIComponent } from "@/components/chat/types";
import { handleUpdateBookingState } from "./booking-flow";
import { getTranslator } from "@/lib/i18n/backend";
import { getDateLocale } from "@/lib/i18n/date-locale";

// Context passed to tool handlers
export interface ToolContext {
  companyId: string;
  companyName: string;
  companySlug?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  sessionId?: string;
  language?: string;
}

// Result returned from tool handlers
export interface ToolResult {
  success: boolean;
  data?: unknown;
  userMessage: string;
  ui?: ChatUIComponent;
}

// Main handler that routes to specific tool handlers
export async function executeToolAction(
  context: ToolContext,
  params: ToolParams
): Promise<ToolResult> {
  switch (params.tool) {
    case "getServices":
      return handleGetServices(context);
    case "getDatePicker":
      return handleGetDatePicker(context, params);
    case "getAvailableSlots":
      return handleGetAvailableSlots(context, params);
    case "createBooking":
      return handleCreateBooking(context, params);
    case "searchAppointments":
      return handleSearchAppointments(context, params);
    case "updateBookingState": {
      const t = getTranslator(context.language);
      if (!context.sessionId) {
        return { success: false, userMessage: t("botChat.sessionNotAvailable") };
      }
      return handleUpdateBookingState(context, context.sessionId, {
        serviceId: params.serviceId,
        serviceName: params.serviceName,
        date: params.date,
      });
    }
    default: {
      const t = getTranslator(context.language);
      return {
        success: false,
        userMessage: t("botChat.unknownTool", { tool: (params as { tool: string }).tool }),
      };
    }
  }
}

// Get list of available services
async function handleGetServices(context: ToolContext): Promise<ToolResult> {
  const t = getTranslator(context.language);
  const services = await prisma.service.findMany({
    where: { companyId: context.companyId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      duration: true,
      price: true,
      currency: true,
      color: true,
      discountType: true,
      discountValue: true,
      discountStartDate: true,
      discountEndDate: true,
      promotionalBadge: true,
      customBadgeLabel: true,
    },
    orderBy: { name: "asc" },
  });

  if (services.length === 0) {
    return {
      success: true,
      data: [],
      userMessage: t("botChat.noServicesAvailable"),
    };
  }

  const formattedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description || "No description",
    duration: `${s.duration} minutes`,
    price: `${s.currency} ${s.price}`,
  }));

  // UI data for service selector
  const uiServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration: s.duration,
    price: Number(s.price),
    currency: s.currency,
    color: s.color,
    discountType: s.discountType as "percentage" | "fixed" | null,
    discountValue: s.discountValue ? Number(s.discountValue) : null,
    discountStartDate: s.discountStartDate?.toISOString() ?? null,
    discountEndDate: s.discountEndDate?.toISOString() ?? null,
    promotionalBadge: s.promotionalBadge,
    customBadgeLabel: s.customBadgeLabel,
  }));

  return {
    success: true,
    data: formattedServices,
    userMessage: t("botChat.foundServices", { count: services.length }),
    ui: {
      component: "service-selector",
      props: { services: uiServices },
    },
  };
}

// Show date picker for a service
async function handleGetDatePicker(
  context: ToolContext,
  params: GetDatePickerParams
): Promise<ToolResult> {
  const t = getTranslator(context.language);

  // Validate service exists
  const service = await prisma.service.findFirst({
    where: {
      id: params.serviceId,
      companyId: context.companyId,
      isActive: true,
    },
  });

  if (!service) {
    return {
      success: false,
      userMessage: t("botChat.serviceNotFound"),
    };
  }

  // Get closed days
  const allWorkingHours = await prisma.workingHours.findMany({
    where: { companyId: context.companyId },
    select: { dayOfWeek: true, isOpen: true },
  });
  const closedDays = allWorkingHours
    .filter((wh) => !wh.isOpen)
    .map((wh) => wh.dayOfWeek);

  return {
    success: true,
    data: {
      service: service.name,
      serviceId: service.id,
    },
    userMessage: t("botChat.readyToSelectDate", { serviceName: service.name }),
    ui: {
      component: "date-picker",
      props: {
        serviceId: service.id,
        serviceName: service.name,
        closedDays,
      },
    },
  };
}

// Get available time slots for a service on a date
async function handleGetAvailableSlots(
  context: ToolContext,
  params: GetAvailableSlotsParams
): Promise<ToolResult> {
  const t = getTranslator(context.language);
  const dateLocale = getDateLocale(context.language);

  // Validate service exists
  const service = await prisma.service.findFirst({
    where: {
      id: params.serviceId,
      companyId: context.companyId,
      isActive: true,
    },
  });

  if (!service) {
    return {
      success: false,
      userMessage: t("botChat.serviceNotFound"),
    };
  }

  // Parse the date
  let date: Date;
  try {
    date = parseISO(params.date);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
  } catch {
    return {
      success: false,
      userMessage: t("botChat.invalidDateFormat"),
    };
  }

  const dayOfWeek = date.getDay();
  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayName = t(`botChat.days.${dayKeys[dayOfWeek]}`);

  // Check if business is open on this day
  const workingHours = await prisma.workingHours.findUnique({
    where: {
      companyId_dayOfWeek: {
        companyId: context.companyId,
        dayOfWeek,
      },
    },
  });

  if (!workingHours || !workingHours.isOpen) {
    return {
      success: true,
      data: { closed: true, dayOfWeek: dayName },
      userMessage: t("botChat.businessClosed", { dayName }),
    };
  }

  // Get available slots
  const slots = await getAvailableSlots(context.companyId, date, service.duration);

  if (slots.length === 0) {
    // Get closed days for the date picker UI
    const allWorkingHours = await prisma.workingHours.findMany({
      where: { companyId: context.companyId },
      select: { dayOfWeek: true, isOpen: true },
    });
    const closedDays = allWorkingHours
      .filter((wh) => !wh.isOpen)
      .map((wh) => wh.dayOfWeek);

    const formattedDate = format(date, "EEEE, MMMM d, yyyy", { locale: dateLocale });
    return {
      success: true,
      data: { fullyBooked: true },
      userMessage: t("botChat.allSlotsBooked", { serviceName: service.name, date: formattedDate }),
      ui: {
        component: "date-picker",
        props: {
          serviceId: service.id,
          serviceName: service.name,
          closedDays,
        },
      },
    };
  }

  const formattedSlots = slots.map((slot) => ({
    startTime: slot.start.toISOString(),
    displayTime: format(slot.start, "HH:mm"),
  }));

  const formattedDate = format(date, "EEEE, MMMM d, yyyy", { locale: dateLocale });

  return {
    success: true,
    data: {
      service: service.name,
      date: formattedDate,
      slots: formattedSlots,
    },
    userMessage: t("botChat.foundSlots", { count: slots.length, serviceName: service.name, date: formattedDate }),
    ui: {
      component: "time-slots",
      props: {
        serviceId: service.id,
        serviceName: service.name,
        date: formattedDate,
        dateISO: params.date,
        slots: formattedSlots,
      },
    },
  };
}

// Create a booking
async function handleCreateBooking(
  context: ToolContext,
  params: CreateBookingParams
): Promise<ToolResult> {
  const t = getTranslator(context.language);
  const dateLocale = getDateLocale(context.language);

  // Validate service exists
  const service = await prisma.service.findFirst({
    where: {
      id: params.serviceId,
      companyId: context.companyId,
      isActive: true,
    },
  });

  if (!service) {
    return {
      success: false,
      userMessage: t("botChat.serviceNotFoundCheck"),
    };
  }

  // Parse start time
  let startTime: Date;
  try {
    startTime = parseISO(params.startTime);
    if (isNaN(startTime.getTime())) {
      throw new Error("Invalid datetime");
    }
  } catch {
    return {
      success: false,
      userMessage: t("botChat.invalidDateTime"),
    };
  }

  // Check if slot is available
  const available = await isSlotAvailable(
    context.companyId,
    startTime,
    service.duration
  );

  if (!available) {
    return {
      success: false,
      userMessage: t("botChat.slotUnavailable"),
    };
  }

  // Determine user - logged in or guest
  let userId = context.userId;
  let userEmail = context.userEmail;
  let userName = context.userName;

  if (!userId) {
    // Guest checkout - require guest info
    if (!params.guestEmail || !params.guestName) {
      return {
        success: false,
        userMessage: t("botChat.provideNameEmail"),
      };
    }

    userEmail = params.guestEmail;
    userName = params.guestName;

    // Check if user exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email: params.guestEmail },
    });

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user with random password
      const randomPassword = Math.random().toString(36).slice(-12);
      const hashedPassword = await hashPassword(randomPassword);

      const newUser = await prisma.user.create({
        data: {
          email: params.guestEmail,
          name: params.guestName,
          phone: params.guestPhone || null,
          password: hashedPassword,
          role: "USER",
        },
      });
      userId = newUser.id;
    }
  }

  // Create the appointment
  const endTime = addMinutes(startTime, service.duration);

  const appointment = await prisma.appointment.create({
    data: {
      companyId: context.companyId,
      userId: userId!,
      serviceId: service.id,
      startTime,
      endTime,
      status: "PENDING",
      notes: params.notes,
    },
    include: {
      service: true,
    },
  });

  // Send confirmation email
  if (userEmail) {
    try {
      await sendBookingConfirmationEmail({
        customerEmail: userEmail,
        customerName: userName || "Customer",
        serviceName: service.name,
        startTime,
        duration: service.duration,
        companyName: context.companyName,
        notes: params.notes,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the booking if email fails
    }
  }

  // Send admin notification emails
  try {
    const company = await prisma.company.findUnique({
      where: { id: context.companyId },
      select: { notificationEmails: true, businessEmail: true, slug: true },
    });

    if (company) {
      const notificationEmails = (company.notificationEmails as string[]) || [];
      if (company.businessEmail && !notificationEmails.includes(company.businessEmail)) {
        notificationEmails.push(company.businessEmail);
      }

      if (notificationEmails.length > 0) {
        const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || "http://localhost:3000";
        const slug = context.companySlug || company.slug;
        await Promise.allSettled(
          notificationEmails.map((adminEmail) =>
            sendNewBookingAdminEmail({
              adminEmail,
              customerName: userName || "Customer",
              customerEmail: userEmail || "",
              serviceName: service.name,
              startTime,
              duration: service.duration,
              companyName: context.companyName,
              appointmentUrl: `${baseUrl}/en/c/${slug}/admin/appointments?id=${appointment.id}`,
            })
          )
        );
      }
    }
  } catch (error) {
    console.error("[EMAIL] Failed to send admin notifications:", error);
  }

  const bookingData = {
    appointmentId: appointment.id,
    service: service.name,
    date: format(startTime, "EEEE, MMMM d, yyyy", { locale: dateLocale }),
    time: format(startTime, "HH:mm"),
    duration: `${service.duration} minutes`,
    price: `${service.currency} ${Number(service.price).toLocaleString()}`,
    status: "PENDING",
  };

  return {
    success: true,
    data: bookingData,
    userMessage: t("botChat.bookingConfirmed", {
      serviceName: service.name,
      date: format(startTime, "EEEE, MMMM d", { locale: dateLocale }),
      time: format(startTime, "HH:mm"),
    }),
    ui: {
      component: "booking-card",
      props: bookingData,
    },
  };
}

// Search user's appointment history
async function handleSearchAppointments(
  context: ToolContext,
  params: SearchAppointmentsParams
): Promise<ToolResult> {
  const t = getTranslator(context.language);
  const dateLocale = getDateLocale(context.language);

  if (!context.userId) {
    return {
      success: false,
      userMessage: t("botChat.provideEmailForLookup"),
    };
  }

  // Build query
  const where: {
    companyId: string;
    userId: string;
    startTime?: { gte?: Date; lte?: Date };
  } = {
    companyId: context.companyId,
    userId: context.userId,
  };

  // Date range filter
  if (params.startDate || params.endDate) {
    where.startTime = {};
    if (params.startDate) {
      try {
        where.startTime.gte = parseISO(params.startDate);
      } catch {
        // Ignore invalid date
      }
    }
    if (params.endDate) {
      try {
        where.startTime.lte = parseISO(params.endDate);
      } catch {
        // Ignore invalid date
      }
    }
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { service: true },
    orderBy: { startTime: "desc" },
    take: 20,
  });

  // Optional text search filter
  let filtered = appointments;
  if (params.query) {
    const q = params.query.toLowerCase();
    filtered = appointments.filter(
      (a) =>
        a.service.name.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    return {
      success: true,
      data: [],
      userMessage: t("botChat.noAppointmentsFound"),
    };
  }

  // Format results
  const results = filtered.map((a) => ({
    date: format(a.startTime, "EEEE, MMM d, yyyy", { locale: dateLocale }),
    time: format(a.startTime, "HH:mm"),
    service: a.service.name,
    status: a.status,
    notes: a.notes,
  }));

  return {
    success: true,
    data: results,
    userMessage: t("botChat.foundAppointments", { count: results.length }),
  };
}
