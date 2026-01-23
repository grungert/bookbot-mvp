# Email System

BookBot uses [Resend](https://resend.com) for transactional emails. This document covers all email types, their triggers, and configuration.

## Configuration

### Environment Variables

```env
# Required for sending emails
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# Required for cron jobs (appointment reminders)
CRON_SECRET="your-secret-key"
```

### Generating CRON_SECRET

Generate a secure random secret for protecting the cron endpoint:

```bash
openssl rand -base64 32
```

Copy the output and set it as your `CRON_SECRET` environment variable in Vercel or your `.env` file.

## Email Types

### Customer Emails

| Email | Template | Trigger | Description |
|-------|----------|---------|-------------|
| Booking Confirmation | `booking-confirmation.tsx` | Appointment created | Sent when customer books an appointment |
| Appointment Reminder | `appointment-reminder.tsx` | Cron job (daily at 8 AM) | Sent 24 hours before appointment |
| Appointment Update | Plain text | Appointment time changed | Notifies customer of rescheduled appointment |
| Cancellation Notice | `cancellation-notice.tsx` | Appointment cancelled | Confirms cancellation to customer |
| Invoice Sent | `invoice-sent.tsx` | Invoice status → SENT | Sends invoice details with link |
| Payment Received | `invoice-paid.tsx` | Invoice status → PAID | Payment confirmation |

### Admin Emails

| Email | Template | Trigger | Description |
|-------|----------|---------|-------------|
| New Booking Notification | `new-booking-admin.tsx` | Appointment created | Notifies company admin of new booking |
| Upgrade Request (Admin) | `upgrade-request-admin.tsx` | User requests upgrade | Notifies super admin |

### User Account Emails

| Email | Template | Trigger | Description |
|-------|----------|---------|-------------|
| Upgrade Request (User) | `upgrade-request-user.tsx` | User requests upgrade | Confirms request with bank details |
| Upgrade Approved | `upgrade-approved.tsx` | Admin approves upgrade | Subscription activated |
| Upgrade Rejected | `upgrade-rejected.tsx` | Admin rejects upgrade | Request declined with notes |

### Auth Emails (separate system)

Located in `src/lib/email.ts`:
- Email verification on registration
- Password reset
- Resend verification

## Cron Jobs

### Appointment Reminders

**Endpoint:** `GET /api/cron/appointment-reminders`

**Schedule:** Daily at 8:00 AM UTC (configurable in `vercel.json`)

**What it does:**
1. Finds appointments starting tomorrow
2. Filters out cancelled appointments and those already reminded
3. Sends reminder email to each customer
4. Marks appointment as `reminderSentAt` to prevent duplicates

**Configuration (Vercel):**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/appointment-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Configuration (Docker/Self-hosted):**

For Docker deployments, use the built-in node-cron scheduler:

```env
ENABLE_CRON=true
CRON_SECRET=your-secret
CRON_TIMEZONE=Europe/Belgrade
```

The cron scheduler initializes automatically when the server starts via Next.js instrumentation (`src/instrumentation.ts`).

**Security:**
- Protected by `CRON_SECRET` environment variable
- Requires `Authorization: Bearer <CRON_SECRET>` header
- In development without `CRON_SECRET`, allows unauthenticated access

**Manual Testing:**
```bash
# With auth
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/appointment-reminders

# Development (no CRON_SECRET set)
curl http://localhost:3000/api/cron/appointment-reminders
```

## Email Templates

All templates are React Email components located in `src/lib/email/templates/`.

### Template Structure

```tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MyEmailProps {
  customerName: string;
  // ... other props
}

export function MyEmail({ customerName }: MyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Preview text shown in email client</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Email content */}
        </Container>
      </Body>
    </Html>
  );
}
```

### Adding a New Email

1. Create template in `src/lib/email/templates/`:
   ```tsx
   // src/lib/email/templates/my-email.tsx
   export function MyEmail(props: MyEmailProps) { ... }
   ```

2. Add send function in `src/lib/email/send.ts`:
   ```tsx
   import { MyEmail } from "./templates/my-email";

   export async function sendMyEmail(data: MyEmailData) {
     const resend = getResend();
     await resend.emails.send({
       from: FROM_EMAIL,
       to: data.email,
       subject: "Subject line",
       react: MyEmail({ ...data }),
     });
   }
   ```

3. Call the function from your API route or service.

## Admin Notifications

### New Booking Notifications

Company admins receive email notifications when customers book appointments. You can configure multiple email addresses to receive these notifications.

**To configure:**
1. Go to Company Settings → Business Details
2. Scroll to "Booking Notification Emails"
3. Add one or more email addresses
4. Click Save

**How it works:**
- When a customer books an appointment, emails are sent to all configured notification addresses
- For backwards compatibility, `businessEmail` is also included if set
- Emails are sent in parallel for performance

## Troubleshooting

### Emails not sending

1. Check `RESEND_API_KEY` is set correctly
2. Verify `EMAIL_FROM` domain is verified in Resend
3. Check server logs for `[EMAIL]` prefixed messages

### Reminders not sending

1. Verify `CRON_SECRET` is set in production
2. Check Vercel Cron logs in dashboard
3. Ensure appointments have status `PENDING` or `CONFIRMED`
4. Check `reminderSentAt` is null (not already sent)

### Testing locally

```bash
# Preview emails (requires email preview setup)
npm run email:dev

# Test cron endpoint
curl http://localhost:3000/api/cron/appointment-reminders
```
