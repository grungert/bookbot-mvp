import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCompanyWithServices } from "@/lib/db/tenant";
import { getCurrentUser } from "@/lib/auth";
import { BookingFlow } from "@/components/booking/booking-flow";

interface BookingPageProps {
  params: Promise<{ locale: string; companySlug: string }>;
  searchParams: Promise<{ service?: string }>;
}

export default async function BookingPage({
  params,
  searchParams,
}: BookingPageProps) {
  const { locale, companySlug } = await params;
  const { service: serviceId } = await searchParams;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  // Require login for booking
  if (!user) {
    redirect(`/login?callbackUrl=/c/${companySlug}/book${serviceId ? `?service=${serviceId}` : ""}`);
  }

  const company = await getCompanyWithServices(companySlug);

  if (!company) {
    notFound();
  }

  if (company.services.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold">{company.name}</h1>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">
            No services available for booking at this time.
          </p>
        </div>
      </div>
    );
  }

  const services = company.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration: s.duration,
    price: Number(s.price),
    currency: s.currency,
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">Book an appointment</p>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <BookingFlow
          companySlug={companySlug}
          services={services}
          initialServiceId={serviceId}
        />
      </div>
    </div>
  );
}
