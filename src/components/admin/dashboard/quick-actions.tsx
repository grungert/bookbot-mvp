"use client";

import Link from "next/link";
import { Clock, FileWarning, MessageSquare, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  pendingAppointments: number;
  overdueInvoices: number;
  unreadConversations: number;
  companySlug: string;
  locale: string;
  translations: {
    pendingAppointments: string;
    overdueInvoices: string;
    unreadConversations: string;
  };
  prefersReducedMotion?: boolean;
}

export function QuickActions({
  pendingAppointments,
  overdueInvoices,
  unreadConversations,
  companySlug,
  locale,
  translations,
  prefersReducedMotion = false,
}: QuickActionsProps) {
  const actions = [
    {
      label: translations.pendingAppointments,
      count: pendingAppointments,
      icon: Clock,
      href: `/${locale}/c/${companySlug}/admin/appointments?status=PENDING`,
      color: "text-amber-600",
      bgColor: "bg-amber-50 hover:bg-amber-100",
      borderColor: "border-amber-200",
    },
    {
      label: translations.overdueInvoices,
      count: overdueInvoices,
      icon: FileWarning,
      href: `/${locale}/c/${companySlug}/admin/invoices?status=OVERDUE`,
      color: "text-red-600",
      bgColor: "bg-red-50 hover:bg-red-100",
      borderColor: "border-red-200",
    },
    {
      label: translations.unreadConversations,
      count: unreadConversations,
      icon: MessageSquare,
      href: `/${locale}/c/${companySlug}/admin/conversations?unread=true`,
      color: "text-blue-600",
      bgColor: "bg-blue-50 hover:bg-blue-100",
      borderColor: "border-blue-200",
    },
  ].filter((action) => action.count > 0);

  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg bg-muted/50 border",
        !prefersReducedMotion && "animate-fade-up"
      )}
      style={!prefersReducedMotion ? { opacity: 0 } : undefined}
    >
      <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex items-center gap-2 flex-wrap">
        {actions.map((action, index) => (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
              action.bgColor,
              action.borderColor,
              action.color
            )}
          >
            <action.icon className="h-3.5 w-3.5" />
            <span>{action.count}</span>
            <span className="hidden sm:inline">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
