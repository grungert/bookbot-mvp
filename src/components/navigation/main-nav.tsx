"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/navigation/user-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Shield,
  ChevronDown,
  Menu,
  MessageSquare,
  MessageCircle,
  Smartphone,
  Scissors,
  Stethoscope,
  Dumbbell,
  Briefcase,
} from "lucide-react";

interface MainNavProps {
  variant?: "default" | "transparent";
}

export function MainNav({ variant = "default" }: MainNavProps) {
  const { data: session, status } = useSession();
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [useCasesOpen, setUseCasesOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && status === "authenticated" && session?.user;

  const featuresItems = [
    {
      href: "/features/chatbot",
      label: tNav("featuresChatbot"),
      icon: MessageSquare,
      description: tNav("featuresChatbotDesc"),
    },
    {
      href: "/features/whatsapp",
      label: tNav("featuresWhatsapp"),
      icon: MessageCircle,
      description: tNav("featuresWhatsappDesc"),
    },
    {
      href: "/features/mobile",
      label: tNav("featuresMobile"),
      icon: Smartphone,
      description: tNav("featuresMobileDesc"),
    },
  ];

  const useCasesItems = [
    {
      href: "/use-cases/salons",
      label: tNav("useCasesSalons"),
      icon: Scissors,
      description: tNav("useCasesSalonsDesc"),
    },
    {
      href: "/use-cases/clinics",
      label: tNav("useCasesClinics"),
      icon: Stethoscope,
      description: tNav("useCasesClinicsDesc"),
    },
    {
      href: "/use-cases/fitness",
      label: tNav("useCasesFitness"),
      icon: Dumbbell,
      description: tNav("useCasesFitnessDesc"),
    },
    {
      href: "/use-cases/consultants",
      label: tNav("useCasesConsultants"),
      icon: Briefcase,
      description: tNav("useCasesConsultantsDesc"),
    },
  ];

  return (
    <header className="relative z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Logo size="lg" showText />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Features Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1">
                {tNav("features")}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {featuresItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-start gap-3 p-3">
                    <item.icon className="h-5 w-5 mt-0.5 text-blue-500" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Use Cases Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1">
                {tNav("useCases")}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {useCasesItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-start gap-3 p-3">
                    <item.icon className="h-5 w-5 mt-0.5 text-purple-500" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Regular Nav Items */}
          <Link href="/testimonials">
            <Button variant="ghost">{tNav("testimonials")}</Button>
          </Link>
          <a href="/#pricing">
            <Button variant="ghost">{tNav("pricing")}</Button>
          </a>
          <Link href="/about">
            <Button variant="ghost">{tNav("about")}</Button>
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {session.user.role === "SUPER_ADMIN" && (
                <Link href="/super-admin">
                  <Button variant="ghost" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    {t("adminPanel")}
                  </Button>
                </Link>
              )}
              {session.user.role !== "SUPER_ADMIN" && (
                <Link
                  href={
                    session.user.memberships?.[0]?.companySlug
                      ? `/c/${session.user.memberships[0].companySlug}/admin`
                      : "/onboarding"
                  }
                >
                  <Button variant="ghost" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {tNav("dashboard")}
                  </Button>
                </Link>
              )}
              <UserMenu showDashboardLink={false} />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="cursor-pointer">
                  {t("login")}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="gradient" className="cursor-pointer">
                  {t("getStarted")}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle>
                <Logo size="md" showText />
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-8">
              {/* Features Accordion */}
              <div className="border-b pb-2">
                <button
                  onClick={() => setFeaturesOpen(!featuresOpen)}
                  className="flex items-center justify-between w-full py-2 text-left font-medium"
                >
                  {tNav("features")}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      featuresOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {featuresOpen && (
                  <div className="pl-4 space-y-2 pb-2">
                    {featuresItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Use Cases Accordion */}
              <div className="border-b pb-2">
                <button
                  onClick={() => setUseCasesOpen(!useCasesOpen)}
                  className="flex items-center justify-between w-full py-2 text-left font-medium"
                >
                  {tNav("useCases")}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      useCasesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {useCasesOpen && (
                  <div className="pl-4 space-y-2 pb-2">
                    {useCasesItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Regular Links */}
              <Link
                href="/testimonials"
                onClick={() => setMobileOpen(false)}
                className="py-2 border-b font-medium"
              >
                {tNav("testimonials")}
              </Link>
              <a
                href="/#pricing"
                onClick={() => setMobileOpen(false)}
                className="py-2 border-b font-medium"
              >
                {tNav("pricing")}
              </a>
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="py-2 border-b font-medium"
              >
                {tNav("about")}
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="py-2 border-b font-medium"
              >
                {tNav("contact")}
              </Link>

              {/* Auth Buttons */}
              <div className="mt-6 space-y-3">
                {isLoggedIn ? (
                  <>
                    {session.user.role === "SUPER_ADMIN" && (
                      <Link
                        href="/super-admin"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button variant="outline" className="w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          {t("adminPanel")}
                        </Button>
                      </Link>
                    )}
                    {session.user.role !== "SUPER_ADMIN" && (
                      <Link
                        href={
                          session.user.memberships?.[0]?.companySlug
                            ? `/c/${session.user.memberships[0].companySlug}/admin`
                            : "/onboarding"
                        }
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button variant="outline" className="w-full">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {tNav("dashboard")}
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">
                        {t("login")}
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <Button variant="gradient" className="w-full">
                        {t("getStarted")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
