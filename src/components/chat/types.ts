// Types for rich chat messages with embedded UI components

// Promotional badge type
export type PromotionalBadge = "SALE" | "NEW" | "POPULAR" | "HOT" | null;

// Service data for the service selector
export interface ChatService {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  currency: string;
  color?: string | null;
  // Discount fields
  discountType?: "percentage" | "fixed" | null;
  discountValue?: number | null;
  discountStartDate?: string | null;
  discountEndDate?: string | null;
  promotionalBadge?: PromotionalBadge;
  customBadgeLabel?: string | null;
}

// Time slot data for the time picker
export interface ChatTimeSlot {
  startTime: string; // ISO string
  displayTime: string; // e.g., "09:00"
}

// Booking confirmation data
export interface ChatBookingData {
  appointmentId: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  price?: string;
  status: string;
}

// UI Component types
export type ChatUIComponent =
  | {
      component: "service-selector";
      props: {
        services: ChatService[];
      };
    }
  | {
      component: "date-picker";
      props: {
        serviceId: string;
        serviceName: string;
        closedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
      };
    }
  | {
      component: "time-slots";
      props: {
        serviceId: string;
        serviceName: string;
        date: string; // Display date like "Monday, January 20, 2026"
        dateISO: string; // ISO date for creating bookings
        slots: ChatTimeSlot[];
      };
    }
  | {
      component: "booking-card";
      props: ChatBookingData;
    };

// Rich message structure (stored as JSON string in content field)
export interface RichMessage {
  type: "rich";
  text: string;
  ui: ChatUIComponent;
}

// Union type for message content
export type MessageContent = string | RichMessage;

// Chat message with potential rich content
export interface ChatMessage {
  role: "user" | "assistant";
  content: string; // Always stored as string, may contain JSON for rich messages
}

// Parsed message ready for rendering
export interface ParsedMessage {
  role: "user" | "assistant";
  text: string;
  ui?: ChatUIComponent;
}

// Interaction callbacks
export interface ChatUICallbacks {
  onServiceSelect?: (service: ChatService) => void;
  onDateSelect?: (date: Date, serviceId: string, serviceName: string) => void;
  onTimeSelect?: (slot: ChatTimeSlot, serviceId: string, dateISO: string, serviceName: string) => void;
}
