# Plano 002: Banco de Dados — Schema Prisma + Migrations

## Objetivo
Criar o schema completo do Prisma com todos os modelos, executar a migration inicial no Supabase, e criar seeds com dados reais dos leads importados das planilhas.

## Dependências
- [x] Plano 001: Fundação completo

## Escopo

### O Que Está Incluído
- Schema Prisma completo (todos os modelos do PRD)
- Migration inicial no Supabase
- Indexes de performance
- Seed script com leads reais (das 5 planilhas)
- Prisma client singleton configurado
- Tipos TypeScript gerados pelo Prisma

### O Que NÃO Está Incluído
- API routes de leads (Plano 003)
- Lógica de negócio

## Tarefas

1. **Schema Prisma**
   - Arquivo: `prisma/schema.prisma`
   - Modelos: Lead, Campaign, Touch, TouchEvent, Conversation, DNCList, AuditLog, User (NextAuth)
   - Enums: Segment, Channel, TouchStatus, CampaignStatus, Language

2. **Migration inicial**
   - Comando: `npx prisma migrate dev --name init`
   - Arquivo: `prisma/migrations/XXXX_init/migration.sql`

3. **Prisma Client singleton**
   - Arquivo: `src/lib/db.ts`
   ```ts
   import { PrismaClient } from '@prisma/client'
   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
   export const prisma = globalForPrisma.prisma ?? new PrismaClient()
   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```

4. **Seed script**
   - Arquivo: `prisma/seed.ts`
   - Lê os dados já parseados e insere ~7.850 leads
   - DNC list: inserir os 11 leads com DNC do dataset
   - Admin user: inserir usuário antonio@floridautocenter.com

5. **Types export**
   - Arquivo: `src/types/index.ts`
   - Re-exportar tipos Prisma + tipos customizados da aplicação

## Critérios de Verificação
- [ ] `npx prisma migrate dev` executa sem erros
- [ ] `npx prisma db seed` insere leads sem erros
- [ ] `npx prisma studio` abre e mostra dados corretamente
- [ ] Todos os indexes criados (verificar no Supabase dashboard)
- [ ] `prisma.$queryRaw` de teste retorna dados

## Notas Técnicas

### Schema Prisma (esqueleto)
```prisma
model Lead {
  id          String   @id @default(uuid())
  name        String
  email       String?
  phone       String?
  address     String?
  dob         DateTime?
  segment     Segment  @default(FROZEN)
  score       Int      @default(0)
  language    Language @default(EN)
  status      String   @default("imported")
  source      String?
  salesRep    String?
  originType  String?
  daysOld     Int?
  creditApp   Boolean  @default(false)
  lostReason  String?
  optedOut    Boolean  @default(false)
  emailValid  Boolean  @default(true)
  importedYear Int?
  touches     Touch[]
  conversations Conversation[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([segment])
  @@index([optedOut])
}
```

### Gotchas Conhecidos
- Supabase com Prisma: usar `directUrl` para migrations e `url` com pgbouncer para queries
- UUID: usar `@default(uuid())` não `@default(cuid())` para compatibilidade com Supabase RLS
- `updatedAt`: sempre usar `@updatedAt` para auditoria
