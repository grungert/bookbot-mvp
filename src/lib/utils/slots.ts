import {
  addMinutes,
  format,
  parse,
  setHours,
  setMinutes,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";

// Default timezone if company hasn't set one
const DEFAULT_TIMEZONE = "Europe/Belgrade";

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface WorkingHoursConfig {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

// Parse time string "HH:mm" to hours and minutes
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

// Set time on a date
function setTime(date: Date, timeStr: string): Date {
  const { hours, minutes } = parseTime(timeStr);
  return setMinutes(setHours(date, hours), minutes);
}

/**
 * Get the company timezone, falling back to default if not set
 */
export async function getCompanyTimezone(companyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { timezone: true },
  });
  return company?.timezone || DEFAULT_TIMEZONE;
}

/**
 * Convert a UTC date to company's local timezone
 */
export function toCompanyTime(date: Date, timezone: string): Date {
  return toZonedTime(date, timezone);
}

/**
 * Convert a date from company's local timezone to UTC
 */
export function fromCompanyTime(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

/**
 * Format a date in the company's timezone
 */
export function formatInCompanyTimezone(
  date: Date,
  formatStr: string,
  timezone: string
): string {
  return formatInTimeZone(date, timezone, formatStr);
}

// Generate time slots for a given date and service
export async function generateTimeSlots(
  companyId: string,
  date: Date,
  serviceDuration: number,
  slotInterval: number = 30, // Default 30 min intervals
  timezone?: string // Optional timezone, fetched from company if not provided
): Promise<TimeSlot[]> {
  // Fetch company timezone if not provided
  const tz = timezone || (await getCompanyTimezone(companyId));

  // Convert the input date to the company's timezone
  const localDate = toCompanyTime(date, tz);
  const dayOfWeek = localDate.getDay();

  // Get working hours for this day
  const workingHours = await prisma.workingHours.findUnique({
    where: {
      companyId_dayOfWeek: {
        companyId,
        dayOfWeek,
      },
    },
  });

  // If no working hours or closed, return empty
  if (!workingHours || !workingHours.isOpen) {
    return [];
  }

  // Get existing appointments for this date
  // Use the local date's start/end in company timezone, converted to UTC for DB query
  const localDayStart = startOfDay(localDate);
  const localDayEnd = endOfDay(localDate);
  const utcDayStart = fromCompanyTime(localDayStart, tz);
  const utcDayEnd = fromCompanyTime(localDayEnd, tz);

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      companyId,
      startTime: {
        gte: utcDayStart,
        lte: utcDayEnd,
      },
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
    orderBy: { startTime: "asc" },
  });

  const slots: TimeSlot[] = [];
  // Working hours are in local time, set on the local date
  const dayStart = setTime(localDate, workingHours.startTime);
  const dayEnd = setTime(localDate, workingHours.endTime);

  let currentSlotStart = dayStart;

  // Current time in company's timezone for past slot checking
  const nowInTz = toCompanyTime(new Date(), tz);

  while (isBefore(currentSlotStart, dayEnd)) {
    const slotEnd = addMinutes(currentSlotStart, serviceDuration);

    // Check if slot fits within working hours
    if (isAfter(slotEnd, dayEnd)) {
      break;
    }

    // Convert slot times to UTC for comparison with stored appointments
    const slotStartUtc = fromCompanyTime(currentSlotStart, tz);
    const slotEndUtc = fromCompanyTime(slotEnd, tz);

    // Check if slot conflicts with existing appointments (all in UTC)
    const isAvailable = !existingAppointments.some((apt) => {
      // Slot conflicts if it overlaps with an appointment
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);

      return (
        (isAfter(slotStartUtc, aptStart) && isBefore(slotStartUtc, aptEnd)) ||
        (isAfter(slotEndUtc, aptStart) && isBefore(slotEndUtc, aptEnd)) ||
        (isBefore(slotStartUtc, aptStart) && isAfter(slotEndUtc, aptEnd)) ||
        slotStartUtc.getTime() === aptStart.getTime()
      );
    });

    // Don't show past slots (compare in local timezone)
    const isPast = isBefore(currentSlotStart, nowInTz);

    // Return slots in UTC for storage, but times are calculated from company's working hours
    slots.push({
      start: slotStartUtc,
      end: slotEndUtc,
      available: isAvailable && !isPast,
    });

    currentSlotStart = addMinutes(currentSlotStart, slotInterval);
  }

  return slots;
}

// Get available slots only
export async function getAvailableSlots(
  companyId: string,
  date: Date,
  serviceDuration: number
): Promise<TimeSlot[]> {
  const slots = await generateTimeSlots(companyId, date, serviceDuration);
  return slots.filter((slot) => slot.available);
}

// Check if a specific slot is available
export async function isSlotAvailable(
  companyId: string,
  startTime: Date,
  duration: number,
  timezone?: string // Optional timezone, fetched from company if not provided
): Promise<boolean> {
  // Fetch company timezone if not provided
  const tz = timezone || (await getCompanyTimezone(companyId));

  // startTime is in UTC, convert to company's local time for working hours check
  const localStartTime = toCompanyTime(startTime, tz);
  const endTime = addMinutes(startTime, duration);
  const localEndTime = toCompanyTime(endTime, tz);
  const dayOfWeek = localStartTime.getDay();

  // Check working hours
  const workingHours = await prisma.workingHours.findUnique({
    where: {
      companyId_dayOfWeek: {
        companyId,
        dayOfWeek,
      },
    },
  });

  if (!workingHours || !workingHours.isOpen) {
    return false;
  }

  // Working hours are in local time
  const dayStart = setTime(localStartTime, workingHours.startTime);
  const dayEnd = setTime(localStartTime, workingHours.endTime);

  // Check if within working hours (compare in local timezone)
  if (isBefore(localStartTime, dayStart) || isAfter(localEndTime, dayEnd)) {
    return false;
  }

  // Check for conflicting appointments
  const conflicting = await prisma.appointment.findFirst({
    where: {
      companyId,
      status: { in: ["PENDING", "CONFIRMED"] },
      OR: [
        {
          startTime: { gte: startTime, lt: endTime },
        },
        {
          endTime: { gt: startTime, lte: endTime },
        },
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gte: endTime } },
          ],
        },
      ],
    },
  });

  return !conflicting;
}

// Format time slot for display
export function formatTimeSlot(slot: TimeSlot): string {
  return `${format(slot.start, "HH:mm")} - ${format(slot.end, "HH:mm")}`;
}

// Get day names
export const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Default working hours template
export const defaultWorkingHours: WorkingHoursConfig[] = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isOpen: false }, // Sunday
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", isOpen: true }, // Monday
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", isOpen: true }, // Tuesday
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", isOpen: true }, // Wednesday
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", isOpen: true }, // Thursday
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", isOpen: true }, // Friday
  { dayOfWeek: 6, startTime: "09:00", endTime: "13:00", isOpen: false }, // Saturday
];
