import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getCompanyWithServices } from "@/lib/db/tenant";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { ChatWidget } from "@/components/chat/chat-widget";
import { AboutSection } from "@/components/customer/about-section";
import { cn } from "@/lib/utils";

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
  const tAbout = useTranslations("about");

  return (
    <div className="min-h-screen bg-background">
      {/* About Us Section */}
      <section className="container mx-auto px-4 pt-12 pb-6 text-center animate-fade-up stagger-1" style={{ opacity: 0 }}>
        {company.description && (
          <>
            <h2 className="text-2xl font-bold mb-4">{tAbout("title")}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap max-w-3xl mx-auto mb-8">{company.description}</p>
          </>
        )}
        <Link href={`/c/${companySlug}/book`}>
          <Button size="lg" className="cursor-pointer press-feedback shadow-md hover:shadow-lg transition-shadow">
            {t("title")}
          </Button>
        </Link>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 text-center animate-fade-up stagger-1" style={{ opacity: 0 }}>
          {tServices("title")}
        </h2>

        {company.services.length === 0 ? (
          <p className="text-muted-foreground">{tServices("noServices")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {company.services.map((service, index) => (
              <Card
                key={service.id}
                className={cn(
                  "overflow-hidden group",
                  "rounded-xl border",
                  "shadow-sm hover:shadow-lg",
                  "transition-all duration-300",
                  "hover:-translate-y-0.5 hover:border-primary/20",
                  `animate-fade-in-scale stagger-${Math.min(index + 2, 5)}`
                )}
                style={{
                  opacity: 0,
                  backgroundImage: `linear-gradient(to bottom right, ${service.color || "#3B82F6"}08, transparent)`
                }}
              >
                <div className="flex p-4 gap-4">
                  <div
                    className="w-1.5 shrink-0 rounded-full self-stretch transition-all duration-300 group-hover:shadow-[0_0_8px_0px]"
                    style={{
                      backgroundColor: service.color || "#3B82F6",
                      "--tw-shadow-color": service.color || "#3B82F6",
                    } as React.CSSProperties}
                  />
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate">{service.name}</span>
                        <Badge
                          className="shrink-0 shadow-sm"
                          style={{
                            backgroundColor: service.color || undefined,
                            borderColor: service.color || undefined,
                            color: service.color ? "white" : undefined,
                          }}
                        >
                          {service.currency} {Number(service.price).toLocaleString()}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{service.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1.5 rounded-md"
                          style={{ backgroundColor: `${service.color || "#3B82F6"}15` }}
                        >
                          <Clock
                            className="h-3.5 w-3.5"
                            style={{ color: service.color || "#3B82F6" }}
                          />
                        </div>
                        <span>{t("minutes", { count: service.duration })}</span>
                      </div>
                    </div>
                    <Link href={`/c/${companySlug}/book?service=${service.id}`}>
                      <Button
                        className="w-full cursor-pointer press-feedback transition-colors duration-300"
                        variant="outline"
                        style={{
                          "--hover-bg": `${service.color || "#3B82F6"}10`,
                          "--hover-border": service.color || "#3B82F6",
                        } as React.CSSProperties}
                      >
                        {t("title")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Contact Section */}
      <AboutSection
        businessPhone={company.businessPhone}
        businessEmail={company.businessEmail}
        businessAddress={company.businessAddress}
        workingHours={company.workingHours}
      />

      {/* Chat Widget */}
      <ChatWidget companySlug={companySlug} primaryColor={company.primaryColor} />
    </div>
  );
}
