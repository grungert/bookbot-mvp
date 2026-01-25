import { NextResponse } from "next/server";
import { validateCompanyAdminAccess } from "@/lib/db/tenant";
import { safeDecrypt } from "@/lib/encryption";

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

const WHATSAPP_API_VERSION = "v18.0";
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

/**
 * POST /api/c/[companySlug]/settings/whatsapp-test-message
 * Send a test WhatsApp message to verify the integration
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
    const { phoneNumber, accessToken, phoneNumberId } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Determine the actual access token to use
    let actualAccessToken = accessToken;

    // If no token provided or it's masked, use the stored one
    if (!accessToken || accessToken.startsWith("****")) {
      if (!company.whatsappAccessToken) {
        return NextResponse.json(
          { error: "Access token is required. Configure it in WhatsApp settings." },
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

    // Use provided phoneNumberId or fall back to stored one
    const actualPhoneNumberId = phoneNumberId || company.whatsappPhoneNumberId;

    if (!actualPhoneNumberId) {
      return NextResponse.json(
        { error: "Phone Number ID is required. Configure it in WhatsApp settings." },
        { status: 400 }
      );
    }

    // Clean phone number (remove spaces, dashes, and leading +)
    const cleanPhone = phoneNumber.replace(/[\s\-\+]/g, "");

    // Send test message using WhatsApp Cloud API
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${actualPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${actualAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: false,
            body: `🧪 Test message from ${company.name}!\n\nYour WhatsApp integration is working correctly. This message was sent via the BookBot settings page.\n\nTimestamp: ${new Date().toISOString()}`,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", data);

      // Parse specific error messages
      let errorMessage = "Failed to send message";
      if (data.error?.message) {
        errorMessage = data.error.message;

        // Provide helpful messages for common errors
        if (data.error.code === 131030) {
          errorMessage = "Recipient phone number not registered as a test number. Add it in Meta > WhatsApp > Getting Started.";
        } else if (data.error.code === 190) {
          errorMessage = "Invalid or expired access token. Please update your credentials.";
        } else if (data.error.code === 100) {
          errorMessage = "Invalid phone number format. Include country code without + (e.g., 381641234567).";
        }
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data.messages?.[0]?.id,
    });
  } catch (error) {
    console.error("Error sending test message:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send test message", details: errorMessage },
      { status: 500 }
    );
  }
}
