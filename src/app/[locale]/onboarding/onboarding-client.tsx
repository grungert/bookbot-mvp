"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2, Rocket, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { Logo } from "@/components/ui/logo";

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

export function OnboardingClient({ canCreateCompany, locale }: OnboardingClientProps) {
  const router = useRouter();
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

      // Redirect to the new company's admin page
      router.push(`/${locale}/c/${data.company.slug}/admin`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="lg" showText />
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 py-20">
        <div className="w-full max-w-md">
          {/* Welcome Card */}
          <div className="rounded-2xl border bg-card p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to BookBot!</h1>
              <p className="text-muted-foreground">
                Create your company to get started with appointments and services.
              </p>
            </div>

            {canCreateCompany ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your company name"
                    required
                    maxLength={100}
                    className="h-12 text-base"
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
                  disabled={isSubmitting || !name.trim()}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-5 w-5" />
                  )}
                  Continue
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {tLanding("noCardRequired")}
                </p>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your account doesn't have permission to create companies. Please contact support for assistance.
                </p>
                <Link href="/">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
