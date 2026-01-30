# Analytics

BookBot integrates with Google Analytics 4 (GA4) for tracking website traffic and user behavior. Analytics respects user privacy by only loading after cookie consent is given.

## Configuration

### Environment Variables

```env
# Google Analytics Measurement ID (starts with G-)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

## Getting Your Google Analytics Measurement ID

### Step 1: Create a Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com)
2. Sign in with your Google account
3. Click **Start measuring**

### Step 2: Set Up a Property

1. Enter an **Account name** (e.g., "BookBot")
2. Click **Next**
3. Enter a **Property name** (e.g., "BookBot Production")
4. Select your **Reporting time zone** and **Currency**
5. Click **Next**

### Step 3: Business Information

1. Select your **Industry category**
2. Select your **Business size**
3. Select how you intend to use Google Analytics
4. Click **Create**
5. Accept the Terms of Service

### Step 4: Set Up Data Stream

1. Select **Web** as your platform
2. Enter your **Website URL** (e.g., `https://yourdomain.com`)
3. Enter a **Stream name** (e.g., "BookBot Website")
4. Click **Create stream**

### Step 5: Get Your Measurement ID

1. After creating the stream, you'll see the **Web stream details**
2. Copy the **Measurement ID** (starts with `G-`, e.g., `G-ABC123XYZ`)
3. Add it to your `.env` file:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-ABC123XYZ"
```

## How It Works

### Cookie Consent Integration

Google Analytics only loads **after** a user accepts cookies:

1. User visits the site → Cookie consent banner appears
2. User clicks **Accept** → GA scripts load and start tracking
3. User clicks **Decline** → No tracking occurs

This ensures GDPR/privacy compliance.

### What Gets Tracked

By default, GA4 tracks:

- **Page views** - Every page the user visits
- **Scroll depth** - How far users scroll on pages
- **Outbound clicks** - Clicks on external links
- **Site search** - Search queries (if enabled)
- **Video engagement** - YouTube video interactions
- **File downloads** - Downloads of PDFs, docs, etc.

### Custom Event Tracking

You can track custom events in your code:

```typescript
import { trackEvent } from "@/components/google-analytics";

// Track a button click
trackEvent("click", "button", "signup_cta");

// Track a form submission
trackEvent("submit", "form", "contact_form");

// Track with a value
trackEvent("purchase", "ecommerce", "pro_plan", 29);
```

**Function signature:**
```typescript
trackEvent(
  action: string,    // What happened (e.g., "click", "submit", "purchase")
  category: string,  // Category (e.g., "button", "form", "video")
  label?: string,    // Optional label for more detail
  value?: number     // Optional numeric value
)
```

### Page View Tracking

Page views are tracked automatically. For manual tracking (e.g., after client-side navigation):

```typescript
import { trackPageView } from "@/components/google-analytics";

// Track a page view
trackPageView("/some/page");
```

## Viewing Your Analytics

1. Go to [Google Analytics](https://analytics.google.com)
2. Select your property from the dropdown
3. Key reports:
   - **Realtime** - See current active users
   - **Reports > Acquisition** - How users find your site
   - **Reports > Engagement** - What users do on your site
   - **Reports > Monetization** - Revenue tracking (if configured)

## Testing

### Verify Installation

1. Add your Measurement ID to `.env`
2. Restart your dev server: `npm run dev`
3. Open your site and accept cookies
4. Open browser DevTools → Network tab
5. Filter by "google" - you should see requests to `googletagmanager.com`

### Use GA4 DebugView

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable the extension
3. Go to GA4 → Admin → DebugView
4. Browse your site - events appear in real-time

## Privacy Considerations

- Analytics only loads after explicit cookie consent
- No tracking occurs if user declines cookies
- User consent is stored in localStorage (`bookbot-cookie-consent`)
- Users can clear consent by clearing browser data

## Troubleshooting

### Analytics not loading

1. Check that `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. Ensure the ID starts with `G-`
3. Accept cookies on the site (check localStorage for `bookbot-cookie-consent: accepted`)
4. Check browser console for errors

### No data in GA4 dashboard

- Data can take 24-48 hours to appear in standard reports
- Use **Realtime** report for immediate verification
- Check that your ad blocker isn't blocking GA scripts

### Events not tracking

1. Ensure you're importing from the correct path
2. Check that cookies are accepted
3. Verify in Network tab that gtag requests are being made
