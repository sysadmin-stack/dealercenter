# DealerCenter — Context & Deployment

## VPS Access

- **IP:** 95.217.177.54
- **Hostname:** WebApp-VPS (Hetzner)
- **SSH:** `ssh -i ~/.ssh/vps_key root@95.217.177.54`
- **Domain:** recovery.dealercrm.io (CNAME → vps-frontend.dealercrm.io → 95.217.177.54)
- **Deploy path:** /opt/dealercenter

## VPS Resources

- **Disk:** 75G total, 59G used, 14G available (81%)
- **RAM:** 7.6G total, 3.9G used, 3.7G available
- **Swap:** None

## Services Running on VPS (DO NOT conflict)

| Service | Container | Port | Domain |
|---------|-----------|------|--------|
| Omnia Auto System | omnia-app | 3012 | omnia.dealercrm.io |
| ScrapLeads | scrapleads | 3008 | leads.sociosai.com |
| SM Engine | sm-engine-nextjs | 3011 | sm-engine.metamorph-ai.com |
| Chatwoot | chatwoot-rails | 3009 | app.dealercrm.io |
| Chatwoot Sidekiq | chatwoot-sidekiq | — | — |
| Chatwoot Redis | chatwoot-redis | 6379 (internal) | — |
| Chatwoot Postgres | chatwoot-postgres | 5432 (internal) | — |
| FAC Telegram Bot | fac-telegram-bot | — | — |
| Portainer | portainer | 9000 | — |
| WAHA (WhatsApp) | node process | 3001 | waha.metamorph-ai.com |
| Unknown | — | 3000 | — |
| Unknown | — | 3003-3007 | — |
| Unknown | — | 9002-9003 | — |

### Ports in use: 22, 53, 80, 443, 3000-3009, 3011-3012, 6379, 9000, 9002, 9003

### Nginx sites-enabled (system Nginx, NOT Docker):
blogai, blogautopost, chatwoot, dealercrm, inventory, omnia, pinkie, saas-inventory, scrapleads, sm-engine, sm-engine-api

### Available port range for DealerCenter: 3013+ or 3020+

## DealerCenter Deploy Strategy

- Use port **3020** for app (avoids all existing)
- Use port **3021** for worker (internal only, no nginx needed)
- PostgreSQL + Redis in Docker (internal network, no exposed ports)
- Add nginx site config for `recovery.dealercrm.io` → proxy to localhost:3020
- SSL via existing Certbot on VPS (not Docker certbot)
- DO NOT use our docker-compose.prod.yml nginx/certbot — VPS already has system Nginx + Certbot

## Related Services (same VPS)

- **Chatwoot:** app.dealercrm.io (port 3009) — used for handoffs
- **WAHA:** waha.metamorph-ai.com (port 3001) — WhatsApp API
- **N8N:** n8n01.metamorph-ai.com (separate server)
- **Redis:** localhost:6379 (system Redis, shared)

## Tech Stack

- Next.js 16 + App Router + TypeScript
- Prisma v7 with @prisma/adapter-pg
- BullMQ workers (WhatsApp, Email, SMS, Analytics)
- Workers run via `tsx src/workers/index.ts`
- Workers use `bullmq/node_modules/ioredis` (not top-level ioredis)
- Lazy init pattern for external clients (Resend, Twilio, Claude, Redis)

## Git Remote

- https://github.com/sysadmin-stack/dealercenter.git
- Branch: main
