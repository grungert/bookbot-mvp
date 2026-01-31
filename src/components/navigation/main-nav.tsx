"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { TransitionLink } from "@/i18n/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
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
  LogOut,
  User,
} from "lucide-react";

// Lazy load UserMenu to reduce initial bundle
const UserMenu = dynamic(
  () => import("@/components/navigation/user-menu").then((mod) => mod.UserMenu),
  { ssr: false }
);

interface MainNavProps {
  variant?: "default" | "transparent";
  hideAuthButtons?: boolean;
}

// Memoized nav items to prevent recreation
const FEATURES_ITEMS = [
  { href: "/features/chatbot", labelKey: "featuresChatbot", descKey: "featuresChatbotDesc", Icon: MessageSquare },
  { href: "/features/whatsapp", labelKey: "featuresWhatsapp", descKey: "featuresWhatsappDesc", Icon: MessageCircle },
  { href: "/features/viber", labelKey: "featuresViber", descKey: "featuresViberDesc", Icon: Smartphone },
  { href: "/features/mobile", labelKey: "featuresMobile", descKey: "featuresMobileDesc", Icon: Smartphone },
] as const;

const USE_CASES_ITEMS = [
  { href: "/use-cases/salons", labelKey: "useCasesSalons", descKey: "useCasesSalonsDesc", Icon: Scissors },
  { href: "/use-cases/clinics", labelKey: "useCasesClinics", descKey: "useCasesClinicsDesc", Icon: Stethoscope },
  { href: "/use-cases/fitness", labelKey: "useCasesFitness", descKey: "useCasesFitnessDesc", Icon: Dumbbell },
  { href: "/use-cases/consultants", labelKey: "useCasesConsultants", descKey: "useCasesConsultantsDesc", Icon: Briefcase },
] as const;

function MainNavInner({ variant = "default", hideAuthButtons = false }: MainNavProps) {
  const { data: session, status } = useSession();
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [useCasesOpen, setUseCasesOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && status === "authenticated" && session?.user;

  // Memoize translated items
  const featuresItems = useMemo(() =>
    FEATURES_ITEMS.map(item => ({
      href: item.href,
      label: tNav(item.labelKey),
      description: tNav(item.descKey),
      Icon: item.Icon,
    })), [tNav]
  );

  const useCasesItems = useMemo(() =>
    USE_CASES_ITEMS.map(item => ({
      href: item.href,
      label: tNav(item.labelKey),
      description: tNav(item.descKey),
      Icon: item.Icon,
    })), [tNav]
  );

  // Memoize dashboard href
  const dashboardHref = useMemo(() => {
    if (!session?.user) return "/onboarding";
    return session.user.memberships?.[0]?.companySlug
      ? `/c/${session.user.memberships[0].companySlug}/admin`
      : "/onboarding";
  }, [session?.user]);

  return (
    <header className="relative z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <TransitionLink href="/">
          <Logo size="lg" showText />
        </TransitionLink>

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
                  <TransitionLink href={item.href} className="flex items-start gap-3 p-3">
                    <item.Icon className="h-5 w-5 mt-0.5 text-blue-500" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </TransitionLink>
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
                  <TransitionLink href={item.href} className="flex items-start gap-3 p-3">
                    <item.Icon className="h-5 w-5 mt-0.5 text-purple-500" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </TransitionLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Regular Nav Items */}
          <TransitionLink href="/testimonials">
            <Button variant="ghost">{tNav("testimonials")}</Button>
          </TransitionLink>
          <a href={`/${locale}/#pricing`}>
            <Button variant="ghost">{tNav("pricing")}</Button>
          </a>
          <TransitionLink href="/about">
            <Button variant="ghost">{tNav("about")}</Button>
          </TransitionLink>
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
                <Link href={dashboardHref}>
                  <Button variant="ghost" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {tNav("dashboard")}
                  </Button>
                </Link>
              )}
              <UserMenu showDashboardLink={false} />
            </>
          ) : !hideAuthButtons ? (
            <Link href="/login">
              <Button variant="gradient" className="cursor-pointer">
                {t("login")}
              </Button>
            </Link>
          ) : null}
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
            <nav className="flex flex-col gap-2 mt-8 px-4">
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
                      <TransitionLink
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <item.Icon className="h-4 w-4" />
                        {item.label}
                      </TransitionLink>
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
                      <TransitionLink
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 py-2 text-muted-foreground hover:text-foreground"
                      >
                        <item.Icon className="h-4 w-4" />
                        {item.label}
                      </TransitionLink>
                    ))}
                  </div>
                )}
              </div>

              {/* Regular Links */}
              <TransitionLink
                href="/testimonials"
                onClick={() => setMobileOpen(false)}
                className="py-2 border-b font-medium"
              >
                {tNav("testimonials")}
              </TransitionLink>
              <a
                href={`/${locale}/#pricing`}
                onClick={() => setMobileOpen(false)}
                className="py-2 border-b font-medium"
              >
                {tNav("pricing")}
              </a>
              <TransitionLink
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="py-2 border-b font-medium"
              >
                {tNav("about")}
              </TransitionLink>
              <TransitionLink
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="py-2 border-b font-medium"
              >
                {tNav("contact")}
              </TransitionLink>

              {/* Auth Buttons */}
              <div className="mt-6 space-y-3">
                {isLoggedIn ? (
                  <>
                    {/* User Info */}
                    <div className="flex items-center gap-3 py-2 px-3 bg-muted/50 rounded-lg">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.user.name || session.user.email}
                        </p>
                        {session.user.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>

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
                        href={dashboardHref}
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button variant="outline" className="w-full">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {tNav("dashboard")}
                        </Button>
                      </Link>
                    )}

                    {/* Logout Button */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setMobileOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {tAuth("logout")}
                    </Button>
                  </>
                ) : !hideAuthButtons ? (
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="gradient" className="w-full">
                      {t("login")}
                    </Button>
                  </Link>
                ) : null}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

// Memoize the entire component to prevent unnecessary re-renders
export const MainNav = memo(MainNavInner);
