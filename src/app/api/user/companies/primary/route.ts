import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setUserPrimaryCompany } from "@/lib/db/tenant";
import { z } from "zod";

const setPrimarySchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
});

// PATCH /api/user/companies/primary - Set user's primary company
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only COMPANY_ADMIN can set primary company
    if (session.user.role !== "COMPANY_ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only company admins can set primary company" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = setPrimarySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { companyId } = parsed.data;

    try {
      await setUserPrimaryCompany(session.user.id, companyId);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json(
        { error: "You don't have access to this company" },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Error setting primary company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
