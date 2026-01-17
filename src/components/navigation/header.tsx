"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Calendar } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
}

interface HeaderProps {
  companyName?: string;
  companySlug?: string;
  showAdminLink?: boolean;
  showMyAppointments?: boolean;
  appointmentCount?: number;
  navItems?: NavItem[];
}

export function Header({
  companyName = "BookBot",
  companySlug,
  showAdminLink = false,
  showMyAppointments = false,
  appointmentCount = 0,
  navItems = [],
}: HeaderProps) {
  const tNav = useTranslations("nav");

  const adminHref = companySlug ? `/c/${companySlug}/admin` : "/admin";
  const myAppointmentsHref = companySlug ? `/c/${companySlug}/my-appointments` : "/my-appointments";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        {/* Mobile nav trigger */}
        <MobileNav
          companyName={companyName}
          companySlug={companySlug}
          navItems={navItems}
          showAdminLink={showAdminLink}
          showMyAppointments={showMyAppointments}
          appointmentCount={appointmentCount}
        />

        {/* Logo / Company name */}
        <div className="mr-4 flex items-center">
          <Link
            href={companySlug ? `/c/${companySlug}` : "/"}
            className="flex items-center"
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

        {/* Right side - My Appointments, Admin link & User menu */}
        <div className="flex flex-1 items-center justify-end gap-1">
          {showMyAppointments && (
            <Link href={myAppointmentsHref} className="hidden md:flex">
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span>{tNav("myAppointments")}</span>
                {appointmentCount > 0 && (
                  <Badge
                    variant="default"
                    className="h-5 min-w-5 px-1.5 text-xs rounded-full"
                  >
                    {appointmentCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}
          {showAdminLink && (
            <Link href={adminHref} className="hidden md:flex">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                <span>{tNav("admin")}</span>
              </Button>
            </Link>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
