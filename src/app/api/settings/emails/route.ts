import { NextResponse } from "next/server";
import { getEmailSettings } from "@/lib/settings/emails";

/**
 * Public GET endpoint for email settings.
 * No authentication required - these are displayed on public pages.
 */
export async function GET() {
  try {
    const emails = await getEmailSettings();
    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch email settings" },
      { status: 500 }
    );
  }
}
