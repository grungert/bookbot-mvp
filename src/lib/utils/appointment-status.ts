import { AppointmentStatus } from "@prisma/client";

/**
 * Valid status transitions for appointments.
 * Defines which statuses can transition to which other statuses.
 */
const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // Terminal state - no transitions allowed
  CANCELLED: [], // Terminal state - no transitions allowed
};

/**
 * Check if a status transition is valid.
 * @param currentStatus - The current status of the appointment
 * @param newStatus - The proposed new status
 * @returns true if the transition is valid, false otherwise
 */
export function isValidTransition(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): boolean {
  // Same status is always allowed (no-op)
  if (currentStatus === newStatus) {
    return true;
  }

  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Get the list of valid next statuses for a given current status.
 * @param currentStatus - The current status of the appointment
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(
  currentStatus: AppointmentStatus
): AppointmentStatus[] {
  return VALID_TRANSITIONS[currentStatus];
}

/**
 * Get a human-readable error message for an invalid transition.
 * @param currentStatus - The current status of the appointment
 * @param newStatus - The proposed new status that was rejected
 * @returns Error message with valid options
 */
export function getInvalidTransitionError(
  currentStatus: AppointmentStatus,
  newStatus: AppointmentStatus
): string {
  const validOptions = VALID_TRANSITIONS[currentStatus];

  if (validOptions.length === 0) {
    return `Cannot change status from ${currentStatus}. This is a terminal state.`;
  }

  return `Invalid status transition from ${currentStatus} to ${newStatus}. Valid options are: ${validOptions.join(", ")}.`;
}

/**
 * Status metadata for UI display.
 */
export const STATUS_METADATA: Record<
  AppointmentStatus,
  {
    label: string;
    color: string;
    isTerminal: boolean;
  }
> = {
  PENDING: {
    label: "Pending",
    color: "amber",
    isTerminal: false,
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "blue",
    isTerminal: false,
  },
  COMPLETED: {
    label: "Completed",
    color: "green",
    isTerminal: true,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "gray",
    isTerminal: true,
  },
};
