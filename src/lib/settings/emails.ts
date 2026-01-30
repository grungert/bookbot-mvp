import prisma from "@/lib/prisma";

export interface EmailSettings {
  support: string;
  privacy: string;
  legal: string;
}

const DEFAULT_EMAILS: EmailSettings = {
  support: "support@bookbot.app",
  privacy: "privacy@bookbot.app",
  legal: "legal@bookbot.app",
};

/**
 * Fetches email settings from the database with fallback to defaults.
 * This is a server-side function for use in Server Components and API routes.
 */
export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          in: ["SUPPORT_EMAIL", "PRIVACY_EMAIL", "LEGAL_EMAIL"],
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return {
      support: settingsMap.SUPPORT_EMAIL || DEFAULT_EMAILS.support,
      privacy: settingsMap.PRIVACY_EMAIL || DEFAULT_EMAILS.privacy,
      legal: settingsMap.LEGAL_EMAIL || DEFAULT_EMAILS.legal,
    };
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return DEFAULT_EMAILS;
  }
}

export { DEFAULT_EMAILS };
