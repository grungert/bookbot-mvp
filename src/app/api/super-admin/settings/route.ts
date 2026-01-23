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

// All allowed settings keys
const ALL_SETTINGS_KEYS = [...BANK_SETTINGS_KEYS, ...SYSTEM_LIMIT_KEYS];

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
