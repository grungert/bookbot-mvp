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
import { prisma } from "@/lib/prisma";

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

// Generate time slots for a given date and service
export async function generateTimeSlots(
  companyId: string,
  date: Date,
  serviceDuration: number,
  slotInterval: number = 30 // Default 30 min intervals
): Promise<TimeSlot[]> {
  const dayOfWeek = date.getDay();

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
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      companyId,
      startTime: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
    orderBy: { startTime: "asc" },
  });

  const slots: TimeSlot[] = [];
  const dayStart = setTime(date, workingHours.startTime);
  const dayEnd = setTime(date, workingHours.endTime);

  let currentSlotStart = dayStart;

  while (isBefore(currentSlotStart, dayEnd)) {
    const slotEnd = addMinutes(currentSlotStart, serviceDuration);

    // Check if slot fits within working hours
    if (isAfter(slotEnd, dayEnd)) {
      break;
    }

    // Check if slot conflicts with existing appointments
    const isAvailable = !existingAppointments.some((apt) => {
      // Slot conflicts if it overlaps with an appointment
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);

      return (
        (isAfter(currentSlotStart, aptStart) && isBefore(currentSlotStart, aptEnd)) ||
        (isAfter(slotEnd, aptStart) && isBefore(slotEnd, aptEnd)) ||
        (isBefore(currentSlotStart, aptStart) && isAfter(slotEnd, aptEnd)) ||
        currentSlotStart.getTime() === aptStart.getTime()
      );
    });

    // Don't show past slots
    const isPast = isBefore(currentSlotStart, new Date());

    slots.push({
      start: currentSlotStart,
      end: slotEnd,
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
  duration: number
): Promise<boolean> {
  const endTime = addMinutes(startTime, duration);
  const dayOfWeek = startTime.getDay();

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

  const dayStart = setTime(startTime, workingHours.startTime);
  const dayEnd = setTime(startTime, workingHours.endTime);

  // Check if within working hours
  if (isBefore(startTime, dayStart) || isAfter(endTime, dayEnd)) {
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
