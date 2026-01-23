"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Building2, Check, Plus, ChevronDown, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCompanyModal } from "./create-company-modal";

interface Company {
  companyId: string;
  companySlug: string;
  companyName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  role: "OWNER" | "ADMIN";
  isPrimary: boolean;
}

interface CompanySwitcherProps {
  currentCompanySlug: string;
  currentCompanyName: string;
  isCollapsed?: boolean;
}

export function CompanySwitcher({
  currentCompanySlug,
  currentCompanyName,
  isCollapsed = false,
}: CompanySwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin");
  const [mounted, setMounted] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [canCreateMore, setCanCreateMore] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);
  const [maxCount, setMaxCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [liveColor, setLiveColor] = useState<string | null>(null);

  // Get current company's primary color for the checkmark
  const currentCompany = companies.find(c => c.companySlug === currentCompanySlug);
  // Use live color if available (updated via event), otherwise fall back to stored color
  const checkColor = liveColor || currentCompany?.primaryColor || "#3B82F6";

  useEffect(() => {
    setMounted(true);
    fetchCompanies();
  }, []);

  // Listen for real-time color changes from settings page
  useEffect(() => {
    const handleColorChange = (event: CustomEvent<{ color: string }>) => {
      setLiveColor(event.detail.color);
    };

    window.addEventListener("company-color-change", handleColorChange as EventListener);
    return () => {
      window.removeEventListener("company-color-change", handleColorChange as EventListener);
    };
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/user/companies");
      const data = await response.json();
      if (response.ok) {
        setCompanies(data.companies || []);
        setCanCreateMore(data.canCreateMore ?? false);
        setCurrentCount(data.currentCount ?? 0);
        setMaxCount(data.maxCount ?? null);
      } else {
        console.error("Company switcher API error:", data);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchCompany = (companySlug: string) => {
    if (companySlug === currentCompanySlug) return;

    // Replace the company slug in the current path
    const newPath = pathname.replace(
      `/c/${currentCompanySlug}`,
      `/c/${companySlug}`
    );
    router.push(newPath);
  };

  const handleCompanyCreated = (newCompany: { slug: string; name: string }) => {
    // Navigate to the new company's admin dashboard
    router.push(`/${locale}/c/${newCompany.slug}/admin`);
  };

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  // Show loading state while fetching
  if (isLoading) {
    return null;
  }

  // Always show the company switcher to display subscription info

  // Collapsed view - show icon only with dropdown
  if (isCollapsed) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              disabled={isLoading}
            >
              <Building2 className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            {/* Company counter */}
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center justify-between">
              <span>
                {maxCount !== null
                  ? `${companies.length}/${maxCount} ${t("companiesUsed") || "companies"}`
                  : `${companies.length} ${t("companiesUsed") || "companies"}`}
              </span>
              {maxCount !== null && !canCreateMore && (
                <button
                  className="hover:opacity-80 text-[10px] font-medium"
                  style={{ color: checkColor }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${locale}/c/${currentCompanySlug}/admin/settings#subscription`);
                  }}
                >
                  {t("upgradeForMore") || "Upgrade"}
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {companies.map((company) => (
              <DropdownMenuItem
                key={company.companyId}
                onClick={() => handleSwitchCompany(company.companySlug)}
                className="flex items-center justify-between gap-2"
              >
                <span className="truncate">{company.companyName}</span>
                {company.companySlug === currentCompanySlug && (
                  <Check className="h-4 w-4" style={{ color: checkColor }} />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {canCreateMore ? (
              <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("createCompany")}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => router.push(`/${locale}/c/${currentCompanySlug}/admin/settings#subscription`)}
              >
                <Crown className="h-4 w-4 mr-2" style={{ color: checkColor }} />
                <span style={{ color: checkColor }}>{t("upgradeForMore") || "Upgrade for more"}</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <CreateCompanyModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={handleCompanyCreated}
        />
      </>
    );
  }

  // Expanded view
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto py-2 px-3"
            disabled={isLoading}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">
                {currentCompanyName}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
          {/* Company counter */}
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center justify-between">
            <span>
              {maxCount !== null
                ? `${companies.length}/${maxCount} ${t("companiesUsed") || "companies"}`
                : `${companies.length} ${t("companiesUsed") || "companies"}`}
            </span>
            {maxCount !== null && !canCreateMore && (
              <button
                className="hover:opacity-80 text-[10px] font-medium"
                style={{ color: checkColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/${locale}/c/${currentCompanySlug}/admin/settings#subscription`);
                }}
              >
                {t("upgradeForMore") || "Upgrade"}
              </button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.companyId}
              onClick={() => handleSwitchCompany(company.companySlug)}
              className={cn(
                "flex items-center justify-between gap-2",
                company.companySlug === currentCompanySlug && "bg-muted"
              )}
            >
              <span className="truncate">{company.companyName}</span>
              {company.companySlug === currentCompanySlug && (
                <Check className="h-4 w-4" style={{ color: checkColor }} />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {canCreateMore ? (
            <DropdownMenuItem onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("createCompany")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => router.push(`/${locale}/c/${currentCompanySlug}/admin/settings#subscription`)}
            >
              <Crown className="h-4 w-4 mr-2" style={{ color: checkColor }} />
              <span style={{ color: checkColor }}>{t("upgradeForMore") || "Upgrade for more"}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateCompanyModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCompanyCreated}
      />
    </>
  );
}
