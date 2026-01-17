import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess } from "@/lib/db/tenant";
import { z } from "zod";

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
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
