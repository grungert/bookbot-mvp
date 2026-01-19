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
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  primaryColor?: string | null;
  pendingAppointmentsCount?: number;
  actionableInvoicesCount?: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

function useNavItems(companySlug: string, pendingAppointmentsCount?: number, actionableInvoicesCount?: number) {
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
      badge: pendingAppointmentsCount,
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
      badge: actionableInvoicesCount,
    },
    {
      href: `${basePath}/documents`,
      label: tAdmin("documents"),
      icon: FileArchive,
    },
    {
      href: `${basePath}/conversations`,
      label: tAdmin("conversations"),
      icon: MessageSquare,
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
  primaryColor,
  onItemClick,
}: {
  navItems: NavItem[];
  pathname: string;
  basePath: string;
  companySlug: string;
  companyName: string;
  primaryColor?: string | null;
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
          // pathname includes locale prefix (e.g., /sr/c/...), href doesn't
          // Check if pathname ends with href or starts with href after locale
          const isActive =
            pathname.endsWith(item.href) ||
            (item.href !== basePath && pathname.includes(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={onItemClick}>
              <div
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-md mb-1 transition-all duration-200",
                  "hover:bg-muted/80",
                  isActive
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={
                  isActive && primaryColor
                    ? {
                        backgroundColor: `${primaryColor}15`,
                        borderLeft: `3px solid ${primaryColor}`,
                        paddingLeft: "9px",
                      }
                    : isActive
                    ? { borderLeft: "3px solid hsl(var(--primary))", paddingLeft: "9px" }
                    : undefined
                }
              >
                <span
                  style={primaryColor ? { color: primaryColor } : undefined}
                  className={cn(!primaryColor && isActive && "text-primary")}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className={cn(isActive && !primaryColor && "text-foreground")}>
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge className="ml-auto h-5 min-w-5 px-1.5">
                    {item.badge}
                  </Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AdminSidebar({ companySlug, companyName, primaryColor, pendingAppointmentsCount, actionableInvoicesCount }: AdminSidebarProps) {
  const pathname = usePathname();
  const navItems = useNavItems(companySlug, pendingAppointmentsCount, actionableInvoicesCount);
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
          primaryColor={primaryColor}
        />
      </aside>
    </>
  );
}

export function AdminMobileNav({
  companySlug,
  companyName,
  primaryColor,
  pendingAppointmentsCount,
  actionableInvoicesCount,
}: AdminSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navItems = useNavItems(companySlug, pendingAppointmentsCount, actionableInvoicesCount);
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
          primaryColor={primaryColor}
          onItemClick={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
