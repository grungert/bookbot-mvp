import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess } from "@/lib/db/tenant";
import { z } from "zod";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

const querySchema = z.object({
  userType: z.enum(["all", "guest", "authenticated"]).optional().default("all"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  isRead: z.enum(["true", "false"]).optional(),
  isImportant: z.enum(["true", "false"]).optional(),
  groupBy: z.enum(["session", "user"]).optional().default("session"),
});

// GET /api/c/[companySlug]/conversations - List chat sessions with filters
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      userType: searchParams.get("userType") || "all",
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
      isRead: searchParams.get("isRead") || undefined,
      isImportant: searchParams.get("isImportant") || undefined,
      groupBy: searchParams.get("groupBy") || "session",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { userType, startDate, endDate, search, isRead, isImportant, groupBy } = parsed.data;

    // Build where clause
    const where: Prisma.ChatSessionWhereInput = {
      companyId: company.id,
    };

    // Filter by user type
    if (userType === "guest") {
      where.userId = null;
    } else if (userType === "authenticated") {
      where.userId = { not: null };
    }

    // Filter by date range
    if (startDate || endDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      where.createdAt = dateFilter;
    }

    // Filter by read status
    if (isRead === "true") {
      where.isRead = true;
    } else if (isRead === "false") {
      where.isRead = false;
    }

    // Filter by important status
    if (isImportant === "true") {
      where.isImportant = true;
    } else if (isImportant === "false") {
      where.isImportant = false;
    }

    // Filter by email search
    if (search) {
      where.user = {
        email: {
          contains: search,
          mode: "insensitive",
        },
      };
    }

    // Fetch sessions with message count
    const sessions = await prisma.chatSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const totalSessions = await prisma.chatSession.count({
      where: { companyId: company.id },
    });

    const totalMessages = await prisma.chatMessage.count({
      where: {
        session: { companyId: company.id },
      },
    });

    const guestSessions = await prisma.chatSession.count({
      where: { companyId: company.id, userId: null },
    });

    const authenticatedSessions = await prisma.chatSession.count({
      where: { companyId: company.id, userId: { not: null } },
    });

    const unreadSessions = await prisma.chatSession.count({
      where: { companyId: company.id, isRead: false },
    });

    // Format response based on groupBy mode
    if (groupBy === "user") {
      // Group sessions by user
      const userGroups = new Map<string | null, {
        userId: string | null;
        user: { id: string; email: string; name: string | null } | null;
        sessionCount: number;
        totalMessages: number;
        lastActivity: string;
        unreadCount: number;
        sessions: Array<{
          id: string;
          messageCount: number;
          isRead: boolean;
          isImportant: boolean;
          createdAt: string;
          updatedAt: string;
        }>;
      }>();

      for (const session of sessions) {
        const key = session.userId;
        const existing = userGroups.get(key);

        const sessionData = {
          id: session.id,
          messageCount: session._count.messages,
          isRead: session.isRead,
          isImportant: session.isImportant,
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        };

        if (existing) {
          existing.sessionCount += 1;
          existing.totalMessages += session._count.messages;
          existing.unreadCount += session.isRead ? 0 : 1;
          if (new Date(session.updatedAt) > new Date(existing.lastActivity)) {
            existing.lastActivity = session.updatedAt.toISOString();
          }
          existing.sessions.push(sessionData);
        } else {
          userGroups.set(key, {
            userId: session.userId,
            user: session.user,
            sessionCount: 1,
            totalMessages: session._count.messages,
            lastActivity: session.updatedAt.toISOString(),
            unreadCount: session.isRead ? 0 : 1,
            sessions: [sessionData],
          });
        }
      }

      // Convert to array and sort by last activity
      const groupedUsers = Array.from(userGroups.values()).sort(
        (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );

      return NextResponse.json({
        groupBy: "user",
        users: groupedUsers,
        stats: {
          totalSessions,
          totalMessages,
          guestSessions,
          authenticatedSessions,
          unreadSessions,
        },
      });
    }

    // Default: return sessions (groupBy === "session")
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      user: session.user,
      messageCount: session._count.messages,
      isRead: session.isRead,
      isImportant: session.isImportant,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      groupBy: "session",
      sessions: formattedSessions,
      stats: {
        totalSessions,
        totalMessages,
        guestSessions,
        authenticatedSessions,
        unreadSessions,
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/c/[companySlug]/conversations - Bulk update sessions
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const { sessionIds, isRead, isImportant } = body;

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json(
        { error: "sessionIds must be a non-empty array" },
        { status: 400 }
      );
    }

    const updateData: { isRead?: boolean; isImportant?: boolean } = {};
    if (typeof isRead === "boolean") {
      updateData.isRead = isRead;
    }
    if (typeof isImportant === "boolean") {
      updateData.isImportant = isImportant;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    // Update sessions
    await prisma.chatSession.updateMany({
      where: {
        id: { in: sessionIds },
        companyId: company.id,
      },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
