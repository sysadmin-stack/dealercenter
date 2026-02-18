# PRD - FAC Reactivation Engine
## Florida Auto Center — Sistema de Reativação Multicanal de Leads

---

## Visão Geral

### Objetivo
Sistema automatizado de reativação de leads inativos para a Florida Auto Center, operando via WhatsApp (WAHA), Email (Resend) e SMS (Twilio). O sistema segmenta 7.850+ leads por temperatura, gera mensagens personalizadas com IA (Claude), dispara cadências automatizadas via N8N, e faz handoff inteligente para sales reps humanos via Chatwoot quando um lead demonstra interesse real.

### Não-Objetivos
- ❌ Não é um CRM completo — não substitui o sistema de gestão de leads existente
- ❌ Não gerencia inventário de veículos
- ❌ Não processa pagamentos ou financiamentos
- ❌ Não tem integração com Meta Business API (usa WAHA)
- ❌ Não envia mensagens em grupo de WhatsApp
- ❌ Não é uma plataforma multi-tenant (uso exclusivo Florida Auto Center)

### Público-Alvo
Equipe interna da Florida Auto Center: Antonio (admin/dev), sales reps (Matheus, Guilherme, Bruno, etc.) e os 7.850 leads inativos como destinatários finais das campanhas.

### Proposta de Valor
Reativar leads dormentes de forma automatizada, personalizada e escalável, sem esforço manual dos sales reps, com handoff humano apenas quando o lead demonstra interesse real — maximizando a taxa de conversão de uma base já existente.

---

## Personas

### Persona 1: Antonio — Admin & Operador
- **Descrição**: Dono da Florida Auto Center, desenvolvedor full-stack, opera o sistema
- **Necessidades**: Visualizar métricas, configurar campanhas, importar leads, monitorar handoffs
- **Dores**: Perda de tempo operando o sistema, falta de visibilidade do funil
- **Objetivos**: Que o sistema rode sozinho com mínima intervenção, notificações apenas quando necessário

### Persona 2: Sales Rep (Matheus, Bruno, Guilherme)
- **Descrição**: Vendedor da loja, recebe handoffs de leads qualificados
- **Necessidades**: Saber exatamente quem respondeu e o que disse, contexto completo do lead
- **Dores**: Receber leads frios sem contexto, não saber o que foi enviado anteriormente
- **Objetivos**: Receber leads quentes prontos para fechar, com histórico completo da conversa

### Persona 3: Lead (Cliente Potencial)
- **Descrição**: Pessoa que buscou um carro anteriormente e não comprou, EN/ES/PT
- **Necessidades**: Receber comunicação relevante e não invasiva
- **Dores**: Mensagens genéricas e em excesso
- **Objetivos**: Encontrar o veículo certo no momento certo

---

## Stack Tecnológica

### Frontend (Dashboard)
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (server state) + Zustand (UI state)
- **Charts**: Recharts
- **Auth**: NextAuth.js v5 com Supabase adapter
- **Deploy**: VPS própria com Docker + Nginx

### Backend / API
- **Runtime**: Node.js 20 LTS
- **Framework**: Next.js 14 API Routes (App Router)
- **ORM**: Prisma v5 + Supabase PostgreSQL
- **Queue / Jobs**: BullMQ + Redis (jobs de disparo e cadência)
- **Validation**: Zod

### Automação
- **Orquestrador**: N8N (já configurado na VPS)
- **WhatsApp**: WAHA (já configurado) — engine NOWEB ou WEBJS
- **Email**: Resend SDK (batch up to 100/call)
- **SMS**: Twilio Programmable Messaging SDK
- **IA**: Claude API (claude-sonnet-4-6) para geração de mensagens e agente conversacional

### Infraestrutura
- **Banco**: Supabase PostgreSQL (já configurado)
- **Cache/Queue**: Redis (Docker na VPS)
- **Reverse Proxy**: Nginx
- **Container**: Docker + Docker Compose
- **VPS**: Linux (Ubuntu 22.04)
- **Monitoring**: Logs estruturados com Pino + alertas via WhatsApp para Antonio

### Integrações
| Serviço | Uso | Auth |
|---------|-----|------|
| WAHA | Envio/recebimento WhatsApp | API Key + Webhook |
| Resend | Email transacional e em massa | API Key |
| Twilio | SMS | Account SID + Auth Token |
| Claude API | Geração de copy + agente conversacional | API Key |
| Chatwoot | Inbox unificado + handoff humano | API Access Token |
| N8N | Orquestração de workflows | Internal |
| Supabase | PostgreSQL + Auth | Service Role Key |

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD (Next.js)                       │
│  Import Leads │ Campanhas │ Métricas │ Handoffs │ Config    │
└────────────────────────────┬────────────────────────────────┘
                             │ API Routes
┌────────────────────────────▼────────────────────────────────┐
│                      BACKEND SERVICES                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ Lead Import │  │  Campaign   │  │  Conversation    │   │
│  │  & Segment  │  │  Manager    │  │  Handler (AI)    │   │
│  └──────┬──────┘  └──────┬──────┘  └────────┬─────────┘   │
│         │                │                   │              │
│  ┌──────▼──────────────▼───────────────────▼─────────┐    │
│  │              BullMQ Job Queue (Redis)               │    │
│  │  dispatch:whatsapp │ dispatch:email │ dispatch:sms  │    │
│  └──────┬─────────────────────────────────────────────┘    │
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                    DISPATCH WORKERS                          │
│                                                             │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐           │
│  │   WAHA    │    │  Resend   │    │  Twilio   │           │
│  │ WhatsApp  │    │   Email   │    │    SMS    │           │
│  └─────┬─────┘    └─────┬─────┘    └─────┬─────┘           │
└────────┼────────────────┼────────────────┼─────────────────┘
         │                │                │
         ▼                ▼                ▼
    Lead recebe      Lead recebe      Lead recebe
     WhatsApp          Email             SMS
         │
         │ Lead responde (webhook WAHA)
         ▼
┌─────────────────────────────┐
│    AI CONVERSATIONAL AGENT  │
│    (Claude API + N8N)       │
│                             │
│  Responde → Qualifica       │
│       │                     │
│       ├─ Interesse? → HANDOFF para Chatwoot
│       └─ Sem interesse? → Continua cadência / opt-out
└─────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│         CHATWOOT            │
│   Sales Rep recebe lead     │
│   com histórico completo    │
└─────────────────────────────┘
```

### Componentes Principais
1. **Lead Engine**: Importação, deduplicação, segmentação e scoring de leads
2. **Campaign Manager**: Criação e gestão de campanhas multicanal com cadências
3. **Dispatch Workers**: BullMQ workers que executam os disparos com rate limiting
4. **AI Copywriter**: Claude API gerando mensagens personalizadas por lead
5. **Conversation Handler**: Agente IA que responde e qualifica leads que respondem
6. **Analytics Engine**: Tracking de métricas e otimização de performance
7. **Compliance Guard**: DNC list, opt-out, janelas de horário

---

## Funcionalidades

### 1. Importação e Segmentação de Leads

**Descrição**: Upload de planilhas XLSX com leads, deduplicação automática, enriquecimento e classificação em segmentos.

**Fluxo**:
1. Admin faz upload do XLSX no dashboard
2. Sistema parseia e valida emails/telefones
3. Deduplicação por email+nome
4. Sistema detecta idioma (EN/ES/PT) pelo nome e email
5. Leads classificados em HOT/WARM/COLD/FROZEN por `days_old`
6. Leads com `credit_app_completed=true` recebem score premium (+20pts)
7. Leads adicionados ao banco com status `imported`

**Regras de Negócio**:
- HOT: days_old < 90
- WARM: 90 ≤ days_old < 365
- COLD: 365 ≤ days_old < 730
- FROZEN: days_old ≥ 730
- Score base por segment: HOT=100, WARM=70, COLD=40, FROZEN=20
- Bonus: credit_app=+20, walk-in=+15, email válido=+5
- DNC automático para leads com `lost_reason = 'PROSPECT REQUESTED COMPLETE DNC'`

**Casos de Borda**:
- Email inválido → phone-only, skip canal email
- Sem telefone → skip WA e SMS
- Duplicata → merge, mantém dados mais recentes
- `status = SOLD` → skip completo, não incluir em campanha

### 2. Gestão de Campanhas

**Descrição**: Admin cria campanhas selecionando segmentos, canais e cadência.

**Fluxo**:
1. Admin acessa "Nova Campanha" no dashboard
2. Seleciona segmentos (ex: WARM + COLD)
3. Seleciona canais (WA, Email, SMS — qualquer combinação)
4. Sistema mostra preview: X leads elegíveis
5. Admin define nome da campanha e ativa
6. Sistema enfileira jobs de disparo na BullMQ
7. Admin pode pausar/retomar/cancelar campanha a qualquer momento

**Cadências por Segmento (padrão)**:

```
HOT (157 leads):
  Dia 1 manhã  → WhatsApp (pessoal, do sales rep)
  Dia 1 tarde  → Email (oferta de estoque)
  Dia 3        → SMS (follow-up curto)
  Dia 7        → Marca para ligação humana

WARM (988 leads):
  Dia 1  → Email (reintrodução)
  Dia 4  → WhatsApp (mensagem de valor)
  Dia 10 → Email (prova social + urgência suave)
  Dia 21 → SMS (último toque)

COLD (1.967 leads):
  Dia 1  → Email (re-apresentação)
  Dia 7  → WhatsApp (quebra de padrão)
  Dia 20 → Email (oferta especial 48h)

FROZEN (3.873 leads):
  Email mensal (newsletter de estoque)
  WhatsApp único (triagem por interesse)
```

### 3. AI Copywriter

**Descrição**: Para cada lead e cada toque da cadência, Claude API gera uma mensagem personalizada.

**Prompt System (Copywriter)**:
```
Você é um especialista em vendas automotivas da Florida Auto Center, uma concessionária em Orlando, FL com 11 anos de mercado e mais de 2.600 veículos vendidos.

Sua tarefa é escrever uma mensagem de {CANAL} para reativar um lead inativo.

DADOS DO LEAD:
- Nome: {NOME}
- Segmento: {SEGMENTO}
- Toque: {NUMERO_TOQUE} de {TOTAL_TOQUES}
- Dias sem contato: {DIAS}
- Motivo de perda anterior: {LOST_REASON}
- Credit app completo: {CREDIT_APP}
- Origem do lead: {SOURCE}
- Idioma preferido: {IDIOMA}
- Sales rep designado: {SALES_REP}

REGRAS:
1. Escreva APENAS em {IDIOMA} (EN, ES ou PT)
2. Tom para HOT: direto e pessoal. WARM: consultivo. COLD: surpresa/curiosidade. FROZEN: newsletter/valor
3. Para WhatsApp: máximo 3 parágrafos curtos, sem formatação markdown
4. Para Email: assunto + corpo HTML simples, máximo 150 palavras
5. Para SMS: máximo 160 caracteres, incluir link CTA
6. NUNCA mencione o motivo de perda anterior
7. Sempre inclua um CTA claro (responder, clicar em link, ou visitar loja)
8. Varie o conteúdo — nunca repita a mesma mensagem para o mesmo lead

Retorne APENAS o JSON:
{"subject": "...", "body": "...", "cta": "..."}
```

**Variações A/B**: Para cada toque, o sistema gera 2 variações e alterna aleatoriamente entre leads.

### 4. Dispatch Workers (BullMQ)

**WhatsApp Worker**:
- Rate limit: máximo 30 mensagens/minuto por sessão WAHA
- Janela de envio: 8h00–20h00 (America/New_York)
- Retry: 3 tentativas com backoff exponencial
- Se WAHA retornar erro 429 → pausa worker por 60s
- Registra `message_id` do WAHA para tracking

**Email Worker**:
- Resend batch: grupos de 100 emails por request
- Rate limit: respeitar headers X-RateLimit-Remaining da Resend
- Tracking: webhook de abertura e clique via Resend
- Bounce handling: marcar lead como `email_invalid` após hard bounce

**SMS Worker**:
- Twilio: E.164 format obrigatório (+1XXXXXXXXXX)
- Rate limit: 1 msg/seg por número Twilio (long code)
- Opt-out automático: processar STOP/CANCEL/UNSUBSCRIBE
- Apenas entre 9h00–20h00 (TCPA compliance)

### 5. Conversation Handler (Agente IA)

**Descrição**: Quando um lead responde no WhatsApp, o agente IA assume a conversa.

**Fluxo**:
1. WAHA recebe mensagem → webhook → N8N → Conversation Handler
2. Handler verifica se lead está em campanha ativa
3. Busca histórico da conversa no Supabase
4. Claude API gera resposta contextual

**Prompt System (Conversational Agent)**:
```
Você é um assistente de vendas da Florida Auto Center em Orlando, FL.
Responda como um humano empático — NÃO mencione que é IA.

CONTEXTO DO LEAD:
{HISTORICO_CONVERSA}

DADOS DO LEAD:
- Nome: {NOME}
- Segmento: {SEGMENTO}
- Histórico: {MENSAGENS_ANTERIORES}

ESTOQUE DISPONÍVEL (top 5 relevantes):
{ESTOQUE}

REGRAS:
1. Seja conversacional, não robótico
2. Responda em {IDIOMA}
3. Se o lead demonstrar interesse real → colete: nome completo, telefone, melhor horário
4. Se o lead pedir preço → redirecione para visita ou credit app
5. Se o lead disser STOP/NÃO/não quero → registre opt-out, encerre educadamente
6. Se o lead estiver pronto para comprar → retorne JSON: {"action": "handoff", "reason": "..."}
7. Máximo 3 perguntas de qualificação antes do handoff

Indicadores de handoff: "quero comprar", "quanto fica", "posso ir hoje", "vou aí", "aceita meu carro"
```

**Handoff para Chatwoot**:
- Cria contato no Chatwoot com dados completos
- Cria conversa com todo o histórico
- Atribui ao sales rep correto (round-robin ou por segmento)
- Notifica sales rep via WhatsApp pessoal: "🔥 Lead quente: [Nome] quer comprar. Veja o Chatwoot."

### 6. Analytics & Dashboard

**Métricas por campanha**:
- Enviados / Entregues / Abertos / Clicados (email)
- Enviados / Lidos (WA — via `ack` do WAHA)
- Enviados / Entregues (SMS — via Twilio status callback)
- Respondidos / Handoffs / Convertidos
- Custo estimado (tokens Claude + Twilio + Resend)

**Métricas globais**:
- Total de leads reativados por segmento
- Taxa de conversão por canal
- Melhor horário de engajamento
- Templates com melhor performance (A/B)
- ROI estimado (vendas atribuídas × ticket médio)

### 7. Compliance Guard

**Funcionalidades**:
- DNC list persistida no banco (populated from existing 11 leads)
- Opt-out automático: SMS STOP → remove da fila, atualiza banco
- Opt-out WhatsApp: detecta "não quero", "para", "stop" → remove
- Opt-out Email: unsubscribe link em todos os emails
- Janelas de horário respeitadas automaticamente pelos workers
- Log de auditoria imutável de todos os disparos
- Nunca reenviar para lead com `opted_out = true`

---

## Modelos de Dados (Supabase/PostgreSQL)

```sql
-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,          -- E.164 format: +1XXXXXXXXXX
  address TEXT,
  dob DATE,
  segment TEXT CHECK (segment IN ('HOT','WARM','COLD','FROZEN')),
  score INTEGER DEFAULT 0,
  language TEXT DEFAULT 'EN' CHECK (language IN ('EN','ES','PT')),
  status TEXT DEFAULT 'imported',
  source TEXT,
  sales_rep TEXT,
  origin_type TEXT,    -- INTERNET, WALK-IN, PHONE, etc.
  days_old INTEGER,
  credit_app BOOLEAN DEFAULT false,
  lost_reason TEXT,
  opted_out BOOLEAN DEFAULT false,
  email_valid BOOLEAN DEFAULT true,
  imported_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campanhas
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  segments TEXT[],      -- ['HOT','WARM']
  channels TEXT[],      -- ['whatsapp','email','sms']
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed','cancelled')),
  total_leads INTEGER DEFAULT 0,
  created_by TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Toques (cada envio individual)
CREATE TABLE touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  campaign_id UUID REFERENCES campaigns(id),
  channel TEXT CHECK (channel IN ('whatsapp','email','sms')),
  touch_number INTEGER,   -- 1, 2, 3...
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  -- 'scheduled','sending','sent','delivered','read','failed','bounced'
  message_subject TEXT,
  message_body TEXT,
  ab_variant TEXT,        -- 'A' ou 'B'
  external_id TEXT,       -- WAHA msg id / Resend email id / Twilio SID
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Eventos de tracking
CREATE TABLE touch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  touch_id UUID REFERENCES touches(id),
  event_type TEXT,        -- 'delivered','opened','clicked','replied','bounced'
  occurred_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

-- Conversas (quando lead responde)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  campaign_id UUID REFERENCES campaigns(id),
  channel TEXT,
  status TEXT DEFAULT 'active',  -- 'active','handed_off','closed','opted_out'
  chatwoot_id TEXT,               -- ID da conversa no Chatwoot
  assigned_rep TEXT,
  messages JSONB DEFAULT '[]',    -- [{role, content, timestamp}]
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DNC List
CREATE TABLE dnc_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT,
  email TEXT,
  reason TEXT,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT,
  entity_id UUID,
  action TEXT,
  actor TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_segment ON leads(segment);
CREATE INDEX idx_leads_opted_out ON leads(opted_out);
CREATE INDEX idx_touches_lead ON touches(lead_id);
CREATE INDEX idx_touches_status ON touches(status);
CREATE INDEX idx_touches_scheduled ON touches(scheduled_at);
CREATE INDEX idx_conversations_lead ON conversations(lead_id);
```

---

## Autenticação e Autorização

**Método**: NextAuth.js v5 + Supabase Auth
**Roles**:
- `admin` (Antonio): acesso total — campanhas, leads, config, métricas
- `sales_rep`: acesso ao Chatwoot apenas (via Chatwoot nativo, não pelo dashboard)

**Sessão**: JWT com refresh automático, expira em 7 dias

---

## Segurança

- [ ] HTTPS via Nginx + Let's Encrypt
- [ ] API Keys em variáveis de ambiente (nunca no código)
- [ ] WAHA protegido com `X-Api-Key`
- [ ] Rate limiting nas rotas de API com `upstash/ratelimit`
- [ ] Webhook signature verification (WAHA HMAC, Twilio signature, Resend)
- [ ] Sanitização de inputs com Zod em todas as rotas
- [ ] Logs não expõem dados pessoais (mascarar email/telefone)
- [ ] TCPA compliance para SMS (apenas 9h-20h, opt-out imediato)

---

## Performance

- API response: < 200ms para rotas de dashboard
- Importação de 8.000 leads: < 30s
- Disparo de campanha: workers processam em background, sem bloquear UI
- BullMQ concurrency: 5 workers paralelos por canal
- Redis TTL para cache de respostas do Claude: 1h (mesmo prompt, mesma resposta)
- Supabase connection pooling: PgBouncer via Supabase

---

## Integrações — Detalhes Técnicos

### WAHA
- **URL base**: `http://localhost:3000` (ou IP da VPS)
- **Auth**: `X-Api-Key: {WAHA_API_KEY}`
- **Engine recomendada**: NOWEB (menor uso de recursos)
- **Eventos webhook relevantes**: `message`, `message.ack`, `session.status`
- **Gotcha crítico**: Duplicate webhook no primeiro contato de novo sender (GOWS/PLUS) → implementar dedup por `payload.id` no handler
- **Rate limit recomendado**: 30 msg/min para evitar ban do WhatsApp
- **Config de sessão**:
```json
{
  "name": "fac-main",
  "config": {
    "webhooks": [{
      "url": "https://seu-dominio.com/api/webhooks/waha",
      "events": ["message", "message.ack"],
      "hmac": { "key": "{WAHA_HMAC_KEY}" },
      "retries": { "policy": "linear", "delaySeconds": 3, "attempts": 5 }
    }]
  }
}
```

### Resend
- **SDK**: `resend` npm package
- **Batch**: até 100 emails por request via `resend.batch.send([])`
- **Rate limit**: 10 req/s no plano Pro; usar queue + retry com backoff
- **Tracking**: configurar webhooks para `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`
- **Domain**: verificar domínio `floridautocenter.com` no painel Resend
- **From**: `"Florida Auto Center <noreply@floridautocenter.com>"`

### Twilio
- **SDK**: `twilio` npm package
- **Format**: E.164 obrigatório — `+1` + 10 dígitos
- **Long Code throughput**: ~1 msg/seg; usar Messaging Service para pool de números
- **TCPA**: apenas 9h00-20h00 recipient's timezone (America/New_York para FL)
- **Opt-out**: processar webhook `STOP` automaticamente, responder "You've been unsubscribed"
- **Status callback**: `https://seu-dominio.com/api/webhooks/twilio`

### Claude API
- **Model**: `claude-sonnet-4-6` (melhor custo-benefício)
- **Max tokens output**: 500 (mensagens curtas)
- **Temperature**: 0.7 (variação criativa mantendo coerência)
- **Cache**: prompts do sistema em cache por 1h no Redis
- **Custo estimado**: ~$0.003 por mensagem gerada (3M input + 500 output tokens)

### N8N
- **Uso**: webhooks de entrada (WAHA → N8N → Conversation Handler)
- **Workflows relevantes**:
  1. `waha-message-received`: recebe webhook WAHA, chama Conversation Handler
  2. `campaign-scheduler`: trigger diário para verificar toques pendentes
  3. `handoff-notifier`: notifica sales rep no WhatsApp pessoal
- **N8N já configurado na VPS** — apenas adicionar workflows

### Chatwoot
- **Auth**: API Access Token via header `api_access_token`
- **Criar contato**: `POST /api/v1/accounts/{id}/contacts`
- **Criar conversa**: `POST /api/v1/accounts/{id}/conversations`
- **Assign**: `POST /api/v1/accounts/{id}/conversations/{id}/assignments`
- **Já configurado** — apenas integrar via API

---

## Observabilidade

### Logging
- **Biblioteca**: Pino (JSON estruturado)
- **Nível produção**: `info`
- **O que logar**:
  - Cada toque enviado: `{lead_id, channel, touch_number, status}`
  - Erros de dispatch: `{lead_id, channel, error, retry_count}`
  - Handoffs: `{lead_id, conversation_id, assigned_rep}`
  - Opt-outs: `{lead_id, channel, trigger}`

### Alertas (via WhatsApp para Antonio)
- Worker de disparo parado por > 5 minutos
- Taxa de erro > 10% numa hora
- Sessão WAHA desconectada
- Handoff sem sales rep disponível

### Métricas no Dashboard
- Gráfico de disparos por hora/dia
- Funil: enviado → entregue → lido → respondeu → handoff → vendeu
- Taxa de opt-out por campanha
- Performance A/B dos templates

---

## Variáveis de Ambiente

```env
# App
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://seu-dominio.com

# Supabase
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Redis (BullMQ)
REDIS_URL=redis://localhost:6379

# WAHA
WAHA_BASE_URL=http://localhost:3000
WAHA_API_KEY=
WAHA_HMAC_KEY=
WAHA_SESSION_NAME=fac-main

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@floridautocenter.com
RESEND_FROM_NAME=Florida Auto Center

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_MESSAGING_SERVICE_SID=

# Claude
ANTHROPIC_API_KEY=

# Chatwoot
CHATWOOT_BASE_URL=
CHATWOOT_API_TOKEN=
CHATWOOT_ACCOUNT_ID=

# N8N
N8N_WEBHOOK_SECRET=

# Business
DEALERSHIP_TIMEZONE=America/New_York
WHATSAPP_SEND_WINDOW_START=8   # 8am
WHATSAPP_SEND_WINDOW_END=20    # 8pm
SMS_SEND_WINDOW_START=9        # 9am (TCPA)
SMS_SEND_WINDOW_END=20         # 8pm
WA_MAX_PER_MINUTE=30
```

---

## Casos de Borda e Tratamento de Erros

1. **WAHA desconectado**: worker detecta, pausa campanha, alerta Antonio via WA pessoal
2. **Lead sem email**: skip canal email, continua WA+SMS
3. **Lead sem telefone válido**: skip WA+SMS, usa apenas email
4. **Bounce de email**: marcar `email_valid=false`, não tentar novamente
5. **SMS STOP recebido**: opt-out imediato, responder "Unsubscribed. Reply START to resubscribe."
6. **Claude API timeout**: usar template fallback hardcoded, logar para revisão
7. **Lead com `status=SOLD`**: skip automático na importação
8. **Resposta durante horário fora da janela**: enfileirar resposta, processar no próximo período
9. **Webhook WAHA duplicado** (primeiro contato): dedup por `payload.id` antes de processar
10. **BullMQ job falhando**: max 3 retries, então mover para dead letter queue e alertar

---

## Roadmap e Fases

### Fase 1: Fundação (Plano 001)
Setup do projeto, Docker, banco de dados, auth básico

### Fase 2: Banco de Dados (Plano 002)
Schema Prisma, migrations, seeds com dados reais

### Fase 3: Lead Engine (Plano 003)
Parser XLSX, deduplicação, segmentação, API de leads

### Fase 4: Campaign Manager (Plano 004)
Criação de campanhas, seleção de segmentos, preview

### Fase 5: Dispatch Workers (Plano 005)
BullMQ setup, workers WA/Email/SMS, rate limiting, retry

### Fase 6: AI Copywriter (Plano 006)
Integração Claude API, prompts, cache, geração de mensagens

### Fase 7: Webhooks & Tracking (Plano 007)
Recebimento de webhooks WAHA/Resend/Twilio, tracking de status

### Fase 8: Conversation Handler (Plano 008)
Agente IA conversacional, handoff para Chatwoot

### Fase 9: Dashboard UI (Plano 009)
Next.js dashboard completo: leads, campanhas, métricas

### Fase 10: N8N Workflows (Plano 010)
Configuração dos workflows N8N de orquestração

### Fase 11: Compliance & Observabilidade (Plano 011)
DNC, opt-outs, alertas, audit log

### Fase 12: Deploy & Produção (Plano 012)
Docker Compose, Nginx, SSL, deploy na VPS

---

## Notas Técnicas

### Decisões Técnicas Importantes
1. **BullMQ sobre N8N para dispatching**: N8N é ótimo para orquestração, mas BullMQ dá controle fino sobre rate limiting, retry e concurrency necessários para 7.850 disparos
2. **Resend sobre SendGrid**: API mais simples, batch nativo de 100, melhor deliverabilidade, já é o provider atual
3. **WAHA engine NOWEB**: menor uso de CPU/RAM que WEBJS, sem browser headless
4. **Prisma sobre Drizzle**: melhor integração com Supabase e ecosystem Next.js
5. **Claude Sonnet 4.6**: melhor custo-benefício para geração de copy; Opus seria overkill

### Riscos e Mitigações
- **Ban do WhatsApp**: rate limit de 30msg/min + warm-up gradual (começar com 10/min)
- **Spam filters de email**: verificar SPF/DKIM/DMARC no domínio antes de escalar
- **Custo Claude API**: cache de prompts no Redis, templates fallback para campanhas em massa
- **TCPA violations (SMS)**: janelas de horário hard-coded, opt-out imediato obrigatório

---

## Funcionalidades Complementares (adicionadas após revisão)

### 8. Analytics Engine (Plano 013)

**Descrição**: Motor de análise automática que vai além da visualização — detecta padrões, determina vencedores A/B e sugere ajustes de cadência.

**Componentes**:
- **A/B Analyzer**: compara taxa de reply/handoff entre variante A e B. Declara vencedor com 10%+ de lift e mínimo 100 amostras por variante.
- **Best Time Detector**: agrupa eventos (opened, replied) por hora+dia da semana. Identifica slots de maior engajamento por canal e segmento.
- **Cadence Adjuster**: gera sugestões de ajuste de horário dos toques. Admin aprova antes de aplicar.
- **AI Insights Report**: job semanal que envia métricas para Claude gerar relatório executivo em PT, enviado via WhatsApp para Antonio.

**Tabelas adicionais**: `ab_results`, `best_times`, `cadence_suggestions`

**Job schedule**: roda às 2h todo dia (fora janela de disparos)

### 9. Super Lista HOT — 1.144 Leads Priority (Plano 014)

**Descrição**: Campanha cirúrgica dedicada aos 1.144 leads que já completaram o Credit App mas não compraram. Maior potencial de retorno imediato.

**Dados**:
- 1.144 leads com `credit_app = true AND status != SOLD`
- Conversão histórica: 20,9% → potencial de ~239 vendas
- Score: +30 pontos sobre o segmento base

**Cadência dedicada (3 dias, não 7)**:
- Dia 0 manhã → WhatsApp (intro exclusiva)
- Dia 0 tarde → Email (oferta especial)
- Dia 1 → SMS (urgência 48h)
- Dia 3 → WhatsApp + **escalonamento imediato para sales rep** (não espera dia 7)

**Tom**: nunca mencionar que já fizeram o credit app — abordagem como oportunidade nova.

**Tag no banco**: `super_hot` (array de tags no modelo Lead)

### 10. Meta Ads Export — Custom Audience FROZEN (Plano 015)

**Descrição**: Exportação dos 3.873 leads FROZEN em CSV hasheado (SHA-256) compatível com Meta Ads Manager para campanha de retargeting.

**Fluxo**:
1. Admin clica "Exportar para Meta Ads" no dashboard
2. Sistema gera CSV com email/phone hasheados + dados demográficos
3. Admin faz upload manual no Meta Ads Manager (5 minutos)
4. Meta cruza com contas FB/Instagram → ~2.700 pessoas alcançadas
5. Campanha de retargeting com $5-10/dia por 30 dias

**Complementa**: os disparos orgânicos via WA/Email/SMS — mantém FAC no radar de quem não engaja nos outros canais.

**Documentação incluída**: `docs/meta-ads-guide.md` com passo a passo completo.

---

## Roadmap Atualizado (15 Planos)

### Fase 1–9: Core System
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009

### Fase 10–12: Integração e Deploy
010 (N8N) → 011 (Compliance) → 012 (Deploy)

### Fase 13–15: Otimização e Escala
013 (Analytics Engine) → 014 (Super Lista HOT) → 015 (Meta Ads Export)

---

## Cobertura Total da Estratégia

| Elemento da Estratégia | Plano(s) |
|------------------------|---------|
| Segmentação HOT/WARM/COLD/FROZEN | 003 |
| Agente Classificador | 003 |
| Agente Copywriter (IA) | 006 |
| Agente Dispatcher (WA+Email+SMS) | 005 |
| Agente Conversacional | 008 |
| Agente Analytics | 013 ← novo |
| Agente Compliance | 011 |
| Cadências por segmento | 004 |
| Super Lista HOT (1.144 credit app) | 014 ← novo |
| Meta Ads Custom Audience FROZEN | 015 ← novo |
| Dashboard completo | 009 |
| Handoff Chatwoot | 008 |
| Notificação sales rep | 008, 010 |
| Deploy produção VPS | 012 |
