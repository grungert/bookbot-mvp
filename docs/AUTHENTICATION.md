# Authentication System Documentation

This document explains how to configure and use the authentication system in BookBot MVP.

## Table of Contents

1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Environment Variables](#environment-variables)
4. [Google OAuth Setup](#google-oauth-setup)
5. [Email Configuration](#email-configuration)
6. [Authentication Flows](#authentication-flows)
7. [Security Features](#security-features)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The application supports two authentication methods:

- **Credentials-based authentication** (email + password)
- **Google OAuth** (social login)

Both methods integrate with NextAuth.js and use Prisma as the database adapter.

---

## User Roles

The system has three user roles:

| Role | Description | Dashboard Route |
|------|-------------|-----------------|
| `SUPER_ADMIN` | Platform administrator with full control | `/super-admin` |
| `COMPANY_ADMIN` | Business owner who manages companies and services | `/c/{companySlug}/admin` |
| `END_USER` | Customer who books services | `/account` |

### Role Assignment

- New users registering via **credentials** get `END_USER` role by default
- New users registering via **Google OAuth** get `END_USER` role by default
- `SUPER_ADMIN` and `COMPANY_ADMIN` roles must be assigned manually in the database or via super-admin panel

---

## Environment Variables

Add these variables to your `.env` file:

### Required for Authentication

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bookbot
```

### Google OAuth (Optional but Recommended)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Email Service (Required for Email Verification)

```env
# Email Configuration (using Resend)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**

### Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (or Internal for Google Workspace)
3. Fill in the required fields:
   - App name: `BookBot` (or your app name)
   - User support email: your email
   - Developer contact email: your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users if in development mode

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Configure:
   - Name: `BookBot Web Client`
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     https://yourdomain.com
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://yourdomain.com/api/auth/callback/google
     ```
5. Copy the **Client ID** and **Client Secret**

### Step 4: Add to Environment Variables

```env
GOOGLE_CLIENT_ID=229525030966-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

### Step 5: Verify Configuration

The Google OAuth provider is configured in `src/lib/auth.ts`:

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  allowDangerousEmailAccountLinking: true, // Allows linking to existing email accounts
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
})
```

> **Note**: `allowDangerousEmailAccountLinking: true` allows users who registered with email/password to also log in with Google (if same email). This is safe because Google verifies email ownership.

---

## Email Configuration

### Using Resend (Recommended)

1. Sign up at [Resend](https://resend.com/)
2. Create an API key
3. Verify your domain (or use their test domain for development)
4. Add to environment:

```env
RESEND_API_KEY=re_xxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

### Email Templates

Email templates are defined in `src/lib/email.ts`. The system sends emails for:

- **Email Verification**: Sent after registration
- **Password Reset**: Sent when user requests password reset
- **Resend Verification**: User can request new verification email

### Testing Emails Locally

For local development without email:
1. Check the server console for verification/reset links
2. Or use a service like [Mailtrap](https://mailtrap.io/) for testing

---

## Authentication Flows

### 1. Email Registration Flow

```
User fills registration form
        ↓
POST /api/auth/register
        ↓
Create user with emailVerified: null
        ↓
Generate verification token
        ↓
Send verification email
        ↓
User clicks link in email
        ↓
GET /en/verify-email/[token]
        ↓
POST /api/auth/verify-email
        ↓
Set emailVerified: new Date()
        ↓
Redirect to login
```

### 2. Google OAuth Flow

```
User clicks "Sign in with Google"
        ↓
Redirect to Google consent screen
        ↓
User authorizes the app
        ↓
Google redirects to /api/auth/callback/google
        ↓
NextAuth processes OAuth response
        ↓
If user exists → Link Google account (allowDangerousEmailAccountLinking)
If new user → Create user + Account record
        ↓
Create JWT session
        ↓
Redirect to home page
```

### 3. Password Reset Flow

```
User clicks "Forgot Password"
        ↓
GET /en/forgot-password
        ↓
User enters email
        ↓
POST /api/auth/forgot-password
        ↓
Generate reset token (expires in 1 hour)
        ↓
Send reset email
        ↓
User clicks link in email
        ↓
GET /en/reset-password/[token]
        ↓
User enters new password
        ↓
POST /api/auth/reset-password
        ↓
Update password, delete token
        ↓
Redirect to login
```

### 4. Credentials Login Flow

```
User enters email + password
        ↓
POST /api/auth/callback/credentials
        ↓
Check account lockout status
        ↓
Verify password with bcrypt
        ↓
If failed → Record failed attempt, check for lockout
If success → Reset failed attempts
        ↓
Check emailVerified
        ↓
If not verified → Return EMAIL_NOT_VERIFIED error
If verified → Create JWT session
        ↓
Redirect to dashboard based on role
```

---

## Security Features

### Account Lockout

Prevents brute-force attacks by locking accounts after failed attempts.

Configuration in `src/lib/account-lockout.ts`:

```typescript
const MAX_FAILED_ATTEMPTS = 5;      // Lock after 5 failed attempts
const LOCKOUT_DURATION_MINUTES = 15; // Lock for 15 minutes
```

How it works:
1. Each failed login increments `failedLoginAttempts` counter
2. After 5 failures, account is locked for 15 minutes
3. Successful login resets the counter
4. Lockout timestamp stored in `lockedUntil` field

### Rate Limiting

API endpoints are protected against abuse. Configure in `src/lib/rate-limit.ts`.

### Password Requirements

- Minimum 8 characters
- Hashed with bcrypt (12 rounds)

### Email Verification

- Required for credentials login
- Google OAuth users are auto-verified (Google verifies their email)
- Verification tokens expire after 24 hours

### Token Security

- Tokens are hashed before storage
- One-time use (deleted after verification/reset)
- Short expiration times

---

## Troubleshooting

### "OAuthAccountNotLinked" Error

**Cause**: User registered with email/password, then tries to log in with Google (same email).

**Solution**: Already fixed with `allowDangerousEmailAccountLinking: true` in GoogleProvider config.

### "Email not verified" Error

**Cause**: User registered but didn't verify their email.

**Solutions**:
1. Check spam folder for verification email
2. Use "Resend verification email" link on login page
3. Manually set `emailVerified` in database for testing

### Google OAuth Redirect Error

**Cause**: Incorrect redirect URI configuration.

**Solution**: Ensure these match exactly in Google Console:
- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://yourdomain.com/api/auth/callback/google`

### Token Expired

**Cause**: Verification or reset token has expired.

**Solution**: Request a new token via the appropriate form.

### Account Locked

**Cause**: Too many failed login attempts.

**Solution**: Wait 15 minutes or manually clear `lockedUntil` and `failedLoginAttempts` in database.

---

## Database Schema

Key tables for authentication:

```prisma
model User {
  id                  String    @id @default(cuid())
  email               String    @unique
  emailVerified       DateTime?
  password            String?   // Null for OAuth-only users
  name                String?
  image               String?
  role                UserRole  @default(END_USER)
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  accounts            Account[]
  // ... other fields
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  // OAuth tokens...
  user              User    @relation(fields: [userId], references: [id])

  @@unique([provider, providerAccountId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

---

## Scripts

### Check OAuth Account Links

```bash
npx tsx scripts/fix-oauth-link.ts
```

Shows which users have linked Google accounts.

### Clear Account Lockout (for testing)

```sql
UPDATE "User"
SET "failedLoginAttempts" = 0, "lockedUntil" = NULL
WHERE email = 'user@example.com';
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/email.ts` | Email sending utilities |
| `src/lib/tokens.ts` | Token generation/verification |
| `src/lib/account-lockout.ts` | Lockout logic |
| `src/lib/auth-errors.ts` | Error codes |
| `src/app/api/auth/` | Auth API routes |
| `src/app/[locale]/(auth)/` | Auth pages |
