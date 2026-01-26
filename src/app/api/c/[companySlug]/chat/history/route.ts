import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { z } from "zod";

const querySchema = z.object({
  sessionId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/chat/history?sessionId=xxx&limit=30&cursor=xxx
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const company = await getCompanyBySlug(companySlug);

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");

    const parsed = querySchema.safeParse({
      sessionId,
      limit: limit ?? undefined,
      cursor: cursor ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 }
      );
    }

    // Validate session belongs to this company
    const session = await prisma.chatSession.findFirst({
      where: {
        id: parsed.data.sessionId,
        companyId: company.id,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const take = parsed.data.limit + 1;

    // Get messages for this session with cursor-based pagination
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId: session.id,
        role: { in: ["user", "assistant"] },
        ...(parsed.data.cursor ? { id: { lt: parsed.data.cursor } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    const hasMore = messages.length > parsed.data.limit;
    const sliced = hasMore ? messages.slice(0, parsed.data.limit) : messages;
    const reversed = sliced.reverse(); // back to chronological order
    const nextCursor = hasMore ? sliced[0].id : null;

    return NextResponse.json({
      sessionId: session.id,
      messages: reversed.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: m.createdAt.toISOString(),
      })),
      pagination: {
        hasMore,
        nextCursor,
      },
    });
  } catch (error) {
    console.error("Chat history error:", error);
    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}
