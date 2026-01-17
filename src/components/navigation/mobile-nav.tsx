"use client";

import { useState } from "react";
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
import { Menu, Settings, Calendar } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
}

interface MobileNavProps {
  companyName?: string;
  companySlug?: string;
  navItems?: NavItem[];
  showAdminLink?: boolean;
  showMyAppointments?: boolean;
}

export function MobileNav({
  companyName = "BookBot",
  companySlug,
  navItems = [],
  showAdminLink = false,
  showMyAppointments = false,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const tNav = useTranslations("nav");

  const adminHref = companySlug ? `/c/${companySlug}/admin` : "/admin";
  const myAppointmentsHref = companySlug ? `/c/${companySlug}/my-appointments` : "/my-appointments";

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
          <SheetTitle>{companyName}</SheetTitle>
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
