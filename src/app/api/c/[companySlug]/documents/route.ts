import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyBySlug, validateCompanyAdminAccess } from "@/lib/db/tenant";
import { checkDocumentLimit, getCompanyOwnerId, checkSubscriptionActive } from "@/lib/subscription";
import { z } from "zod";

const MAX_CONTENT_SIZE = 100 * 1024; // 100KB

const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  content: z.string().min(1, "Content is required").max(MAX_CONTENT_SIZE, `Content must be ${MAX_CONTENT_SIZE / 1024}KB or less`),
});

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/documents
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

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { companyId: company.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.document.count({
        where: { companyId: company.id },
      }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/c/[companySlug]/documents
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;
    const { error, company } = await validateCompanyAdminAccess(companySlug);

    if (error || !company) {
      return NextResponse.json(
        { error: error || "Company not found" },
        { status: error === "Unauthorized" ? 401 : 403 }
      );
    }

    // Check if company owner's subscription is active
    const ownerId = await getCompanyOwnerId(company.id);
    if (!ownerId) {
      return NextResponse.json(
        { error: "Company owner not found" },
        { status: 500 }
      );
    }

    const subscriptionStatus = await checkSubscriptionActive(ownerId);
    if (!subscriptionStatus.active) {
      return NextResponse.json(
        {
          error: subscriptionStatus.reason || "Subscription not active",
          code:
            subscriptionStatus.status === "TRIAL_EXPIRED"
              ? "TRIAL_EXPIRED"
              : "SUBSCRIPTION_INACTIVE",
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      );
    }

    // Check document limit for this company
    const documentLimit = await checkDocumentLimit(company.id);
    if (!documentLimit.allowed) {
      return NextResponse.json(
        {
          error: "Document limit reached for this company",
          code: "DOCUMENT_LIMIT",
          currentUsage: documentLimit.currentCount,
          limit: documentLimit.limit,
          upgradeUrl: "/pricing",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = createDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const document = await prisma.document.create({
      data: {
        companyId: company.id,
        title: parsed.data.title,
        content: parsed.data.content,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
