# Deployment Guide

This guide covers deploying BookBot to various platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Docker Deployment](#docker-deployment)
- [Vercel Deployment](#vercel-deployment)
- [Database Setup](#database-setup)
- [Cron Jobs](#cron-jobs)
- [SSL/HTTPS](#sslhttps)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (for Docker deployment)
- Domain name with DNS access (for production)

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/bookbot` |
| `NEXTAUTH_SECRET` | JWT signing secret | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app's full URL | `https://yourdomain.com` |
| `RESEND_API_KEY` | Email provider API key | `re_xxxxx` |
| `EMAIL_FROM` | Sender email address | `noreply@yourdomain.com` |
| `CRON_SECRET` | Cron endpoint auth secret | Generate with `openssl rand -base64 32` |

### Cron Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_CRON` | Enable built-in scheduler | `false` |
| `CRON_TIMEZONE` | Timezone for cron jobs | `Europe/Belgrade` |

**When to use `ENABLE_CRON=true`:**
- Docker deployments
- VPS/dedicated servers
- Any persistent Node.js server

**When to use `ENABLE_CRON=false`:**
- Vercel (uses Vercel Cron)
- Serverless platforms
- External cron service (cron-job.org)

---

## Docker Deployment

### Quick Start

```bash
# 1. Clone and configure
git clone <repo-url>
cd bookbot-mvp
cp .env.example .env
# Edit .env with your values

# 2. Build and start
docker-compose up -d --build

# 3. Run database migrations
docker-compose exec app npx prisma migrate deploy

# 4. Seed initial data (optional)
docker-compose exec app npx prisma db seed

# 5. View logs
docker-compose logs -f app
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - ENABLE_CRON=true
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-bookbot}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Useful Docker Commands

```bash
# Rebuild after code changes
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Enter container shell
docker-compose exec app sh

# Run Prisma commands
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma studio

# Restart app
docker-compose restart app

# Stop everything
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

---

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Vercel auto-detects Next.js

### 2. Configure Environment Variables

In Vercel dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-app.vercel.app
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
CRON_SECRET=your-cron-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Note:** Do NOT set `ENABLE_CRON=true` on Vercel. Use Vercel Cron instead.

### 3. Vercel Cron Configuration

The `vercel.json` file configures automatic cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/appointment-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Vercel automatically adds `CRON_SECRET` to the Authorization header.

### 4. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

## Database Setup

### Option 1: Docker PostgreSQL (included)

Already configured in `docker-compose.yml`. Data persists in Docker volume.

### Option 2: Managed PostgreSQL

Recommended providers:
- [Neon](https://neon.tech) - Free tier, serverless
- [Supabase](https://supabase.com) - Free tier, includes auth
- [Railway](https://railway.app) - Simple, good free tier
- [PlanetScale](https://planetscale.com) - MySQL (requires adapter)

### Running Migrations

```bash
# Development
npx prisma migrate dev

# Production (Docker)
docker-compose exec app npx prisma migrate deploy

# Production (Vercel/serverless)
npx prisma migrate deploy
```

### Backup & Restore

```bash
# Backup
docker-compose exec db pg_dump -U postgres bookbot > backup.sql

# Restore
docker-compose exec -T db psql -U postgres bookbot < backup.sql
```

---

## Cron Jobs

### Available Cron Jobs

| Job | Schedule | Description |
|-----|----------|-------------|
| Appointment Reminders | `0 8 * * *` (8 AM daily) | Sends reminder emails 24h before appointments |

### How Cron Works

**Docker/Self-hosted (`ENABLE_CRON=true`):**
```
┌─────────────────┐
│  Node.js App    │
│  ┌───────────┐  │
│  │ node-cron │──┼──▶ Calls /api/cron/... internally
│  └───────────┘  │
└─────────────────┘
```

**Vercel/External (`ENABLE_CRON=false`):**
```
┌──────────────┐     HTTP      ┌─────────────┐
│ Vercel Cron  │ ───────────▶  │ /api/cron   │
│ or external  │   + Auth      │ endpoint    │
└──────────────┘               └─────────────┘
```

### Adding New Cron Jobs

1. Create API endpoint in `src/app/api/cron/your-job/route.ts`
2. Add to scheduler in `src/lib/cron/scheduler.ts`:

```typescript
cron.schedule("0 */6 * * *", async () => {  // Every 6 hours
  await fetch(`${baseUrl}/api/cron/your-job`, {
    headers: { Authorization: `Bearer ${cronSecret}` }
  });
}, { timezone });
```

3. Add to `vercel.json` for Vercel deployments:

```json
{
  "crons": [
    { "path": "/api/cron/your-job", "schedule": "0 */6 * * *" }
  ]
}
```

### Testing Cron Manually

```bash
# With authentication
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/appointment-reminders
```

---

## SSL/HTTPS

### Docker with Nginx + Let's Encrypt

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Add to `docker-compose.prod.yml`:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
    restart: unless-stopped
```

---

## Troubleshooting

### Cron not running

1. Check `ENABLE_CRON=true` is set
2. Check `CRON_SECRET` is set
3. Look for logs: `[CRON] Initializing cron jobs...`
4. Test manually with curl

### Database connection failed

1. Check `DATABASE_URL` format
2. Ensure database is running: `docker-compose ps`
3. Check network connectivity between containers

### Emails not sending

1. Check `RESEND_API_KEY` is valid
2. Verify `EMAIL_FROM` domain is verified in Resend
3. Check logs for `[EMAIL]` messages

### Container won't start

```bash
# Check logs
docker-compose logs app

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Memory issues

Add memory limits to `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
```
