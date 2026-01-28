import { prisma } from "@/lib/prisma";
import { whatsappAdapter } from "@/lib/channels/whatsapp";
import { getCompanyCredentials } from "@/lib/channels/whatsapp";
import { getTranslator } from "@/lib/i18n/backend";
import { getCurrentPeriodBoundaries } from "@/lib/subscription/usage";

interface UsageThresholdCheckParams {
  userId: string;
  companyId: string;
  companyName: string;
  currentTokens: number;
  limit: number;
}

/**
 * Check if usage thresholds (80% / 100%) have been crossed and notify
 * the company owner via WhatsApp. Fire-and-forget — errors are logged,
 * never thrown.
 */
export async function checkAndNotifyUsageThresholds(
  params: UsageThresholdCheckParams
): Promise<void> {
  const { userId, companyId, companyName, currentTokens, limit } = params;

  // Skip unlimited plans
  if (limit <= 0) return;

  const percentUsed = (currentTokens / limit) * 100;
  const { periodStart } = getCurrentPeriodBoundaries();

  try {
    // Get current notification state for this period
    const usage = await prisma.chatUsage.findUnique({
      where: { userId_periodStart: { userId, periodStart } },
      select: { id: true, notifiedAt80: true, notifiedAt100: true },
    });

    if (!usage) return;

    const should80 = percentUsed >= 80 && !usage.notifiedAt80;
    const should100 = percentUsed >= 100 && !usage.notifiedAt100;

    if (!should80 && !should100) return;

    // Look up admin phone number
    const owner = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    // Get company language for translation
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { language: true },
    });

    const language = company?.language || "en";
    const t = getTranslator(language);

    // Check if WhatsApp credentials exist for this company
    const credentials = await getCompanyCredentials(companyId);
    const canSendWhatsApp = !!credentials && !!owner?.phone;

    if (should100) {
      // Send 100% limit reached notification
      if (canSendWhatsApp) {
        const message = t("notifications.usageLimitReached100", {
          company: companyName,
        });

        await whatsappAdapter.send(
          { to: owner!.phone!, content: message },
          companyId
        );
      }

      // Mark both thresholds as sent
      await prisma.chatUsage.update({
        where: { id: usage.id },
        data: { notifiedAt80: true, notifiedAt100: true },
      });
    } else if (should80) {
      // Send 80% warning
      if (canSendWhatsApp) {
        const message = t("notifications.usageWarning80", {
          company: companyName,
          used: String(currentTokens),
          limit: String(limit),
        });

        await whatsappAdapter.send(
          { to: owner!.phone!, content: message },
          companyId
        );
      }

      await prisma.chatUsage.update({
        where: { id: usage.id },
        data: { notifiedAt80: true },
      });
    }
  } catch (error) {
    console.error("Usage threshold notification error:", error);
  }
}
