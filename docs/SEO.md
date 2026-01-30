# SEO Implementation

This document describes the SEO implementation in BookBot, including metadata, structured data, and social sharing optimization.

## Overview

BookBot implements comprehensive SEO features:

- **OpenGraph metadata** for Facebook/LinkedIn sharing
- **Twitter Cards** for Twitter sharing
- **Canonical URLs** to prevent duplicate content issues
- **Hreflang tags** for multilingual support (en/sr)
- **Structured Data (JSON-LD)** for rich search results
- **Responsive viewport** configuration

## Configuration

### Site Configuration

All SEO settings are centralized in `src/lib/seo.ts`:

```typescript
export const siteConfig = {
  name: "BookBot",
  description: "All-in-one platform for appointment scheduling...",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://bookbot.app",
  ogImage: "/og-image.svg",
  twitterHandle: "@bookbot",
  locales: ["en", "sr"],
  defaultLocale: "en",
};
```

### Environment Variable

Set `NEXT_PUBLIC_APP_URL` in your environment to the production URL:

```env
NEXT_PUBLIC_APP_URL=https://bookbot.app
```

## Usage

### Page Metadata

Use the `generatePageMetadata` helper in page components:

```typescript
import { generatePageMetadata } from "@/lib/seo";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "features.whatsapp" });

  return generatePageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/features/whatsapp",
    locale: locale as Locale,
  });
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Page title |
| `description` | string | Yes | Meta description (150-160 chars ideal) |
| `path` | string | Yes | URL path without locale prefix (e.g., `/features/whatsapp`) |
| `locale` | Locale | Yes | Current locale (`en` or `sr`) |
| `image` | string | No | Custom OG image URL (defaults to site OG image) |
| `noIndex` | boolean | No | Set to `true` for pages that shouldn't be indexed |

### What Gets Generated

The helper generates:

- Title and description meta tags
- Canonical URL: `https://bookbot.app/en/features/whatsapp`
- Hreflang alternates for all locales + x-default
- OpenGraph tags (title, description, url, site_name, locale, type, images)
- Twitter Card tags (card type, title, description, images, site handle)

## Structured Data

JSON-LD schemas are implemented in `src/components/structured-data.tsx`:

### Organization Schema

Identifies the business entity:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BookBot",
  "description": "...",
  "url": "https://bookbot.app",
  "logo": "https://bookbot.app/og-image.svg"
}
```

### WebSite Schema

Enables sitelinks search box in Google:

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BookBot",
  "url": "https://bookbot.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://bookbot.app/search?q={search_term_string}"
  }
}
```

### SoftwareApplication Schema

Describes the booking software product (used on home page).

## OpenGraph Image

The default OG image is located at `public/og-image.svg`:

- Dimensions: 1200x630px (recommended for social sharing)
- Format: SVG (scalable, small file size)
- Update the image when branding changes

For page-specific images, pass the `image` parameter to `generatePageMetadata`.

## Verification

### OpenGraph

Test with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/):
1. Enter your URL
2. Click "Debug" or "Scrape Again"
3. Verify title, description, and image appear correctly

### Twitter Cards

Test with [Twitter Card Validator](https://cards-dev.twitter.com/validator):
1. Enter your URL
2. Click "Preview card"
3. Verify the large image summary card appears

### Structured Data

Test with [Google Rich Results Test](https://search.google.com/test/rich-results):
1. Enter your URL
2. Review detected schemas
3. Fix any errors or warnings

### Lighthouse SEO Audit

Run in Chrome DevTools:
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "SEO" category
4. Click "Analyze page load"
5. Aim for 100% SEO score

## Future Improvements

### Sitemap

Generate a sitemap for all public pages. Can be implemented with:

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/features/whatsapp",
    "/features/chatbot",
    "/features/mobile",
    "/use-cases",
    "/use-cases/salons",
    "/use-cases/clinics",
    "/use-cases/fitness",
    "/use-cases/consultants",
    "/testimonials",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];

  return routes.flatMap((route) =>
    siteConfig.locales.map((locale) => ({
      url: `${siteConfig.url}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    }))
  );
}
```

### Robots.txt

Create `public/robots.txt` or `src/app/robots.ts`:

```typescript
// src/app/robots.ts
import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/c/", "/admin/", "/super-admin/", "/api/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
```

### Super Admin SEO Settings

Currently, SEO settings are managed in code (`src/lib/seo.ts`). For most use cases, this is sufficient since these values rarely change. However, if marketing needs to frequently update SEO settings without deployments, consider adding a Super Admin interface:

**Proposed UI:** Super Admin → Settings → SEO

| Setting | Description |
|---------|-------------|
| Site name | Brand name shown in titles and structured data |
| Default description | Fallback meta description |
| Twitter handle | @username for Twitter cards |
| Default OG image | Upload custom social sharing image |
| Google site verification | Verification meta tag code |

**Implementation notes:**
- Store settings in database (new `SeoSettings` model)
- Load settings server-side in `src/lib/seo.ts`
- Cache aggressively (settings change infrequently)
- Provide "Reset to defaults" option

**When to implement:**
- Multiple non-technical users need to update SEO
- Frequent A/B testing of titles/descriptions
- Managing SEO across multiple brands/domains

For MVP, the current code-based approach is recommended.

## Translations

SEO metadata is translated using next-intl. Each page namespace should include:

```json
{
  "metaTitle": "Page Title - BookBot",
  "metaDescription": "A compelling description under 160 characters."
}
```

When adding new pages, ensure both `en.json` and `sr.json` have the meta translations.
