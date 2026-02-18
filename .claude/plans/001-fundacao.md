# Plano 001: Fundação — Setup, Docker, Estrutura

## Objetivo
Criar a estrutura base do projeto Next.js 14, configurar Docker Compose com todos os serviços, instalar dependências, configurar variáveis de ambiente e garantir que o ambiente de desenvolvimento esteja 100% funcional.

## Dependências
- Nenhuma

## Escopo

### O Que Está Incluído
- Next.js 14 com App Router + TypeScript
- Tailwind CSS + shadcn/ui (setup inicial)
- Prisma setup (sem schema ainda — isso é o plano 002)
- Docker Compose: app, redis
- `.env.local` template com todas as variáveis
- Estrutura de pastas do projeto
- ESLint + Prettier configurados
- NextAuth.js v5 setup básico (login screen)
- Health check endpoint `/api/health`

### O Que NÃO Está Incluído
- Schema do banco (Plano 002)
- Features de negócio (Planos 003+)
- Deploy em produção (Plano 012)

## Tarefas

1. **Inicializar projeto Next.js**
   - `npx create-next-app@latest fac-reactivation --typescript --tailwind --app --src-dir`
   - Arquivos: `package.json`, `next.config.ts`, `tsconfig.json`

2. **Instalar dependências core**
   ```bash
   npm install prisma @prisma/client @auth/prisma-adapter next-auth@beta
   npm install bullmq ioredis zod pino pino-pretty
   npm install resend twilio @anthropic-ai/sdk
   npm install @tanstack/react-query zustand recharts
   npm install -D @types/node
   ```
   Arquivos: `package.json`

3. **Setup shadcn/ui**
   - `npx shadcn@latest init`
   - Instalar: button, card, table, badge, dialog, input, select, tabs
   - Arquivos: `components.json`, `src/components/ui/`

4. **Docker Compose**
   - Arquivo: `docker-compose.yml`
   ```yaml
   services:
     redis:
       image: redis:7-alpine
       ports: ["6379:6379"]
       volumes: [redis_data:/data]
     app:
       build: .
       ports: ["3000:3000"]
       env_file: .env.local
       depends_on: [redis]
   ```
   - Arquivo: `Dockerfile`

5. **Variáveis de ambiente**
   - Arquivo: `.env.local.example` (template sem valores reais)
   - Arquivo: `.env.local` (com valores reais — no .gitignore)

6. **NextAuth setup**
   - Arquivo: `src/app/api/auth/[...nextauth]/route.ts`
   - Arquivo: `src/auth.ts`
   - Arquivo: `src/middleware.ts` (proteger rotas /dashboard/*)
   - Arquivo: `src/app/login/page.tsx` (tela simples de login)

7. **Health check**
   - Arquivo: `src/app/api/health/route.ts`
   - Retorna: `{status: "ok", timestamp, services: {redis: "ok/error"}}`

8. **Estrutura de pastas**
   ```
   src/
     app/
       api/
         auth/
         health/
         leads/
         campaigns/
         webhooks/
       dashboard/
       login/
     components/
       ui/          # shadcn
       leads/
       campaigns/
       dashboard/
     lib/
       db.ts        # Prisma client singleton
       redis.ts     # IORedis / BullMQ setup
       queue.ts     # BullMQ queues
       auth.ts      # NextAuth config
     types/
       index.ts
   ```

## Critérios de Verificação
- [ ] `npm run dev` roda sem erros
- [ ] `docker-compose up` sobe redis sem erros
- [ ] `GET /api/health` retorna 200 com `{status: "ok"}`
- [ ] Tela de login acessível em `/login`
- [ ] Rota `/dashboard` redireciona para login se não autenticado
- [ ] `npm run lint` sem erros
- [ ] `npm run build` sem erros

## Notas Técnicas

### Gotchas Conhecidos
- Next.js 14 App Router: usar `"use client"` apenas onde necessário
- NextAuth v5 beta: API diferente do v4 — usar `auth()` ao invés de `getServerSession()`
- Prisma + Supabase: usar `DATABASE_URL` com `?pgbouncer=true&connection_limit=1` para serverless
- Docker: app service deve ter `HOSTNAME=0.0.0.0` para aceitar conexões externas

### Referências
- https://nextjs.org/docs
- https://authjs.dev/getting-started
- https://www.prisma.io/docs/getting-started
