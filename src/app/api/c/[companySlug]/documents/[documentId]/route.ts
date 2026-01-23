import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess } from "@/lib/db/tenant";
import { estimateTokens, DEFAULT_MAX_DOCUMENT_TOKENS } from "@/lib/document-tokens";
import { z } from "zod";

const MAX_CONTENT_SIZE = 100 * 1024; // 100KB

const updateDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less").optional(),
  content: z.string().min(1, "Content is required").max(MAX_CONTENT_SIZE, `Content must be ${MAX_CONTENT_SIZE / 1024}KB or less`).optional(),
});

interface RouteParams {
  params: Promise<{ companySlug: string; documentId: string }>;
}

// PATCH /api/c/[companySlug]/documents/[documentId]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, documentId } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId: company.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check token limit if content is being updated
    if (parsed.data.content) {
      const tokenLimitSetting = await prisma.systemSettings.findUnique({
        where: { key: "MAX_DOCUMENT_TOKENS" },
      });
      const maxTokens = tokenLimitSetting
        ? parseInt(tokenLimitSetting.value, 10) || DEFAULT_MAX_DOCUMENT_TOKENS
        : DEFAULT_MAX_DOCUMENT_TOKENS;

      const documentTokens = estimateTokens(parsed.data.content);
      if (documentTokens > maxTokens) {
        return NextResponse.json(
          {
            error: `Document exceeds token limit. ${documentTokens.toLocaleString()} tokens used, maximum is ${maxTokens.toLocaleString()} tokens.`,
            code: "TOKEN_LIMIT_EXCEEDED",
            currentTokens: documentTokens,
            maxTokens,
          },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/c/[companySlug]/documents/[documentId]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { companySlug, documentId } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, companyId: company.id },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
