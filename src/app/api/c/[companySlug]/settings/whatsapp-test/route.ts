import { NextResponse } from "next/server";
import { validateCompanyAdminAccess } from "@/lib/db/tenant";
import { safeDecrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

const WHATSAPP_API_VERSION = "v18.0";
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

/**
 * POST /api/c/[companySlug]/settings/whatsapp-test
 * Test WhatsApp API connection with the provided credentials
 */
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

    const body = await request.json();
    const { accessToken, phoneNumberId } = body;

    // Validate required fields
    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        { error: "Access token and phone number ID are required" },
        { status: 400 }
      );
    }

    // Determine the actual access token to use
    let actualAccessToken = accessToken;

    // If the provided token is masked, use the stored one
    if (accessToken.startsWith("****")) {
      if (!company.whatsappAccessToken) {
        return NextResponse.json(
          { error: "No stored access token found. Please enter a new token." },
          { status: 400 }
        );
      }
      actualAccessToken = safeDecrypt(company.whatsappAccessToken);
      if (!actualAccessToken) {
        return NextResponse.json(
          { error: "Failed to decrypt stored access token" },
          { status: 500 }
        );
      }
    }

    // Test the connection by fetching phone number details
    const url = `${WHATSAPP_API_BASE}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${actualAccessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Extract meaningful error message from Meta API response
      const errorMessage =
        data.error?.message ||
        data.error?.error_user_msg ||
        "Connection test failed";
      const errorCode = data.error?.code;

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          errorCode,
          details: data.error,
        },
        { status: 400 }
      );
    }

    // Connection successful - return phone number details
    return NextResponse.json({
      success: true,
      phoneNumber: data.display_phone_number,
      verifiedName: data.verified_name,
      qualityRating: data.quality_rating,
    });
  } catch (error) {
    console.error("WhatsApp test connection error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Connection test failed", details: errorMessage },
      { status: 500 }
    );
  }
}
