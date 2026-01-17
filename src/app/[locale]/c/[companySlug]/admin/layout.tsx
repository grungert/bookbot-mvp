import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; companySlug: string }>;
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale, companySlug } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only super admin and company admin can access
  if (user.role !== "SUPER_ADMIN" && user.role !== "COMPANY_ADMIN") {
    redirect(`/c/${companySlug}`);
  }

  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    redirect("/");
  }

  // Company admin must belong to this company
  if (user.role === "COMPANY_ADMIN" && user.companyId !== company.id) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex">
        <AdminSidebar companySlug={companySlug} companyName={company.name} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
