import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { z } from "zod";

const querySchema = z.object({
  sessionId: z.string().min(1),
});

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/chat/history?sessionId=xxx
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

    const parsed = querySchema.safeParse({ sessionId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid session ID" },
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

    // Get messages for this session
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      messages: messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });
  } catch (error) {
    console.error("Chat history error:", error);
    return NextResponse.json(
      { error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}
