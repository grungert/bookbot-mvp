"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { Building2, Loader2, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/ui/logo";
import { UserMenu } from "@/components/navigation/user-menu";

// Lazy load sphere background
const SphereBackground = dynamic(
  () => import("@/components/landing/sphere-background").then((mod) => mod.SphereBackground),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/10 via-blue-400/5 to-transparent" />
    ),
  }
);

interface OnboardingClientProps {
  canCreateCompany: boolean;
  locale: string;
}

// Generate slug from company name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  },
};

// Scrolling grid background
function ScrollingGrid() {
  return (
    <div className="fixed inset-0 -z-20 pointer-events-none">
      {/* White/Gray Grid - base layer */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #94a3b8 1px, transparent 1px),
            linear-gradient(to bottom, #94a3b8 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px"
        }}
      />
      {/* Blue Grid with glow - starts from top-left, fades toward bottom-right */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom right, black 0%, black 20%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom right, black 0%, black 20%, transparent 70%)",
          filter: "drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))"
        }}
      />
      {/* Blue Gradient Glow - ambient light from top-left */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 0% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%)
          `
        }}
      />
    </div>
  );
}

export function OnboardingClient({ canCreateCompany, locale }: OnboardingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("admin");
  const tLanding = useTranslations("landing");

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const slug = generateSlug(name);

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          timezone: "Europe/Belgrade",
          currency: "RSD"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Company limit reached") {
          setError(t("companyLimit"));
        } else if (data.error === "This URL slug is already taken") {
          setError("This company name is already taken. Please choose a different name.");
        } else {
          setError(data.error || "Failed to create company");
        }
        return;
      }

      // Check if there's a plan intent from pricing page
      const planIntent = searchParams.get("plan");
      if (planIntent && (planIntent === "PRO" || planIntent === "BUSINESS")) {
        // Redirect to home with upgrade modal trigger
        router.push(`/${locale}/?openUpgrade=${planIntent}`);
      } else {
        // Normal redirect to the new company's admin page
        router.push(`/${locale}/c/${data.company.slug}/admin`);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      {/* Full-page sphere background - fixed position */}
      <div className="fixed inset-0 -z-10">
        <SphereBackground />
      </div>

      {/* Scrolling grid overlay */}
      <ScrollingGrid />

      {/* Content */}
      <div className="relative z-10">
        <section className="relative min-h-screen flex flex-col">
          {/* Header */}
          <header className="relative z-10">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <Link href="/">
                <Logo size="lg" showText />
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" className="cursor-pointer">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                  </Button>
                </Link>
                <UserMenu showDashboardLink={false} />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="relative z-10 flex-1 flex items-center">
            <div className="container mx-auto px-4 py-16">
              <motion.div
                className="max-w-xl mx-auto text-center p-10 rounded-3xl bg-background/70 backdrop-blur-xl border border-white/20 shadow-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Headline */}
                <motion.div variants={itemVariants} className="mb-4">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    14-day free trial
                  </span>
                </motion.div>

                <motion.h1
                  className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
                  variants={itemVariants}
                >
                  Welcome to BookBot!
                </motion.h1>

                <motion.p
                  className="text-lg text-foreground/70 mb-8"
                  variants={itemVariants}
                >
                  Let's set up your business in seconds
                </motion.p>

                {/* Form */}
                <motion.div variants={itemVariants}>
                  {canCreateCompany ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="flex items-center justify-center gap-2 text-base font-medium">
                          <Building2 className="h-5 w-5 text-primary" />
                          What's your company name?
                        </Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your company name"
                          required
                          maxLength={100}
                          className="h-14 text-lg text-center border-2 focus:border-primary bg-background/90"
                          autoFocus
                        />
                      </div>

                      {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        variant="gradient"
                        disabled={isSubmitting || !name.trim()}
                        className="w-full h-14 text-lg cursor-pointer"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            Get Started
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>

                      <p className="text-sm text-muted-foreground">
                        {tLanding("noCardRequired")}
                      </p>
                    </form>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground">
                        Your account doesn't have permission to create companies. Please contact support for assistance.
                      </p>
                      <Link href="/">
                        <Button variant="outline" size="lg">Back to Home</Button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
