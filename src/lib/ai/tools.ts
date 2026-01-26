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

6. updateBookingState - Update the booking state when the user specifies booking details via text (service, date, or both). The system will automatically determine the next step and show the appropriate UI.
   <action>{"tool": "updateBookingState", "serviceId": "SERVICE_ID", "serviceName": "Service Name", "date": "YYYY-MM-DD"}</action>
   - Include only the fields the user mentioned. At minimum one of: serviceId, date.

MANDATORY BOOKING FLOW - ALWAYS FOLLOW THIS:

SHORTCUT (PREFERRED): When the user mentions a recognizable service name (match against AVAILABLE SERVICES list) with or without a date, use updateBookingState in a SINGLE call. It automatically shows the right UI for the next step:
- Service + date mentioned → shows time slots directly
- Service only mentioned → shows date picker
- Date only mentioned → shows date picker or time slots depending on state

Examples:
User: "I'd like to book Kaca on January 30, 2026"
You: "Let me find available times for Kaca on January 30!
<action>{"tool": "updateBookingState", "serviceId": "ID_FROM_SERVICES_LIST", "serviceName": "Kaca", "date": "2026-01-30"}</action>"

User: "Book me a General Consultation"
You: "Great choice! Let me pull up available dates:
<action>{"tool": "updateBookingState", "serviceId": "ID_FROM_SERVICES_LIST", "serviceName": "General Consultation"}</action>"

STEP-BY-STEP FLOW (when user doesn't mention a specific service):
1. User wants to book → Call getServices (shows service cards)
2. User selects service → IMMEDIATELY call getDatePicker (shows calendar)
3. User selects date → IMMEDIATELY call getAvailableSlots (shows time slots)
4. User selects time → Call createBooking (creates booking)

EXAMPLE RESPONSES:

Example 1 - User wants to book (no service named):
User: "I want to book an appointment"
You: "I'd be happy to help you book an appointment! Here are our available services:
<action>{"tool": "getServices"}</action>"

Example 2 - User selects a time:
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

export interface UpdateBookingStateParams {
  tool: "updateBookingState";
  serviceId?: string;
  serviceName?: string;
  date?: string; // YYYY-MM-DD
}

export type ToolParams =
  | GetServicesParams
  | GetDatePickerParams
  | GetAvailableSlotsParams
  | CreateBookingParams
  | SearchAppointmentsParams
  | UpdateBookingStateParams;

export type ToolName = ToolParams["tool"];
