"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  const t = useTranslations("footer");

  const quickLinks = [
    { href: "/features/chatbot", label: t("chatbot") },
    { href: "/features/whatsapp", label: t("whatsapp") },
    { href: "/features/mobile", label: t("mobile") },
  ];

  const useCases = [
    { href: "/use-cases/salons", label: t("salons") },
    { href: "/use-cases/clinics", label: t("clinics") },
    { href: "/use-cases/fitness", label: t("fitness") },
    { href: "/use-cases/consultants", label: t("consultants") },
  ];

  const company = [
    { href: "/about", label: t("about") },
    { href: "/testimonials", label: t("testimonials") },
    { href: "/contact", label: t("contact") },
    { href: "/#pricing", label: t("pricing") },
  ];

  const legal = [
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
  ];

  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm relative z-10">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <Logo size="lg" showText />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-4">{t("features")}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Use Cases */}
          <div>
            <h4 className="font-semibold mb-4">{t("useCases")}</h4>
            <ul className="space-y-2">
              {useCases.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">{t("company")}</h4>
            <ul className="space-y-2">
              {company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t("legal")}</h4>
            <ul className="space-y-2">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} BookBot. {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
