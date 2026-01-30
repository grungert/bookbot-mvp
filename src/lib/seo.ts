import type { Metadata } from "next";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

/**
 * Site-wide SEO configuration
 */
export const siteConfig = {
  name: "BookBot",
  description:
    "All-in-one platform for appointment scheduling, invoicing, and AI-powered customer support",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://bookbot.app",
  ogImage: "/og-image.svg",
  twitterHandle: "@bookbot",
  locales,
  defaultLocale,
} as const;

/**
 * Parameters for generating page-level metadata
 */
export interface PageMetadataParams {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  image?: string;
  noIndex?: boolean;
}

/**
 * Get the OpenGraph locale format for a given locale
 */
export function getOgLocale(locale: Locale): string {
  const localeMap: Record<Locale, string> = {
    en: "en_US",
    sr: "sr_RS",
  };
  return localeMap[locale] || "en_US";
}

/**
 * Generate alternate language links for hreflang tags
 */
export function generateAlternates(path: string) {
  const languages: Record<string, string> = {};

  for (const locale of siteConfig.locales) {
    languages[locale] = `${siteConfig.url}/${locale}${path}`;
  }

  // Add x-default pointing to default locale
  languages["x-default"] = `${siteConfig.url}/${siteConfig.defaultLocale}${path}`;

  return languages;
}

/**
 * Generate complete metadata for a page with OpenGraph, Twitter cards,
 * canonical URLs, and hreflang alternates
 */
export function generatePageMetadata({
  title,
  description,
  path,
  locale,
  image,
  noIndex = false,
}: PageMetadataParams): Metadata {
  const url = `${siteConfig.url}/${locale}${path}`;
  const ogImage = image || `${siteConfig.url}${siteConfig.ogImage}`;

  return {
    title,
    description,
    ...(noIndex && { robots: { index: false, follow: false } }),
    alternates: {
      canonical: url,
      languages: generateAlternates(path),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: getOgLocale(locale),
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      site: siteConfig.twitterHandle,
    },
  };
}
