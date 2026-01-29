import { NextResponse } from "next/server";
import { getCompanyBySlug } from "@/lib/db/tenant";

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/info - Public company info
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { companySlug } = await params;

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Return public company info (no sensitive data)
    return NextResponse.json({
      id: company.id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl,
      primaryColor: company.primaryColor,
      whatsapp: {
        enabled: company.whatsappEnabled && !!company.whatsappPhoneNumber,
        phoneNumber: company.whatsappEnabled ? company.whatsappPhoneNumber : null,
      },
    });
  } catch (error) {
    console.error("Error fetching company info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
