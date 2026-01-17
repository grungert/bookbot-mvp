# Plan: Enhanced Booking Bot with AI Tools

## Target Setup
- **Local Model:** Gemma 3 12B IT
- **Approach:** Prompt-based tool calling (more reliable than native function calling for local models)

## Overview
Enhance the booking bot to:
1. **Per-company personalization** - Custom bot name, greeting, personality
2. **Per-user personalization** - Pass user info and appointment history to the bot
3. **Booking tools** - OpenAI function calling so the bot can list services, check slots, and create bookings

---

## Files to Modify/Create

### 1. Database Schema
**File:** `prisma/schema.prisma`

Add new fields to `Company` model for bot personality:
```prisma
// Bot Personality Configuration (new fields)
aiBotName        String?   // Custom bot name (e.g., "Luna", "Dr. Smith's Assistant")
aiGreeting       String?   // Custom greeting message
aiPersonality    String?   // Personality preset key (e.g., "professional", "friendly")
```

### Personality Presets (defined in code)
**File:** `src/lib/ai/personalities.ts` (New)

```typescript
export const BOT_PERSONALITIES = {
  professional: {
    label: "Professional",
    description: "Formal, business-like tone. Clear and concise.",
    prompt: "You are professional and formal. Use clear, concise language. Address users respectfully. Avoid casual expressions or humor."
  },
  friendly: {
    label: "Friendly",
    description: "Warm and approachable. Casual but respectful.",
    prompt: "You are warm and friendly. Use a conversational tone. Be approachable and helpful. Light humor is okay when appropriate."
  },
  enthusiastic: {
    label: "Enthusiastic",
    description: "Energetic and positive. Great for wellness/fitness.",
    prompt: "You are enthusiastic and energetic! Use positive language and show excitement about helping. Encourage users and celebrate their bookings."
  },
  calm: {
    label: "Calm & Caring",
    description: "Soothing and empathetic. Great for medical/spa.",
    prompt: "You are calm and caring. Speak in a soothing, reassuring manner. Show empathy and understanding. Create a sense of comfort and trust."
  },
  efficient: {
    label: "Efficient",
    description: "Quick and to-the-point. Minimal small talk.",
    prompt: "You are efficient and direct. Get straight to the point. Minimize small talk. Focus on completing the booking quickly and accurately."
  }
} as const;

export type PersonalityKey = keyof typeof BOT_PERSONALITIES;
```

### 2. New File: Tool Definitions
**File:** `src/lib/ai/tools.ts`

Define OpenAI function calling tools:
- `getServices` - List available services with IDs, names, prices, durations
- `getAvailableSlots` - Check available times for a service on a date
- `createBooking` - Create appointment (with confirmation requirement)

### 3. New File: Tool Handlers
**File:** `src/lib/ai/tool-handlers.ts`

Implement tool execution functions:
- `handleGetServices(companyId)` - Query active services
- `handleGetAvailableSlots(companyId, serviceId, date)` - Use existing `getAvailableSlots()` utility
- `handleCreateBooking(...)` - Reuse logic from appointments API, supports guest checkout
- `handleSearchAppointments(companyId, userId, query?, startDate?, endDate?)` - Search user's appointment history

```typescript
// searchAppointments handler
export async function handleSearchAppointments(
  context: ToolContext,
  args: { query?: string; startDate?: string; endDate?: string }
): Promise<ToolResult> {
  if (!context.userId) {
    return { success: false, userMessage: "Please provide your email so I can look up your appointments." };
  }

  const where: any = {
    companyId: context.companyId,
    userId: context.userId,
  };

  // Date range filter
  if (args.startDate || args.endDate) {
    where.startTime = {};
    if (args.startDate) where.startTime.gte = parseISO(args.startDate);
    if (args.endDate) where.startTime.lte = parseISO(args.endDate);
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { service: true },
    orderBy: { startTime: "desc" },
    take: 20,
  });

  // Optional text search filter
  let filtered = appointments;
  if (args.query) {
    const q = args.query.toLowerCase();
    filtered = appointments.filter(a =>
      a.service.name.toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q)
    );
  }

  // Format results
  const results = filtered.map(a => ({
    date: format(a.startTime, "EEEE, MMM d, yyyy"),
    time: format(a.startTime, "HH:mm"),
    service: a.service.name,
    status: a.status,
    notes: a.notes
  }));

  return { success: true, data: results, userMessage: `Found ${results.length} appointments.` };
}
```

### 4. Update: Chat Module
**File:** `src/lib/ai/chat.ts`

Major changes:
- Add user context to system prompt (name, email, past appointments, upcoming appointments)
- Add company personality to system prompt (bot name, greeting, personality)
- Add tool instructions to system prompt (prompt-based approach)
- Implement action parsing loop:
  1. Get response from model
  2. Check if response contains `<action>...</action>` block
  3. If yes: parse JSON, execute tool, append result, get next response
  4. If no: return response to user
- Increase max_tokens from 500 to 1000

New function signature:
```typescript
export async function chat(
  company: CompanyContext,    // id, slug, name, botName, personality
  config: ChatConfig,
  messages: ChatMessage[],
  userMessage: string,
  user: UserContext | null,   // NEW: user info
  sessionId: string           // NEW: for tool context
): Promise<string>
```

Action parsing logic:
```typescript
// Parse action from response
function parseAction(response: string): { tool: string; [key: string]: any } | null {
  const match = response.match(/<action>(.*?)<\/action>/s);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}
```

### 5. Update: Chat API Route
**File:** `src/app/api/c/[companySlug]/chat/route.ts`

Changes:
- Fetch full user details when logged in
- Build company context with personality fields
- Pass user context to chat function

### 6. Update: Admin Settings UI
**File:** `src/app/[locale]/c/[companySlug]/admin/settings/page.tsx`

Add new fields in AI Settings section:
- **Bot Name** (text input) - Custom name for the assistant
- **Greeting Message** (text input) - Optional custom greeting
- **Personality** (dropdown select) - Choose from presets:
  - Professional - Formal, business-like tone
  - Friendly - Warm and approachable
  - Enthusiastic - Energetic and positive
  - Calm & Caring - Soothing and empathetic
  - Efficient - Quick and to-the-point

UI mockup:
```
┌─────────────────────────────────────────────┐
│ AI Assistant Settings                       │
├─────────────────────────────────────────────┤
│ Bot Name                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Luna                                    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Personality                                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Friendly                            ▼   │ │
│ └─────────────────────────────────────────┘ │
│ Warm and approachable. Casual but respectful│
│                                             │
│ Greeting Message (optional)                 │
│ ┌─────────────────────────────────────────┐ │
│ │ Welcome! How can I help you today?      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 7. Update: Settings API
**File:** `src/app/api/c/[companySlug]/settings/route.ts`

Handle new fields: `aiBotName`, `aiGreeting`, `aiPersonality`

---

## Tool Calling Approach (Prompt-Based for Local Models)

Since Gemma 3 12B works best with prompt-based tool calling, the bot will:

1. **Output a JSON action block** when it needs to use a tool:
```
<action>{"tool": "getAvailableSlots", "serviceId": "xxx", "date": "2025-01-21"}</action>
```

2. **We parse the response**, execute the tool, and feed results back
3. **Bot continues** with the tool result in context

### Available Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `getServices` | none | Lists available services with IDs |
| `getAvailableSlots` | `serviceId`, `date` | Returns available times |
| `createBooking` | `serviceId`, `startTime`, `guestName?`, `guestEmail?`, `notes?` | Creates the booking |
| `searchAppointments` | `query?`, `startDate?`, `endDate?` | Search user's appointment history |

### System Prompt Tool Instructions

```
TOOLS AVAILABLE:
When you need to perform an action, output an action block:
<action>{"tool": "toolName", ...params}</action>

Available tools:
1. getServices - Get list of services. Output: <action>{"tool": "getServices"}</action>
2. getAvailableSlots - Check times. Output: <action>{"tool": "getAvailableSlots", "serviceId": "ID", "date": "YYYY-MM-DD"}</action>
3. createBooking - Book appointment. Output: <action>{"tool": "createBooking", "serviceId": "ID", "startTime": "ISO datetime", ...}</action>
4. searchAppointments - Search appointment history. Output: <action>{"tool": "searchAppointments", "query": "optional text", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}</action>

IMPORTANT: Only use createBooking AFTER the user explicitly confirms.
```

---

## Enhanced System Prompt Structure

```
You are {botName}, a booking assistant for {companyName}.

YOUR IDENTITY:
- Name: {botName}
- Personality: {personality}
- Greeting style: {greeting}

CURRENT USER:
- Name: {userName}
- Email: {userEmail}

UPCOMING APPOINTMENTS (Next 7 days):
- [Date] [Time] - [Service Name] (Status: CONFIRMED/PENDING)
- ...
(Used to remind users of their schedule and avoid double-booking)

RECENT APPOINTMENT HISTORY (Last 5):
- [Date] - [Service Name] (Status: COMPLETED/CANCELLED)
- ...
(Used for personalization - "I see you enjoyed our massage last month!")

(For guests: "Guest user - collect name and email before booking")

AVAILABLE SERVICES:
- Service Name (ID: xxx): Description | Duration | Price

BOOKING RULES:
1. ALWAYS confirm details before calling createBooking
2. For guests, collect name and email first
3. Check upcoming appointments before booking to avoid conflicts
4. Today's date is {today}

KNOWLEDGE BASE:
{documents}
```

---

## Conversation Flow Example

**User:** "Book me for Dental Cleaning on January 21st"

**Bot (internal):** Calls `getAvailableSlots(serviceId, "2025-01-21")`

**Bot:** "I have these times available for Dental Cleaning on Tuesday, January 21st: 09:00, 10:30, 14:00. Which works for you?"

**User:** "2pm"

**Bot:** "To confirm: Dental Cleaning on Tuesday, January 21st at 14:00 (30 min, $50). Shall I book this?"

**User:** "Yes"

**Bot (internal):** Calls `createBooking(serviceId, startTime, guestName?, guestEmail?)`

**Bot:** "Done! Your appointment is confirmed. Confirmation email sent."

---

## Implementation Sequence

1. **Database migration** - Add personality fields to Company (`aiBotName`, `aiGreeting`, `aiPersonality`)
2. **Create personalities.ts** - Bot personality presets with labels, descriptions, prompts
3. **Create tools.ts** - Tool definitions for prompt-based calling
4. **Create tool-handlers.ts** - Tool execution logic (including `searchAppointments`)
5. **Update chat.ts** - Add action parsing loop, user context with upcoming/past appointments
6. **Update chat API route** - Fetch user details, pass context with appointments
7. **Update admin settings UI** - Add personality dropdown, bot name, greeting fields
8. **Update settings API** - Handle new fields
9. **Add translations** - New UI labels for settings

---

## Verification Plan

1. **Test personality dropdown** - Admin settings UI shows all 5 presets with descriptions
2. **Test user context injection:**
   - Log in as user with existing appointments
   - Start chat, verify bot mentions upcoming appointments
   - Ask "what appointments do I have?" - should use searchAppointments tool
3. **Test booking flow:**
   - Logged-in user: "Book me for [service] on [date]"
   - Guest user: Verify it collects name/email before booking
   - Invalid date: Verify helpful error message
   - Slot conflict: Verify alternative times suggested
4. **Test searchAppointments tool:**
   - "When was my last haircut?"
   - "Show me my appointments from last month"
   - "Find my massage bookings"
5. **Test personality presets:**
   - Set to "Professional" - verify formal tone
   - Set to "Enthusiastic" - verify energetic language
6. **End-to-end flow:**
   - Set bot name to "Luna", personality to "Friendly"
   - Chat: "Hi" - verify greeting uses Luna and friendly tone
   - Complete full booking - verify confirmation message style matches
