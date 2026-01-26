import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess } from "@/lib/db/tenant";
import { getCurrentUser } from "@/lib/auth";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { getPersonalityPrompt } from "@/lib/ai/personalities";
import { TOOL_INSTRUCTIONS } from "@/lib/ai/tools";
import { getChatHistory, MAX_CHAT_HISTORY_MESSAGES } from "@/lib/ai/chat";
import { getTranslator } from "@/lib/i18n/backend";
import { getDateLocale } from "@/lib/i18n/date-locale";

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/chat/preview
// Returns the full system prompt for preview (admin only)
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    // Get current user for context preview
    const currentUser = await getCurrentUser();

    // Language and locale setup
    const language = company.language || "en";
    const dateLocale = getDateLocale(language);

    // Get company documents
    const documents = await prisma.document.findMany({
      where: { companyId: company.id },
      select: {
        title: true,
        content: true,
      },
    });

    // Get company services
    const services = await prisma.service.findMany({
      where: { companyId: company.id, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        price: true,
        currency: true,
      },
    });

    // Get user's upcoming appointments (next 7 days)
    let upcomingAppointments: string[] = [];
    let recentAppointments: string[] = [];

    if (currentUser) {
      const now = new Date();
      const weekFromNow = addDays(now, 7);

      const upcoming = await prisma.appointment.findMany({
        where: {
          companyId: company.id,
          userId: currentUser.id,
          startTime: {
            gte: startOfDay(now),
            lte: endOfDay(weekFromNow),
          },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: { service: true },
        orderBy: { startTime: "asc" },
        take: 5,
      });

      upcomingAppointments = upcoming.map(
        (a) =>
          `- ${format(a.startTime, "EEEE, MMM d", { locale: dateLocale })} at ${format(a.startTime, "HH:mm")} - ${a.service.name} (${a.status})`
      );

      const recent = await prisma.appointment.findMany({
        where: {
          companyId: company.id,
          userId: currentUser.id,
          startTime: { lt: new Date() },
        },
        include: { service: true },
        orderBy: { startTime: "desc" },
        take: 5,
      });

      recentAppointments = recent.map(
        (a) =>
          `- ${format(a.startTime, "MMM d, yyyy", { locale: dateLocale })} - ${a.service.name} (${a.status})`
      );
    }

    // Get most recent chat session for this company (with messages)
    let chatHistory: { role: string; content: string }[] = [];
    let totalMessagesInSession = 0;
    let sessionId: string | null = null;
    let sessionUserId: string | null = null;

    // Find the most recent session that has messages
    const recentSession = await prisma.chatSession.findFirst({
      where: {
        companyId: company.id,
        messages: {
          some: {}, // Has at least one message
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (recentSession) {
      sessionId = recentSession.id;
      sessionUserId = recentSession.userId;

      // Get total message count
      totalMessagesInSession = await prisma.chatMessage.count({
        where: { sessionId: recentSession.id },
      });

      // Get limited chat history (same as what AI sees)
      chatHistory = await getChatHistory(recentSession.id);
    }

    // Build the system prompt (similar to buildSystemPrompt in chat.ts)
    const botName = company.aiBotName || "Assistant";
    const personalityPrompt = getPersonalityPrompt(company.aiPersonality);
    const now = new Date();
    const today = format(now, "EEEE, MMMM d, yyyy", { locale: dateLocale });
    const currentTime = format(now, "HH:mm");

    // Language instruction for non-English languages
    const t = getTranslator(language);
    const languageNames: Record<string, string> = { en: "English", sr: "Serbian" };
    const languageName = languageNames[language] || "English";
    const languageInstruction = language !== "en"
      ? `${t("botChat.languageInstruction", { languageName })}\n\n`
      : "";

    let prompt = `${languageInstruction}You are ${botName}, a booking assistant for ${company.name}.

## Bot Identity
- **Name:** ${botName}
- **Personality:** ${personalityPrompt}
${company.aiGreeting ? `- **Default greeting:** "${company.aiGreeting}"` : ""}

## Current Date and Time
${today}, ${currentTime}

## Available Services
${
  services.length > 0
    ? services
        .map(
          (s) =>
            `- **${s.name}** (ID: \`${s.id}\`): ${s.description || "No description"} | ${s.duration} min | ${s.currency} ${s.price}`
        )
        .join("\n")
    : "*No services available.*"
}

## Current User
${
  currentUser
    ? `- **Name:** ${currentUser.name || "Unknown"}
- **Email:** ${currentUser.email}

### Upcoming Appointments (Next 7 days)
${upcomingAppointments.length > 0 ? upcomingAppointments.join("\n") : "*No upcoming appointments.*"}

### Recent Appointment History
${recentAppointments.length > 0 ? recentAppointments.join("\n") : "*No past appointments.*"}`
    : `*Guest (not logged in)*
- For guest bookings, collect name and email before creating a booking.`
}

## Tool Instructions
\`\`\`
${TOOL_INSTRUCTIONS.trim()}
\`\`\`

## Booking Rules
1. ALWAYS confirm booking details with the user BEFORE calling createBooking
2. For guests, collect name and email first
3. Check upcoming appointments before booking to avoid conflicts
4. Use getAvailableSlots to check times before suggesting availability
5. Be helpful and guide users through the booking process
6. NEVER show internal IDs (service IDs, booking IDs, session IDs, or any system identifiers) to the user. Only use human-readable names, dates, and times in your responses`;

    // Add knowledge base if available
    if (documents.length > 0) {
      const knowledgeBase = documents
        .map((doc) => `### ${doc.title}\n${doc.content}`)
        .join("\n\n---\n\n");

      prompt += `

## Knowledge Base
${knowledgeBase}`;
    } else {
      prompt += `

## Knowledge Base
*No documents uploaded yet.*`;
    }

    // Add custom prompt if provided
    if (company.aiSystemPrompt) {
      prompt += `

## Additional Instructions
${company.aiSystemPrompt}`;
    }

    // Add chat history section
    const sessionUserInfo = recentSession?.user
      ? `${recentSession.user.name || "Unknown"} (${recentSession.user.email})`
      : sessionUserId
        ? "Logged-in user"
        : "Guest";

    prompt += `

---

## Chat History
> **Note:** Chat history is passed as separate messages to the AI, not embedded in the system prompt above.
> This section shows what the AI receives as conversation context.

**Configuration:**
- Maximum messages kept: **${MAX_CHAT_HISTORY_MESSAGES}** (most recent)
- Current session messages: **${totalMessagesInSession}**${totalMessagesInSession > MAX_CHAT_HISTORY_MESSAGES ? ` (${totalMessagesInSession - MAX_CHAT_HISTORY_MESSAGES} older messages truncated)` : ""}
${sessionId ? `- Session ID: \`${sessionId}\`\n- Session user: **${sessionUserInfo}**` : "- No active session"}

${
  chatHistory.length > 0
    ? `**Recent Messages (${chatHistory.length}):**
${chatHistory
  .map(
    (m) =>
      `\n**${m.role === "user" ? "👤 User" : "🤖 Assistant"}:**\n${m.content.length > 500 ? m.content.substring(0, 500) + "..." : m.content}`
  )
  .join("\n\n---\n")}`
    : "*No chat history available.*"
}`;

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("Error generating prompt preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
