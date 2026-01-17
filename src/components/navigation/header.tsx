"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
}

interface HeaderProps {
  companyName?: string;
  companySlug?: string;
  showAdminLink?: boolean;
  navItems?: NavItem[];
}

export function Header({
  companyName = "BookBot",
  companySlug,
  showAdminLink = false,
  navItems = [],
}: HeaderProps) {
  const tNav = useTranslations("nav");

  const adminHref = companySlug ? `/c/${companySlug}/admin` : "/admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile nav trigger */}
        <MobileNav
          companyName={companyName}
          companySlug={companySlug}
          navItems={navItems}
          showAdminLink={showAdminLink}
        />

        {/* Logo / Company name */}
        <div className="mr-4 flex">
          <Link
            href={companySlug ? `/c/${companySlug}` : "/"}
            className="mr-6 flex items-center space-x-2"
          >
            <span className="font-bold">{companyName}</span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side - Admin link & User menu */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {showAdminLink && (
            <Link href={adminHref} className="hidden md:block">
              <Button variant="ghost" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                {tNav("admin")}
              </Button>
            </Link>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
