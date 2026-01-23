"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { signOut } from "next-auth/react";
import {
  CreditCard,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  Building2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccountLayoutClientProps {
  children: React.ReactNode;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

const navItems = [
  {
    href: "/account/subscription",
    labelKey: "subscription",
    icon: CreditCard,
  },
  {
    href: "/account/profile",
    labelKey: "profile",
    icon: User,
  },
];

export function AccountLayoutClient({
  children,
  user,
}: AccountLayoutClientProps) {
  const pathname = usePathname();
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" />
              <span className="font-bold text-xl text-foreground">BookBot</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/user">
              <Button variant="outline" size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                {t("myCompanies")}
              </Button>
            </Link>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || undefined} alt={user.name || ""} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="md:w-64 shrink-0">
            {/* User Info Card */}
            <div className="rounded-xl border bg-card p-4 mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname.includes(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                {tAuth("logout")}
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
