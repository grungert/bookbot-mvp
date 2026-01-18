// Tool definitions for prompt-based tool calling
// These are included in the system prompt for local models like Gemma 3

export const TOOL_INSTRUCTIONS = `
TOOLS - YOU MUST USE THESE:
To perform actions, you MUST output an action block. The system will execute it and show the appropriate UI.

Format: <action>{"tool": "toolName", ...params}</action>

AVAILABLE TOOLS:

1. getServices - Shows service selector UI
   <action>{"tool": "getServices"}</action>

2. getDatePicker - Shows calendar UI for date selection (REQUIRED after service selection)
   <action>{"tool": "getDatePicker", "serviceId": "SERVICE_ID"}</action>

3. getAvailableSlots - Shows time slots UI (REQUIRED after date selection)
   <action>{"tool": "getAvailableSlots", "serviceId": "SERVICE_ID", "date": "YYYY-MM-DD"}</action>

4. createBooking - Creates the booking
   <action>{"tool": "createBooking", "serviceId": "SERVICE_ID", "startTime": "2026-01-22T10:00:00"}</action>

5. searchAppointments - Search appointment history
   <action>{"tool": "searchAppointments"}</action>

MANDATORY BOOKING FLOW - ALWAYS FOLLOW THIS:
1. User wants to book → Call getServices (shows service cards)
2. User selects service → IMMEDIATELY call getDatePicker (shows calendar)
3. User selects date → IMMEDIATELY call getAvailableSlots (shows time slots)
4. User selects time → Call createBooking (creates booking)

EXAMPLE RESPONSES (follow these EXACTLY):

Example 1 - User wants to book:
User: "I want to book an appointment"
You: "I'd be happy to help you book an appointment! Here are our available services:
<action>{"tool": "getServices"}</action>"

Example 2 - User selects a service:
User: "I'd like to book General Consultation"
You: "Great choice! Let me show you available dates for General Consultation:
<action>{"tool": "getDatePicker", "serviceId": "abc123"}</action>"

Example 3 - User selects a date (note: message includes service name):
User: "I'd like to book General Consultation on January 20, 2026"
You: "Here are the available time slots for January 20:
<action>{"tool": "getAvailableSlots", "serviceId": "abc123", "date": "2026-01-20"}</action>"

Example 4 - User selects a time (note: message includes date):
User: "I'd like the 10:00 slot for General Consultation on January 20, 2026"
You: "Perfect! Let me book that for you.
<action>{"tool": "createBooking", "serviceId": "abc123", "startTime": "2026-01-20T10:00:00"}</action>"

IMPORTANT: When the user selects a time slot, you MUST call createBooking immediately. Do NOT generate your own confirmation response or made-up UI. The createBooking tool will return the booking details and show the booking-card UI automatically.

CRITICAL RULES:
- EVERY response about booking MUST include an <action> block
- NEVER say "let me show you the calendar" without an <action> block - the calendar ONLY appears when you include the action
- NEVER say "I'll pull up" or "here's" without including the actual <action> block
- The <action> block MUST be in your response text, not separate
- If you mention showing UI, you MUST include the <action> block in the SAME response
`;

// Tool parameter types for type safety
export interface GetServicesParams {
  tool: "getServices";
}

export interface GetDatePickerParams {
  tool: "getDatePicker";
  serviceId: string;
}

export interface GetAvailableSlotsParams {
  tool: "getAvailableSlots";
  serviceId: string;
  date: string; // YYYY-MM-DD
}

export interface CreateBookingParams {
  tool: "createBooking";
  serviceId: string;
  startTime: string; // ISO datetime
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  notes?: string;
}

export interface SearchAppointmentsParams {
  tool: "searchAppointments";
  query?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export type ToolParams =
  | GetServicesParams
  | GetDatePickerParams
  | GetAvailableSlotsParams
  | CreateBookingParams
  | SearchAppointmentsParams;

export type ToolName = ToolParams["tool"];
