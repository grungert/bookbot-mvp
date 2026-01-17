// Tool definitions for prompt-based tool calling
// These are included in the system prompt for local models like Gemma 3

export const TOOL_INSTRUCTIONS = `
TOOLS AVAILABLE:
When you need to perform an action, output an action block like this:
<action>{"tool": "toolName", ...params}</action>

Available tools:

1. getServices - Get list of available services with their IDs, prices, and durations.
   Output: <action>{"tool": "getServices"}</action>

2. getAvailableSlots - Check available time slots for a service on a specific date.
   Parameters: serviceId (required), date (required, format: YYYY-MM-DD)
   Output: <action>{"tool": "getAvailableSlots", "serviceId": "ID", "date": "YYYY-MM-DD"}</action>

3. createBooking - Create an appointment booking.
   Parameters: serviceId (required), startTime (required, ISO datetime), guestName (optional), guestEmail (optional), guestPhone (optional), notes (optional)
   Output: <action>{"tool": "createBooking", "serviceId": "ID", "startTime": "2025-01-21T14:00:00", "notes": "optional notes"}</action>

4. searchAppointments - Search the user's appointment history.
   Parameters: query (optional text search), startDate (optional, YYYY-MM-DD), endDate (optional, YYYY-MM-DD)
   Output: <action>{"tool": "searchAppointments", "query": "optional text", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}</action>

IMPORTANT RULES:
- ALWAYS use getServices first if you don't know the service ID
- ALWAYS confirm booking details with the user BEFORE calling createBooking
- For guest users, collect name and email before booking
- When a tool returns results, incorporate them naturally into your response
- If a tool fails, explain the error to the user and suggest alternatives
`;

// Tool parameter types for type safety
export interface GetServicesParams {
  tool: "getServices";
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
  | GetAvailableSlotsParams
  | CreateBookingParams
  | SearchAppointmentsParams;

export type ToolName = ToolParams["tool"];
