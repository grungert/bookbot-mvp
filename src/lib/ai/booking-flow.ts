/**
 * Booking Flow State Machine
 *
 * Handles booking option clicks directly (no LLM), while routing
 * free-text input to the LLM with booking state context.
 *
 * Flow:
 * 1. User asks to book → LLM calls getServices → shows services UI
 * 2. User clicks service → bypass LLM → show date picker
 * 3. User clicks date → bypass LLM → show time slots
 * 4. User clicks time → bypass LLM → create booking, show confirmation
 * 5. User types text → LLM with booking JSON context → LLM updates state
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ToolContext, ToolResult } from "./tool-handlers";
import { executeToolAction } from "./tool-handlers";
import { createRichMessageContent } from "@/components/chat/message-parser";
import { getTranslator } from "@/lib/i18n/backend";

// Booking state stored on ChatSession.bookingState (Json field)
export interface BookingState {
  active: boolean;
  step: "service" | "date" | "time" | "complete";
  serviceId?: string;
  serviceName?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // ISO datetime
  updatedAt: string; // ISO string for staleness detection
}

// Booking action sent from client (web chat or WhatsApp)
export interface BookingAction {
  type: "service" | "date" | "time" | "confirmation";
  serviceId?: string;
  serviceName?: string;
  date?: string; // YYYY-MM-DD
  dateISO?: string; // YYYY-MM-DD (alias)
  time?: string; // ISO datetime
  startTime?: string; // ISO datetime (alias)
  confirmed?: boolean;
  action?: Record<string, unknown>;
}

// Result from handling a booking selection
export interface BookingFlowResult {
  assistantMessage: string; // The rich message content to store and return
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
}

const STALE_HOURS = 2;

// --- State management ---

export async function getBookingState(
  sessionId: string
): Promise<BookingState | null> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { bookingState: true },
  });

  if (!session?.bookingState) return null;

  const state = session.bookingState as unknown as BookingState;

  // Auto-clear stale state (>2h)
  const updatedAt = new Date(state.updatedAt).getTime();
  const now = Date.now();
  if (now - updatedAt > STALE_HOURS * 60 * 60 * 1000) {
    await clearBookingState(sessionId);
    return null;
  }

  return state;
}

export async function saveBookingState(
  sessionId: string,
  state: BookingState
): Promise<void> {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { bookingState: state as unknown as Prisma.InputJsonValue },
  });
}

export async function clearBookingState(sessionId: string): Promise<void> {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { bookingState: Prisma.DbNull },
  });
}

function createInitialBookingState(): BookingState {
  return {
    active: true,
    step: "service",
    updatedAt: new Date().toISOString(),
  };
}

// --- Main handler for option clicks (bypasses LLM) ---

export async function handleBookingSelection(
  context: ToolContext,
  sessionId: string,
  action: BookingAction
): Promise<BookingFlowResult> {
  const t = getTranslator(context.language);

  // Load or lazily create booking state
  let state = await getBookingState(sessionId);
  if (!state) {
    state = createInitialBookingState();
  }

  let result: ToolResult;

  switch (action.type) {
    case "service": {
      const serviceId = action.serviceId!;
      const serviceName = action.serviceName || "";

      state.serviceId = serviceId;
      state.serviceName = serviceName;
      state.step = "date";
      state.updatedAt = new Date().toISOString();

      // Call getDatePicker directly
      result = await executeToolAction(context, {
        tool: "getDatePicker",
        serviceId,
      });

      await saveBookingState(sessionId, state);
      break;
    }

    case "date": {
      const date = action.date || action.dateISO;
      if (!date || !state.serviceId) {
        return {
          assistantMessage: t("botChat.bookingFlowError"),
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        };
      }

      state.date = date;
      state.step = "time";
      state.updatedAt = new Date().toISOString();

      // Call getAvailableSlots directly
      result = await executeToolAction(context, {
        tool: "getAvailableSlots",
        serviceId: state.serviceId,
        date,
      });

      // Handle edge cases
      const data = result.data as Record<string, unknown> | undefined;
      if (data?.closed || data?.fullyBooked) {
        // Roll back to date step
        state.step = "date";
        state.date = undefined;
      }

      await saveBookingState(sessionId, state);
      break;
    }

    case "time": {
      const startTime = action.time || action.startTime;
      if (!startTime || !state.serviceId) {
        return {
          assistantMessage: t("botChat.bookingFlowError"),
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        };
      }

      state.time = startTime;
      state.updatedAt = new Date().toISOString();

      // Call createBooking directly
      result = await executeToolAction(context, {
        tool: "createBooking",
        serviceId: state.serviceId,
        startTime,
      });

      if (result.success) {
        // Booking complete - clear state
        state.step = "complete";
        await clearBookingState(sessionId);
      } else {
        // Slot taken - stay on time step, re-fetch slots
        state.time = undefined;

        if (state.date) {
          // Re-fetch available slots for the same date
          const slotsResult = await executeToolAction(context, {
            tool: "getAvailableSlots",
            serviceId: state.serviceId,
            date: state.date,
          });

          // Use the slots result instead so user can pick another time
          const errorPrefix = result.userMessage;
          result = slotsResult;
          result.userMessage = `${errorPrefix} ${slotsResult.userMessage}`;
        }

        await saveBookingState(sessionId, state);
      }
      break;
    }

    case "confirmation": {
      if (!action.confirmed || !action.action) {
        return {
          assistantMessage: t("botChat.unknownBookingAction"),
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        };
      }

      // Execute the embedded action directly (cancel/reschedule)
      result = await executeToolAction(context, action.action as unknown as import("./tools").ToolParams);
      break;
    }

    default:
      return {
        assistantMessage: t("botChat.unknownBookingAction"),
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      };
  }

  // Build the response message
  const assistantMessage = result.ui
    ? createRichMessageContent(result.userMessage, result.ui)
    : result.userMessage;

  return {
    assistantMessage,
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  };
}

// --- Handler for LLM text-based booking state updates ---

export interface BookingStateUpdate {
  serviceId?: string;
  serviceName?: string;
  date?: string; // YYYY-MM-DD
}

export async function handleUpdateBookingState(
  context: ToolContext,
  sessionId: string,
  updates: BookingStateUpdate
): Promise<ToolResult> {
  // Load or create state
  let state = await getBookingState(sessionId);
  if (!state) {
    state = createInitialBookingState();
  }

  // Apply updates
  if (updates.serviceId) {
    state.serviceId = updates.serviceId;
    state.serviceName = updates.serviceName || state.serviceName;
  }
  if (updates.date) {
    state.date = updates.date;
  }
  state.updatedAt = new Date().toISOString();

  // Determine the next incomplete step and fetch data for it
  if (!state.serviceId) {
    // Need service selection - show services
    state.step = "service";
    await saveBookingState(sessionId, state);
    return executeToolAction(context, { tool: "getServices" });
  }

  if (!state.date) {
    // Need date selection - show date picker
    state.step = "date";
    await saveBookingState(sessionId, state);
    return executeToolAction(context, {
      tool: "getDatePicker",
      serviceId: state.serviceId,
    });
  }

  // Has service + date - show time slots
  state.step = "time";
  await saveBookingState(sessionId, state);

  const result = await executeToolAction(context, {
    tool: "getAvailableSlots",
    serviceId: state.serviceId,
    date: state.date,
  });

  // Handle closed/fully booked
  const data = result.data as Record<string, unknown> | undefined;
  if (data?.closed || data?.fullyBooked) {
    state.step = "date";
    state.date = undefined;
    await saveBookingState(sessionId, state);
  }

  return result;
}
