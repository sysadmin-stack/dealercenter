# Deploy Guide — DealerCenter

## Prerequisites

- VPS with Ubuntu 22.04+ (minimum 2GB RAM, 2 vCPU)
- Docker & Docker Compose installed
- Domain pointing to VPS IP
- Git access to repository

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/sysadmin-stack/dealercenter.git
cd dealercenter

# 2. Create production env file
cp .env.local.example .env.production
nano .env.production  # Edit with real credentials

# 3. Run setup
chmod +x scripts/deploy.sh
./scripts/deploy.sh setup

# 4. Configure SSL
DOMAIN=yourdomain.com EMAIL=admin@yourdomain.com ./scripts/deploy.sh ssl

# 5. Seed the database (if first deploy)
./scripts/deploy.sh seed
```

## Environment Variables (.env.production)

**Required — change these:**

```env
# Database (internal Docker network — no need to change unless custom)
DATABASE_URL="postgresql://dealercenter:STRONG_PASSWORD_HERE@postgres:5432/dealercenter"

# Auth
AUTH_SECRET="<generate: openssl rand -base64 32>"
AUTH_URL="https://yourdomain.com"
NEXTAUTH_URL="https://yourdomain.com"

# Redis (internal Docker network)
REDIS_URL="redis://redis:6379"

# WAHA (WhatsApp)
WAHA_API_URL="http://your-waha-host:3001"
WAHA_API_KEY="your-waha-api-key"
WAHA_SESSION="default"
WAHA_WEBHOOK_SECRET="<generate: openssl rand -hex 32>"

# Resend (Email)
RESEND_API_KEY="re_your_real_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_WEBHOOK_SECRET="<from Resend dashboard>"

# Twilio (SMS)
TWILIO_ACCOUNT_SID="your_sid"
TWILIO_AUTH_TOKEN="your_token"
TWILIO_PHONE_NUMBER="+1XXXXXXXXXX"

# Claude AI
ANTHROPIC_API_KEY="sk-ant-your-key"

# Chatwoot
CHATWOOT_URL="https://your-chatwoot.com"
CHATWOOT_API_TOKEN="your-token"
CHATWOOT_ACCOUNT_ID="1"
CHATWOOT_INBOX_ID="1"

# N8N
N8N_WEBHOOK_SECRET="<generate: openssl rand -hex 32>"

# Sales Rep
SALES_REP_PHONE="+1XXXXXXXXXX"

# App
APP_URL="https://yourdomain.com"
NODE_ENV="production"
```

**Docker Compose also uses:**

```env
POSTGRES_USER=dealercenter
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
POSTGRES_DB=dealercenter
```

## Architecture

```
Internet
  │
  ▼
┌─────────────┐
│   Nginx     │  :80 → redirect to :443
│  (SSL/TLS)  │  :443 → proxy to app:3000
└─────┬───────┘
      │
  ┌───┴───────────────┐
  │                   │
  ▼                   ▼
┌──────┐         ┌────────┐
│ App  │         │ Worker │
│:3000 │         │ BullMQ │
└──┬───┘         └───┬────┘
   │                 │
   ├─────┬───────────┤
   │     │           │
   ▼     ▼           ▼
┌─────┐ ┌─────┐
│ PG  │ │Redis│
│:5432│ │:6379│
└─────┘ └─────┘
```

## Common Operations

```bash
# View logs
./scripts/deploy.sh logs          # All services
./scripts/deploy.sh logs app      # App only
./scripts/deploy.sh logs worker   # Worker only

# Restart
./scripts/deploy.sh restart       # All
./scripts/deploy.sh restart app   # Just the app

# Deploy update
./scripts/deploy.sh deploy

# Stop everything
./scripts/deploy.sh down

# Check status
./scripts/deploy.sh status

# Run migrations manually
docker compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy

# Open Prisma Studio (local dev only)
npx prisma studio
```

## Updating

```bash
# SSH into VPS
ssh user@your-vps

# Navigate to project
cd /opt/dealercenter

# Deploy latest
./scripts/deploy.sh deploy
```

The deploy script will:
1. Pull latest code from `main`
2. Rebuild Docker images
3. Run pending migrations
4. Restart all services with zero-downtime (rolling restart)

## SSL Certificate Renewal

Certbot runs automatically in a container and renews certificates every 12 hours (if needed). No manual action required.

## Troubleshooting

**App won't start:**
```bash
# Check logs
./scripts/deploy.sh logs app

# Check if DB is ready
docker compose -f docker-compose.prod.yml exec postgres pg_isready
```

**Worker errors:**
```bash
./scripts/deploy.sh logs worker
```

**SSL issues:**
```bash
# Check cert status
docker compose -f docker-compose.prod.yml exec certbot certbot certificates

# Force renewal
docker compose -f docker-compose.prod.yml exec certbot certbot renew --force-renewal
```

**Database connection issues:**
```bash
# Verify PostgreSQL is running
docker compose -f docker-compose.prod.yml ps postgres

# Check connection from app container
docker compose -f docker-compose.prod.yml exec app sh -c 'wget -qO- http://localhost:3000/api/health'
```
