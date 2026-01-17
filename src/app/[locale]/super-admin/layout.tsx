import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Building2, Users, Settings } from "lucide-react";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function SuperAdminLayout({
  children,
  params,
}: SuperAdminLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect(`/${locale}`);
  }

  const navItems = [
    { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super-admin/companies", label: "Companies", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-card border-r">
          <div className="p-4 border-b">
            <h2 className="font-semibold">BookBot Admin</h2>
            <p className="text-xs text-muted-foreground">Super Admin Panel</p>
          </div>
          <nav className="p-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" className="w-full justify-start gap-2 mb-1">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
