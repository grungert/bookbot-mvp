import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyBySlug } from "@/lib/db/tenant";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, Plus } from "lucide-react";

interface UserDashboardProps {
  params: Promise<{ locale: string; companySlug: string }>;
}

export default async function UserDashboard({ params }: UserDashboardProps) {
  const { locale, companySlug } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/c/${companySlug}/user`);
  }

  const company = await getCompanyBySlug(companySlug);

  if (!company) {
    redirect(`/${locale}`);
  }

  const [appointments, invoices] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        companyId: company.id,
        userId: user.id,
      },
      include: {
        service: true,
      },
      orderBy: { startTime: "desc" },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: {
        companyId: company.id,
        userId: user.id,
      },
      include: {
        lineItems: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return <UserDashboardContent
    companySlug={companySlug}
    companyName={company.name}
    appointments={appointments}
    invoices={invoices}
  />;
}

interface UserDashboardContentProps {
  companySlug: string;
  companyName: string;
  appointments: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
    service: { name: string; duration: number };
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    total: { toNumber: () => number } | number;
    currency: string;
    issueDate: Date;
  }>;
}

function UserDashboardContent({
  companySlug,
  companyName,
  appointments,
  invoices
}: UserDashboardContentProps) {
  const t = useTranslations("appointments");
  const tInvoices = useTranslations("invoices");
  const tCommon = useTranslations("common");

  function getStatusBadge(status: string) {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "secondary",
      CONFIRMED: "default",
      COMPLETED: "outline",
      CANCELLED: "destructive",
      DRAFT: "secondary",
      SENT: "default",
      PAID: "outline",
    };

    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/c/${companySlug}`} className="text-muted-foreground text-sm hover:text-foreground">
                {companyName}
              </Link>
              <h1 className="text-2xl font-bold">My Dashboard</h1>
            </div>
            <Link href={`/c/${companySlug}/book`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="appointments">
          <TabsList className="mb-6">
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("title")}
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {tInvoices("title")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">{t("noAppointments")}</p>
                  <Link href={`/c/${companySlug}/book`}>
                    <Button>Book your first appointment</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{apt.service.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.startTime), "EEEE, MMMM d, yyyy")} at{" "}
                            {format(new Date(apt.startTime), "HH:mm")}
                          </p>
                        </div>
                        {getStatusBadge(apt.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices">
            {invoices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{tInvoices("noInvoices")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            Issued: {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium">
                            {invoice.currency} {(typeof invoice.total === 'number' ? invoice.total : invoice.total.toNumber()).toLocaleString()}
                          </span>
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
