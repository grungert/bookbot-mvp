import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getCompanyWithServices } from "@/lib/db/tenant";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign } from "lucide-react";
import { ChatWidget } from "@/components/chat/chat-widget";

interface CompanyPageProps {
  params: Promise<{ locale: string; companySlug: string }>;
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { locale, companySlug } = await params;
  setRequestLocale(locale);

  const company = await getCompanyWithServices(companySlug);

  if (!company) {
    notFound();
  }

  return <CompanyContent company={company} companySlug={companySlug} />;
}

interface CompanyContentProps {
  company: NonNullable<Awaited<ReturnType<typeof getCompanyWithServices>>>;
  companySlug: string;
}

function CompanyContent({ company, companySlug }: CompanyContentProps) {
  const t = useTranslations("booking");
  const tServices = useTranslations("services");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {company.logoUrl && (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{company.name}</h1>
                {company.description && (
                  <p className="text-muted-foreground">{company.description}</p>
                )}
              </div>
            </div>
            <Link href={`/c/${companySlug}/book`}>
              <Button size="lg">{t("title")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">{tServices("title")}</h2>

        {company.services.length === 0 ? (
          <p className="text-muted-foreground">{tServices("noServices")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {company.services.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <div className="flex">
                  <div
                    className="w-1 shrink-0"
                    style={{ backgroundColor: service.color || "#3B82F6" }}
                  />
                  <div className="flex-1">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {service.name}
                        <Badge
                          style={{
                            backgroundColor: service.color || undefined,
                            borderColor: service.color || undefined,
                            color: service.color ? "white" : undefined,
                          }}
                        >
                          {service.currency} {Number(service.price).toLocaleString()}
                        </Badge>
                      </CardTitle>
                      {service.description && (
                        <CardDescription>{service.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{t("minutes", { count: service.duration })}</span>
                        </div>
                      </div>
                      <Link href={`/c/${companySlug}/book?service=${service.id}`}>
                        <Button className="w-full mt-4" variant="outline">
                          {t("title")}
                        </Button>
                      </Link>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Chat Widget */}
      <ChatWidget companySlug={companySlug} primaryColor={company.primaryColor} />
    </div>
  );
}
