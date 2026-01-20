"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (company: { slug: string; name: string }) => void;
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

const TIMEZONES = [
  { value: "Europe/Belgrade", label: "Belgrade (CET)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

const CURRENCIES = [
  { value: "RSD", label: "RSD - Serbian Dinar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "GBP", label: "GBP - British Pound" },
];

export function CreateCompanyModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCompanyModalProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("Europe/Belgrade");
  const [currency, setCurrency] = useState("RSD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);

  // Listen for real-time color changes from settings page
  useEffect(() => {
    const handleColorChange = (event: CustomEvent<{ color: string }>) => {
      setPrimaryColor(event.detail.color);
    };

    window.addEventListener("company-color-change", handleColorChange as EventListener);

    // Get initial color from CSS variable
    const wrapper = document.querySelector('[data-theme-wrapper]') as HTMLElement;
    if (wrapper) {
      const currentColor = wrapper.style.getPropertyValue("--company-primary");
      if (currentColor) {
        setPrimaryColor(currentColor);
      }
    }

    return () => {
      window.removeEventListener("company-color-change", handleColorChange as EventListener);
    };
  }, []);

  // Auto-generate slug from name unless manually edited
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setName("");
      setSlug("");
      setTimezone("Europe/Belgrade");
      setCurrency("RSD");
      setError(null);
      setSlugManuallyEdited(false);
    }
  }, [open]);

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, timezone, currency }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "Company limit reached") {
          setError(t("companyLimit"));
        } else if (data.error === "This URL slug is already taken") {
          setError(t("slugTaken") || "This URL is already taken");
        } else {
          setError(data.error || "Failed to create company");
        }
        return;
      }

      onSuccess({ slug: data.company.slug, name: data.company.name });
      onOpenChange(false);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createCompany")}</DialogTitle>
          <DialogDescription>
            {t("createCompanyDescription") ||
              "Set up a new company to manage bookings and services."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("companyName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Business"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">{t("companySlug")}</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/c/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-business"
                required
                maxLength={50}
                pattern="^[a-z0-9-]+$"
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("slugHint") ||
                "This will be your company's URL. Only lowercase letters, numbers, and hyphens."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">{t("timezone")}</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t("currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name || !slug}
              style={primaryColor ? { backgroundColor: primaryColor } : undefined}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
