"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcher } from "./language-switcher";
import { AppointmentBadge } from "./appointment-badge";
import { Button } from "@/components/ui/button";
import { Settings, Calendar, MessageCircle } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
}

interface HeaderProps {
  companyName?: string;
  companySlug?: string;
  companyLogo?: string | null;
  headerDisplayMode?: string;
  showAdminLink?: boolean;
  showMyAppointments?: boolean;
  appointmentCount?: number;
  navItems?: NavItem[];
  whatsappEnabled?: boolean;
  whatsappPhoneNumber?: string | null;
  botName?: string | null;
}

export function Header({
  companyName = "BookBot",
  companySlug,
  companyLogo,
  headerDisplayMode = "both",
  showAdminLink = false,
  showMyAppointments = false,
  appointmentCount = 0,
  navItems = [],
  whatsappEnabled = false,
  whatsappPhoneNumber,
  botName,
}: HeaderProps) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");

  const adminHref = companySlug ? `/c/${companySlug}/admin` : "/admin";
  const myAppointmentsHref = companySlug ? `/c/${companySlug}/my-appointments` : "/my-appointments";

  // Check if we're in admin routes
  const isAdminRoute = pathname?.includes("/admin");

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      // Hide on mobile for admin routes (admin has its own mobile header)
      isAdminRoute && "hidden lg:block"
    )}>
      <div className="w-full flex h-14 items-center px-4">
        {/* Mobile nav trigger */}
        <MobileNav
          companyName={companyName}
          companySlug={companySlug}
          companyLogo={companyLogo}
          headerDisplayMode={headerDisplayMode}
          navItems={navItems}
          showAdminLink={showAdminLink}
          showMyAppointments={showMyAppointments}
          appointmentCount={appointmentCount}
          whatsappEnabled={whatsappEnabled}
          whatsappPhoneNumber={whatsappPhoneNumber}
          botName={botName}
        />

        {/* Logo / Company name */}
        <div className="mr-4 flex items-center">
          <Link
            href={companySlug ? `/c/${companySlug}` : "/"}
            className="flex items-center gap-2"
          >
            {companyLogo && headerDisplayMode !== "name" && (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-8 w-8 object-contain"
              />
            )}
            {headerDisplayMode !== "logo" && (
              <span className="font-bold">{companyName}</span>
            )}
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

        {/* Right side - WhatsApp, My Appointments, Admin link & User menu */}
        <div className="flex flex-1 items-center justify-end gap-1">
          {whatsappEnabled && whatsappPhoneNumber && (
            <a
              href={`https://wa.me/${whatsappPhoneNumber.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              title={tNav("chatWithAssistantTooltip", { name: botName || tNav("assistant") })}
              className="hidden md:flex"
            >
              <Button variant="ghost" size="sm" className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30">
                <MessageCircle className="h-4 w-4" />
                <span>{tNav("chatWithAssistant", { name: botName || tNav("assistant") })}</span>
              </Button>
            </a>
          )}
          {showMyAppointments && (
            <Link href={myAppointmentsHref} className="hidden md:flex">
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                <span>{tNav("myAppointments")}</span>
                <AppointmentBadge initialCount={appointmentCount} />
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
          <LanguageSwitcher />
          <UserMenu companySlug={companySlug} />
        </div>
      </div>
    </header>
  );
}
