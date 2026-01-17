"use client";

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
  MessageSquare,
  Settings,
  FileArchive,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  companySlug: string;
  companyName: string;
}

export function AdminSidebar({ companySlug, companyName }: AdminSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tAdmin = useTranslations("admin");

  const basePath = `/c/${companySlug}/admin`;

  const navItems = [
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
      label: tAdmin("aiSettings").replace("AI", "Working Hours"),
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

  return (
    <aside className="w-64 min-h-screen bg-card border-r">
      <div className="p-4 border-b">
        <Link href={`/c/${companySlug}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Back to site
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
            <Link key={item.href} href={item.href}>
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
    </aside>
  );
}
