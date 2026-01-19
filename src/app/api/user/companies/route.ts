import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserCompanies, checkCanCreateCompany } from "@/lib/db/tenant";

// GET /api/user/companies - Get current user's accessible companies
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only COMPANY_ADMIN can have multiple companies
    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ companies: [], canCreateMore: false });
    }

    const companies = await getUserCompanies(session.user.id);
    const canCreateResult = await checkCanCreateCompany(session.user.id);

    return NextResponse.json({
      companies,
      canCreateMore: canCreateResult.allowed,
      currentCount: canCreateResult.currentCount,
      maxCount: canCreateResult.maxCount,
    });
  } catch (error) {
    console.error("Error fetching user companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
