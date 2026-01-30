"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";

interface UpgradeModalTriggerProps {
  currentTier?: string | null;
  hasChatbot?: boolean;
  primaryColor?: string | null;
  currentCompanyCount?: number;
}

/**
 * Client component that listens for `openUpgrade` query param and opens the UpgradeModal.
 * Used in admin layout when subscription is active (not blocked).
 */
export function UpgradeModalTrigger({
  currentTier,
  hasChatbot,
  primaryColor,
  currentCompanyCount,
}: UpgradeModalTriggerProps) {
  const searchParams = useSearchParams();
  const hasProcessedParam = useRef(false);

  const openUpgradeParam = searchParams.get("openUpgrade");

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "BUSINESS">("PRO");

  // Handle URL param and modal opening
  useEffect(() => {
    if (hasProcessedParam.current) return;
    if (openUpgradeParam && (openUpgradeParam === "PRO" || openUpgradeParam === "BUSINESS")) {
      hasProcessedParam.current = true;
      // Open modal with selected plan
      queueMicrotask(() => {
        setSelectedPlan(openUpgradeParam);
        setShowUpgradeModal(true);
      });
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [openUpgradeParam]);

  // Only render if there's a param to process or modal is open
  if (!showUpgradeModal && !openUpgradeParam) {
    return null;
  }

  return (
    <UpgradeModal
      open={showUpgradeModal}
      onOpenChange={setShowUpgradeModal}
      currentTier={currentTier}
      hasChatbot={hasChatbot}
      primaryColor={primaryColor}
      currentCompanyCount={currentCompanyCount}
      defaultSelectedPlan={selectedPlan}
    />
  );
}
