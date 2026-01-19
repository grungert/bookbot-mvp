"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Settings, Calendar } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
}

interface MobileNavProps {
  companyName?: string;
  companySlug?: string;
  companyLogo?: string | null;
  headerDisplayMode?: string;
  navItems?: NavItem[];
  showAdminLink?: boolean;
  showMyAppointments?: boolean;
  appointmentCount?: number;
}

export function MobileNav({
  companyName = "BookBot",
  companySlug,
  companyLogo,
  headerDisplayMode = "both",
  navItems = [],
  showAdminLink = false,
  showMyAppointments = false,
  appointmentCount = 0,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const tNav = useTranslations("nav");

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const adminHref = companySlug ? `/c/${companySlug}/admin` : "/admin";
  const myAppointmentsHref = companySlug ? `/c/${companySlug}/my-appointments` : "/my-appointments";

  // Render placeholder button during SSR to prevent layout shift
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="md:hidden mr-2">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {companyLogo && headerDisplayMode !== "name" && (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-6 w-6 object-contain"
              />
            )}
            {headerDisplayMode !== "logo" && companyName}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              {item.label}
            </Link>
          ))}
          {showMyAppointments && (
            <>
              <div className="h-px bg-border my-2" />
              <Link
                href={myAppointmentsHref}
                onClick={() => setOpen(false)}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {tNav("myAppointments")}
                {appointmentCount > 0 && (
                  <Badge variant="default" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                    {appointmentCount}
                  </Badge>
                )}
              </Link>
            </>
          )}
          {showAdminLink && (
            <>
              <div className="h-px bg-border my-2" />
              <Link
                href={adminHref}
                onClick={() => setOpen(false)}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                <Settings className="mr-2 h-4 w-4" />
                {tNav("admin")}
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
