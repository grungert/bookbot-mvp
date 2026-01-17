"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  Clock,
  FileText,
  Settings,
  FileArchive,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdminSidebarProps {
  companySlug: string;
  companyName: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function useNavItems(companySlug: string) {
  const t = useTranslations("nav");
  const tAdmin = useTranslations("admin");

  const basePath = `/c/${companySlug}/admin`;

  return [
    {
      href: basePath,
      label: tAdmin("dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: `${basePath}/services`,
      label: t("services"),
      icon: Briefcase,
    },
    {
      href: `${basePath}/appointments`,
      label: t("bookings"),
      icon: Calendar,
    },
    {
      href: `${basePath}/working-hours`,
      label: "Working Hours",
      icon: Clock,
    },
    {
      href: `${basePath}/invoices`,
      label: t("invoices"),
      icon: FileText,
    },
    {
      href: `${basePath}/documents`,
      label: tAdmin("documents"),
      icon: FileArchive,
    },
    {
      href: `${basePath}/settings`,
      label: t("settings"),
      icon: Settings,
    },
  ];
}

function NavContent({
  navItems,
  pathname,
  basePath,
  companySlug,
  companyName,
  onItemClick,
}: {
  navItems: NavItem[];
  pathname: string;
  basePath: string;
  companySlug: string;
  companyName: string;
  onItemClick?: () => void;
}) {
  const tNav = useTranslations("nav");

  return (
    <>
      <div className="p-4 border-b">
        <Link
          href={`/c/${companySlug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={onItemClick}
        >
          <ChevronLeft className="h-4 w-4" />
          {tNav("backToSite")}
        </Link>
        <h2 className="font-semibold mt-2 truncate">{companyName}</h2>
        <p className="text-xs text-muted-foreground">Admin Panel</p>
      </div>
      <nav className="p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== basePath && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onItemClick}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 mb-1",
                  isActive && "bg-secondary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AdminSidebar({ companySlug, companyName }: AdminSidebarProps) {
  const pathname = usePathname();
  const navItems = useNavItems(companySlug);
  const basePath = `/c/${companySlug}/admin`;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 min-h-screen bg-card border-r">
        <NavContent
          navItems={navItems}
          pathname={pathname}
          basePath={basePath}
          companySlug={companySlug}
          companyName={companyName}
        />
      </aside>
    </>
  );
}

export function AdminMobileNav({
  companySlug,
  companyName,
}: AdminSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navItems = useNavItems(companySlug);
  const basePath = `/c/${companySlug}/admin`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Admin Navigation</SheetTitle>
        </SheetHeader>
        <NavContent
          navItems={navItems}
          pathname={pathname}
          basePath={basePath}
          companySlug={companySlug}
          companyName={companyName}
          onItemClick={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
