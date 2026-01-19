import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess } from "@/lib/db/tenant";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ companySlug: string; sessionId: string }>;
}

const updateSchema = z.object({
  isRead: z.boolean().optional(),
  isImportant: z.boolean().optional(),
});

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(30),
  cursor: z.string().optional(),
});

// GET /api/c/[companySlug]/conversations/[sessionId] - Get conversation with pagination
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, sessionId } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      limit: searchParams.get("limit") || 30,
      cursor: searchParams.get("cursor") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { limit, cursor } = parsed.data;

    // First, get the session details and total message count
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        companyId: company.id,
      },
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
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const totalCount = session._count.messages;

    // Get messages with cursor-based pagination (newest first, then reverse for display)
    // We fetch from newest to oldest, so cursor points to older messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId: sessionId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to check if there are more
    });

    const hasMore = messages.length > limit;
    const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

    // Reverse to get chronological order for display
    const chronologicalMessages = paginatedMessages.reverse();

    // Next cursor is the oldest message in current batch (for loading earlier messages)
    const nextCursor = hasMore && chronologicalMessages.length > 0
      ? chronologicalMessages[0].id
      : null;

    return NextResponse.json({
      id: session.id,
      userId: session.userId,
      user: session.user,
      isRead: session.isRead,
      isImportant: session.isImportant,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: chronologicalMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })),
      pagination: {
        hasMore,
        nextCursor,
        totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/c/[companySlug]/conversations/[sessionId] - Update session flags
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, sessionId } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { isRead, isImportant } = parsed.data;

    // Verify session belongs to company
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        companyId: company.id,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const updateData: { isRead?: boolean; isImportant?: boolean } = {};
    if (typeof isRead === "boolean") {
      updateData.isRead = isRead;
    }
    if (typeof isImportant === "boolean") {
      updateData.isImportant = isImportant;
    }

    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedSession.id,
      isRead: updatedSession.isRead,
      isImportant: updatedSession.isImportant,
    });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/c/[companySlug]/conversations/[sessionId] - Delete session
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, sessionId } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    // Verify session belongs to company
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        companyId: company.id,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Delete session (messages will cascade delete due to schema)
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
