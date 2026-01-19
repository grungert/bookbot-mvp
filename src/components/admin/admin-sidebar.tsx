"use client";

import { useState, useEffect, createContext, useContext } from "react";
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
  PanelLeftClose,
  PanelLeft,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Sidebar context for sharing collapsed state
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("admin-sidebar-collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const handleSetIsCollapsed = (value: boolean) => {
    setIsCollapsed(value);
    localStorage.setItem("admin-sidebar-collapsed", String(value));
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <SidebarContext.Provider value={{ isCollapsed: false, setIsCollapsed: handleSetIsCollapsed }}>
        {children}
      </SidebarContext.Provider>
    );
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed: handleSetIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

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
      href: `${basePath}/appointments`,
      label: t("bookings"),
      icon: Calendar,
      badge: pendingAppointmentsCount,
    },
    {
      href: `${basePath}/invoices`,
      label: t("invoices"),
      icon: FileText,
      badge: actionableInvoicesCount,
    },
    {
      href: `${basePath}/conversations`,
      label: tAdmin("conversations"),
      icon: MessageSquare,
    },
    {
      href: `${basePath}/services`,
      label: t("services"),
      icon: Briefcase,
    },
    {
      href: `${basePath}/working-hours`,
      label: "Working Hours",
      icon: Clock,
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
  primaryColor,
  onItemClick,
  isCollapsed = false,
}: {
  navItems: NavItem[];
  pathname: string;
  basePath: string;
  companySlug: string;
  companyName: string;
  primaryColor?: string | null;
  onItemClick?: () => void;
  isCollapsed?: boolean;
}) {
  const tNav = useTranslations("nav");

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("p-4 border-b", isCollapsed && "p-2")}>
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/c/${companySlug}`}
                className="flex items-center justify-center text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted"
                onClick={onItemClick}
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{tNav("backToSite")}</TooltipContent>
          </Tooltip>
        ) : (
          <>
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
          </>
        )}
      </div>
      <nav className={cn("p-2 flex-1", isCollapsed && "p-1")}>
        {navItems.map((item) => {
          const isActive =
            pathname.endsWith(item.href) ||
            (item.href !== basePath && pathname.includes(item.href));

          const navLink = (
            <Link key={item.href} href={item.href} onClick={onItemClick}>
              <div
                className={cn(
                  "relative flex items-center gap-2 px-3 py-2 rounded-md mb-1 transition-all duration-200",
                  "hover:bg-muted/80",
                  isActive
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:text-foreground",
                  isCollapsed && "justify-center px-2"
                )}
                style={
                  isActive && primaryColor
                    ? {
                        backgroundColor: `${primaryColor}15`,
                        borderLeft: isCollapsed ? "none" : `3px solid ${primaryColor}`,
                        paddingLeft: isCollapsed ? undefined : "9px",
                        borderBottom: isCollapsed ? `2px solid ${primaryColor}` : undefined,
                      }
                    : isActive
                    ? {
                        borderLeft: isCollapsed ? "none" : "3px solid hsl(var(--primary))",
                        paddingLeft: isCollapsed ? undefined : "9px",
                        borderBottom: isCollapsed ? "2px solid hsl(var(--primary))" : undefined,
                      }
                    : undefined
                }
              >
                <span
                  style={primaryColor ? { color: primaryColor } : undefined}
                  className={cn(!primaryColor && isActive && "text-primary")}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                </span>
                {!isCollapsed && (
                  <span className={cn(isActive && !primaryColor && "text-foreground")}>
                    {item.label}
                  </span>
                )}
                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <Badge className="ml-auto h-5 min-w-5 px-1.5">
                    {item.badge}
                  </Badge>
                )}
                {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground px-1">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
            </Link>
          );

          if (isCollapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge className="h-5 min-w-5 px-1.5">{item.badge}</Badge>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          return navLink;
        })}
      </nav>
    </TooltipProvider>
  );
}

export function AdminSidebar({ companySlug, companyName, primaryColor, pendingAppointmentsCount, actionableInvoicesCount }: AdminSidebarProps) {
  const pathname = usePathname();
  const navItems = useNavItems(companySlug, pendingAppointmentsCount, actionableInvoicesCount);
  const basePath = `/c/${companySlug}/admin`;
  const { isCollapsed, setIsCollapsed } = useSidebar();

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop sidebar - fixed position */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:top-14 lg:bottom-0 lg:left-0 bg-card border-r z-40 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <NavContent
          navItems={navItems}
          pathname={pathname}
          basePath={basePath}
          companySlug={companySlug}
          companyName={companyName}
          primaryColor={primaryColor}
          isCollapsed={isCollapsed}
        />
        {/* Collapse toggle button */}
        <div className={cn("p-2 border-t mt-auto", isCollapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8"
              >
                {isCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
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
          isCollapsed={false}
        />
      </SheetContent>
    </Sheet>
  );
}

// Client component for main content wrapper
export function AdminMainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <main
      className={cn(
        "flex-1 p-4 lg:p-6 transition-all duration-300",
        isCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}
    >
      {children}
    </main>
  );
}
