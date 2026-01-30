"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const COOKIE_CONSENT_KEY = "bookbot-cookie-consent";

export function GoogleAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check if user has accepted cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    setHasConsent(consent === "accepted");

    // Listen for consent changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === COOKIE_CONSENT_KEY) {
        setHasConsent(e.newValue === "accepted");
      }
    };

    // Listen for consent changes in same tab
    const handleConsentChange = (e: CustomEvent<string>) => {
      setHasConsent(e.detail === "accepted");
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cookieConsentChange", handleConsentChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cookieConsentChange", handleConsentChange as EventListener);
    };
  }, []);

  // Don't render if no measurement ID or no consent
  if (!GA_MEASUREMENT_ID || !hasConsent) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

// Helper to track page views (for use with Next.js router)
export function trackPageView(url: string) {
  if (typeof window !== "undefined" && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

// Helper to track events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer: unknown[];
  }
}
