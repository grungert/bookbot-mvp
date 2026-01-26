import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCompanyAdminAccess, getCompanyBySlug } from "@/lib/db/tenant";
import { estimateTokens, DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS } from "@/lib/document-tokens";
import { encrypt, safeDecrypt, maskValue } from "@/lib/encryption";
import { z } from "zod";

const updateSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  headerDisplayMode: z.enum(["both", "logo", "name"]).optional(),
  primaryColor: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.enum(["RSD", "EUR"]).optional(),
  language: z.enum(["en", "sr"]).optional(),
  aiApiKey: z.string().nullable().optional(),
  aiEndpoint: z.string().nullable().optional(),
  aiModel: z.string().nullable().optional(),
  aiSystemPrompt: z.string().nullable().optional(),
  aiBotName: z.string().nullable().optional(),
  aiGreeting: z.string().nullable().optional(),
  aiPersonality: z.string().nullable().optional(),
  // Business Details
  businessAddress: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  vatNumber: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  businessPhone: z.string().nullable().optional(),
  businessEmail: z.string().email().nullable().optional(),
  notificationEmails: z.array(z.string().email()).optional(),
  taxRate: z.number().min(0).max(100).nullable().optional(),
  // WhatsApp Channel Settings
  whatsappEnabled: z.boolean().optional(),
  whatsappPhoneNumber: z.string().nullable().optional(),
  whatsappGreeting: z.string().nullable().optional(),
  whatsappAutoReply: z.string().nullable().optional(),
  whatsappAccessToken: z.string().nullable().optional(),
  whatsappPhoneNumberId: z.string().nullable().optional(),
  whatsappAppSecret: z.string().nullable().optional(),
  whatsappScope: z.enum(["company", "all"]).optional(),
});

interface RouteParams {
  params: Promise<{ companySlug: string }>;
}

// GET /api/c/[companySlug]/settings - Get company settings
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

    // Return settings without exposing the full API key
    const settings = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      logoUrl: company.logoUrl,
      headerDisplayMode: company.headerDisplayMode,
      primaryColor: company.primaryColor,
      timezone: company.timezone,
      currency: company.currency,
      language: company.language,
      // Mask API key - only show last 4 chars if exists
      aiApiKey: company.aiApiKey
        ? `***${company.aiApiKey.slice(-4)}`
        : null,
      hasAiApiKey: !!company.aiApiKey,
      aiEndpoint: company.aiEndpoint,
      aiModel: company.aiModel,
      aiSystemPrompt: company.aiSystemPrompt,
      aiBotName: company.aiBotName,
      aiGreeting: company.aiGreeting,
      aiPersonality: company.aiPersonality,
      // Business Details
      businessAddress: company.businessAddress,
      taxId: company.taxId,
      vatNumber: company.vatNumber,
      bankAccount: company.bankAccount,
      bankName: company.bankName,
      businessPhone: company.businessPhone,
      businessEmail: company.businessEmail,
      notificationEmails: company.notificationEmails || [],
      taxRate: company.taxRate ? Number(company.taxRate) : 20,
      // WhatsApp Channel Settings (mask sensitive credentials)
      whatsappEnabled: company.whatsappEnabled,
      whatsappPhoneNumber: company.whatsappPhoneNumber,
      whatsappGreeting: company.whatsappGreeting,
      whatsappAutoReply: company.whatsappAutoReply,
      whatsappPhoneNumberId: company.whatsappPhoneNumberId,
      whatsappScope: company.whatsappScope,
      // Masked credentials - only show last 4 chars
      whatsappAccessToken: company.whatsappAccessToken ? maskValue(safeDecrypt(company.whatsappAccessToken)) : null,
      whatsappAppSecret: company.whatsappAppSecret ? maskValue(safeDecrypt(company.whatsappAppSecret)) : null,
      hasWhatsappAccessToken: !!company.whatsappAccessToken,
      hasWhatsappAppSecret: !!company.whatsappAppSecret,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/c/[companySlug]/settings - Update company settings
export async function PATCH(request: Request, { params }: RouteParams) {
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
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check custom instructions token limit
    if (data.aiSystemPrompt) {
      const tokenLimitSetting = await prisma.systemSettings.findUnique({
        where: { key: "MAX_CUSTOM_INSTRUCTIONS_TOKENS" },
      });
      const maxTokens = tokenLimitSetting
        ? parseInt(tokenLimitSetting.value, 10) || DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS
        : DEFAULT_MAX_CUSTOM_INSTRUCTIONS_TOKENS;

      const promptTokens = estimateTokens(data.aiSystemPrompt);
      if (promptTokens > maxTokens) {
        return NextResponse.json(
          {
            error: `Custom instructions exceed token limit. ${promptTokens.toLocaleString()} tokens used, maximum is ${maxTokens.toLocaleString()} tokens.`,
            code: "TOKEN_LIMIT_EXCEEDED",
            currentTokens: promptTokens,
            maxTokens,
          },
          { status: 400 }
        );
      }
    }

    // Build update object, only including fields that were provided
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.headerDisplayMode !== undefined) updateData.headerDisplayMode = data.headerDisplayMode;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.aiEndpoint !== undefined) updateData.aiEndpoint = data.aiEndpoint;
    if (data.aiModel !== undefined) updateData.aiModel = data.aiModel;
    if (data.aiSystemPrompt !== undefined) updateData.aiSystemPrompt = data.aiSystemPrompt;
    if (data.aiBotName !== undefined) updateData.aiBotName = data.aiBotName;
    if (data.aiGreeting !== undefined) updateData.aiGreeting = data.aiGreeting;
    if (data.aiPersonality !== undefined) updateData.aiPersonality = data.aiPersonality;

    // Business Details
    if (data.businessAddress !== undefined) updateData.businessAddress = data.businessAddress;
    if (data.taxId !== undefined) updateData.taxId = data.taxId;
    if (data.vatNumber !== undefined) updateData.vatNumber = data.vatNumber;
    if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.businessPhone !== undefined) updateData.businessPhone = data.businessPhone;
    if (data.businessEmail !== undefined) updateData.businessEmail = data.businessEmail;
    if (data.notificationEmails !== undefined) {
      // Normalize to lowercase and deduplicate
      updateData.notificationEmails = [...new Set(
        data.notificationEmails.map(email => email.toLowerCase().trim())
      )];
    }
    if (data.taxRate !== undefined) updateData.taxRate = data.taxRate;

    // Only update API key if a new one is provided (not masked value)
    if (data.aiApiKey !== undefined && !data.aiApiKey?.startsWith("***")) {
      updateData.aiApiKey = data.aiApiKey;
    }

    // WhatsApp Channel Settings
    if (data.whatsappEnabled !== undefined) updateData.whatsappEnabled = data.whatsappEnabled;
    if (data.whatsappPhoneNumber !== undefined) updateData.whatsappPhoneNumber = data.whatsappPhoneNumber;
    if (data.whatsappGreeting !== undefined) updateData.whatsappGreeting = data.whatsappGreeting;
    if (data.whatsappAutoReply !== undefined) updateData.whatsappAutoReply = data.whatsappAutoReply;
    if (data.whatsappPhoneNumberId !== undefined) updateData.whatsappPhoneNumberId = data.whatsappPhoneNumberId;
    if (data.whatsappScope !== undefined) updateData.whatsappScope = data.whatsappScope;

    // Encrypt WhatsApp credentials before saving (only if new value provided, not masked)
    if (data.whatsappAccessToken !== undefined && data.whatsappAccessToken !== null && !data.whatsappAccessToken.startsWith("****")) {
      try {
        updateData.whatsappAccessToken = encrypt(data.whatsappAccessToken);
      } catch (encryptError) {
        console.error("Failed to encrypt WhatsApp access token:", encryptError);
        return NextResponse.json(
          { error: "Failed to encrypt credentials. Please check ENCRYPTION_KEY is configured." },
          { status: 500 }
        );
      }
    } else if (data.whatsappAccessToken === null) {
      updateData.whatsappAccessToken = null;
    }

    if (data.whatsappAppSecret !== undefined && data.whatsappAppSecret !== null && !data.whatsappAppSecret.startsWith("****")) {
      try {
        updateData.whatsappAppSecret = encrypt(data.whatsappAppSecret);
      } catch (encryptError) {
        console.error("Failed to encrypt WhatsApp app secret:", encryptError);
        return NextResponse.json(
          { error: "Failed to encrypt credentials. Please check ENCRYPTION_KEY is configured." },
          { status: 500 }
        );
      }
    } else if (data.whatsappAppSecret === null) {
      updateData.whatsappAppSecret = null;
    }

    const updatedCompany = await prisma.company.update({
      where: { id: company.id },
      data: updateData,
    });

    // Manage WhatsAppPhoneMapping based on the phone number ID
    if (data.whatsappPhoneNumberId !== undefined) {
      if (data.whatsappPhoneNumberId) {
        // Check if this phone number ID is already used by another company
        const existingMapping = await prisma.whatsAppPhoneMapping.findUnique({
          where: { phoneNumberId: data.whatsappPhoneNumberId },
        });

        if (existingMapping && existingMapping.companyId !== company.id) {
          return NextResponse.json(
            { error: "This WhatsApp phone number ID is already in use by another company." },
            { status: 400 }
          );
        }

        // Upsert the phone mapping
        await prisma.whatsAppPhoneMapping.upsert({
          where: { companyId: company.id },
          update: { phoneNumberId: data.whatsappPhoneNumberId },
          create: {
            phoneNumberId: data.whatsappPhoneNumberId,
            companyId: company.id,
          },
        });
      } else {
        // Remove the phone mapping if phone number ID is cleared
        await prisma.whatsAppPhoneMapping.deleteMany({
          where: { companyId: company.id },
        });
      }
    }

    // Return updated settings without exposing full API key
    const settings = {
      id: updatedCompany.id,
      name: updatedCompany.name,
      slug: updatedCompany.slug,
      description: updatedCompany.description,
      logoUrl: updatedCompany.logoUrl,
      headerDisplayMode: updatedCompany.headerDisplayMode,
      primaryColor: updatedCompany.primaryColor,
      timezone: updatedCompany.timezone,
      currency: updatedCompany.currency,
      language: updatedCompany.language,
      aiApiKey: updatedCompany.aiApiKey
        ? `***${updatedCompany.aiApiKey.slice(-4)}`
        : null,
      hasAiApiKey: !!updatedCompany.aiApiKey,
      aiEndpoint: updatedCompany.aiEndpoint,
      aiModel: updatedCompany.aiModel,
      aiSystemPrompt: updatedCompany.aiSystemPrompt,
      aiBotName: updatedCompany.aiBotName,
      aiGreeting: updatedCompany.aiGreeting,
      aiPersonality: updatedCompany.aiPersonality,
      // Business Details
      businessAddress: updatedCompany.businessAddress,
      taxId: updatedCompany.taxId,
      vatNumber: updatedCompany.vatNumber,
      bankAccount: updatedCompany.bankAccount,
      bankName: updatedCompany.bankName,
      businessPhone: updatedCompany.businessPhone,
      businessEmail: updatedCompany.businessEmail,
      notificationEmails: updatedCompany.notificationEmails || [],
      taxRate: updatedCompany.taxRate ? Number(updatedCompany.taxRate) : 20,
      // WhatsApp Channel Settings (mask sensitive credentials)
      whatsappEnabled: updatedCompany.whatsappEnabled,
      whatsappPhoneNumber: updatedCompany.whatsappPhoneNumber,
      whatsappGreeting: updatedCompany.whatsappGreeting,
      whatsappAutoReply: updatedCompany.whatsappAutoReply,
      whatsappPhoneNumberId: updatedCompany.whatsappPhoneNumberId,
      whatsappScope: updatedCompany.whatsappScope,
      // Masked credentials - only show last 4 chars
      whatsappAccessToken: updatedCompany.whatsappAccessToken ? maskValue(safeDecrypt(updatedCompany.whatsappAccessToken)) : null,
      whatsappAppSecret: updatedCompany.whatsappAppSecret ? maskValue(safeDecrypt(updatedCompany.whatsappAppSecret)) : null,
      hasWhatsappAccessToken: !!updatedCompany.whatsappAccessToken,
      hasWhatsappAppSecret: !!updatedCompany.whatsappAppSecret,
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
