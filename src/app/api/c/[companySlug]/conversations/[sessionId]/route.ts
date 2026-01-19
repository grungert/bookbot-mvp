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

// GET /api/c/[companySlug]/conversations/[sessionId] - Get full conversation
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
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: session.id,
      userId: session.userId,
      user: session.user,
      isRead: session.isRead,
      isImportant: session.isImportant,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: session.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
      })),
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
