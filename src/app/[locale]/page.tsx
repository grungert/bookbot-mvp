import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, MessageSquare, User, Building2 } from "lucide-react";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">{tCommon("appName")}</div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          {t("heroTitle")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("heroSubtitle")}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg">{t("getStarted")}</Button>
          </Link>
          <Button variant="outline" size="lg">
            {t("learnMore")}
          </Button>
        </div>
      </section>

      {/* Login Section */}
      <section className="container mx-auto px-4 py-16 border-b">
        <h2 className="text-3xl font-bold text-center mb-4">{t("loginSection")}</h2>
        <p className="text-muted-foreground text-center mb-12">{t("loginSectionDesc")}</p>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>{t("userLogin")}</CardTitle>
              <CardDescription>{t("userLoginDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login" className="block">
                <Button className="w-full" size="lg">{t("userLoginButton")}</Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>{t("companyLogin")}</CardTitle>
              <CardDescription>{t("companyLoginDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login" className="block">
                <Button className="w-full" size="lg" variant="outline">{t("companyLoginButton")}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t("features")}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t("booking")}</CardTitle>
              <CardDescription>{t("bookingDesc")}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t("invoicing")}</CardTitle>
              <CardDescription>{t("invoicingDesc")}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-2" />
              <CardTitle>{t("ai")}</CardTitle>
              <CardDescription>{t("aiDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BookBot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
