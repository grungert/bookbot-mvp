import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Bank settings keys
const BANK_SETTINGS_KEYS = [
  "BANK_NAME",
  "BANK_ACCOUNT_NAME",
  "BANK_IBAN",
  "BANK_BIC",
];

// System limit settings keys
const SYSTEM_LIMIT_KEYS = [
  "MAX_DOCUMENT_TOKENS",
  "MAX_CUSTOM_INSTRUCTIONS_TOKENS",
];

// Contact email settings keys
const EMAIL_SETTINGS_KEYS = [
  "SUPPORT_EMAIL",
  "PRIVACY_EMAIL",
  "LEGAL_EMAIL",
];

// All allowed settings keys
const ALL_SETTINGS_KEYS = [...BANK_SETTINGS_KEYS, ...SYSTEM_LIMIT_KEYS, ...EMAIL_SETTINGS_KEYS];

// IBAN validation regex - basic format check (2 letters + 2 digits + up to 30 alphanumeric)
const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;

// BIC/SWIFT validation regex (8 or 11 characters: 4 letters bank code, 2 letters country, 2 alphanumeric location, optional 3 alphanumeric branch)
const BIC_REGEX = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET system settings
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let settings: { key: string; value: string }[] = [];
    try {
      settings = await prisma.systemSettings.findMany({
        where: {
          key: { in: ALL_SETTINGS_KEYS },
        },
        select: {
          key: true,
          value: true,
        },
      });
    } catch {
      // If model isn't available yet, return empty
      settings = [];
    }

    // Convert to key-value object
    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT to update system settings
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      );
    }

    // Validate IBAN format if provided
    if (settings.BANK_IBAN && typeof settings.BANK_IBAN === "string" && settings.BANK_IBAN.trim() !== "") {
      // Remove spaces and convert to uppercase for validation
      const cleanIban = settings.BANK_IBAN.replace(/\s/g, "").toUpperCase();
      if (!IBAN_REGEX.test(cleanIban)) {
        return NextResponse.json(
          { error: "Invalid IBAN format. Expected format: 2 letters followed by 2 digits and up to 30 alphanumeric characters (e.g., RS35123456789012345678)" },
          { status: 400 }
        );
      }
      // Store the cleaned version
      settings.BANK_IBAN = cleanIban;
    }

    // Validate BIC format if provided
    if (settings.BANK_BIC && typeof settings.BANK_BIC === "string" && settings.BANK_BIC.trim() !== "") {
      const cleanBic = settings.BANK_BIC.replace(/\s/g, "").toUpperCase();
      if (!BIC_REGEX.test(cleanBic)) {
        return NextResponse.json(
          { error: "Invalid BIC/SWIFT format. Expected format: 8 or 11 characters (e.g., RABORARS or RABORARSXXX)" },
          { status: 400 }
        );
      }
      // Store the cleaned version
      settings.BANK_BIC = cleanBic;
    }

    // Validate email formats if provided
    for (const emailKey of EMAIL_SETTINGS_KEYS) {
      if (settings[emailKey] && typeof settings[emailKey] === "string" && settings[emailKey].trim() !== "") {
        const cleanEmail = settings[emailKey].trim().toLowerCase();
        if (!EMAIL_REGEX.test(cleanEmail)) {
          return NextResponse.json(
            { error: `Invalid email format for ${emailKey.replace("_EMAIL", "").toLowerCase()} email.` },
            { status: 400 }
          );
        }
        // Store the cleaned version
        settings[emailKey] = cleanEmail;
      }
    }

    // Update each setting
    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      if (!ALL_SETTINGS_KEYS.includes(key)) continue;

      updates.push(
        prisma.systemSettings.upsert({
          where: { key },
          update: {
            value: String(value),
            updatedBy: user.id,
          },
          create: {
            key,
            value: String(value),
            updatedBy: user.id,
          },
        })
      );
    }

    await prisma.$transaction(updates);

    // Fetch updated settings
    const updatedSettings = await prisma.systemSettings.findMany({
      where: {
        key: { in: ALL_SETTINGS_KEYS },
      },
    });

    const settingsMap: Record<string, string> = {};
    for (const setting of updatedSettings) {
      settingsMap[setting.key] = setting.value;
    }

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
