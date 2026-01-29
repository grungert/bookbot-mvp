// Channel name for appointment updates
export const APPOINTMENTS_CHANNEL = "appointments-updated";

export type AppointmentEvent = {
  type: "new-booking" | "cancelled" | "updated";
  appointmentId?: string;
  companySlug?: string;
};

export function broadcastAppointmentUpdate(event: AppointmentEvent) {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    const channel = new BroadcastChannel(APPOINTMENTS_CHANNEL);
    channel.postMessage(event);
    // Close after a short delay to ensure message is delivered
    setTimeout(() => channel.close(), 100);
  }
}
