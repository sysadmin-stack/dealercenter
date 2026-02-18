# Plano 004: Campaign Manager — CRUD Campanhas + Cadências

## Objetivo
Implementar criação, gestão e controle de campanhas multicanal com cadências pré-configuradas por segmento. O sistema deve calcular quantos leads serão atingidos e enfileirar os toques no BullMQ.

## Dependências
- [x] Plano 003: Lead Engine

## Escopo

### O Que Está Incluído
- CRUD de campanhas via API
- Seleção de segmentos e canais
- Preview: X leads elegíveis antes de ativar
- Enfileiramento de toques no BullMQ ao ativar campanha
- Controles: pausar, retomar, cancelar
- Cadências padrão por segmento (configuráveis)
- API: CRUD /api/campaigns

### O Que NÃO Está Incluído
- Dispatch real (Plano 005)
- UI (Plano 009)

## Tarefas

1. **Cadence config**
   - Arquivo: `src/lib/config/cadences.ts`
   - Define os toques por segmento (dia, canal, template_type)

2. **Campaign service**
   - Arquivo: `src/lib/services/campaign-service.ts`
   - `createCampaign()`, `previewCampaign()`, `activateCampaign()`, `pauseCampaign()`

3. **Touch scheduler**
   - Arquivo: `src/lib/services/touch-scheduler.ts`
   - Ao ativar campanha: gera todos os Touch records com `scheduled_at` calculado
   - Enfileira jobs na BullMQ com delay

4. **API Routes**
   - Arquivo: `src/app/api/campaigns/route.ts`
   - Arquivo: `src/app/api/campaigns/[id]/route.ts`
   - Arquivo: `src/app/api/campaigns/[id]/preview/route.ts`
   - Arquivo: `src/app/api/campaigns/[id]/actions/route.ts` (activate/pause/resume/cancel)

5. **BullMQ queue definitions**
   - Arquivo: `src/lib/queue.ts`
   - Queues: `whatsapp-dispatch`, `email-dispatch`, `sms-dispatch`
   - Job data type: `{touchId, leadId, campaignId, channel, scheduledAt}`

## Critérios de Verificação
- [ ] POST /api/campaigns cria campanha
- [ ] GET /api/campaigns/:id/preview retorna contagem correta de leads elegíveis
- [ ] POST /api/campaigns/:id/actions com `{action: "activate"}` gera Touch records
- [ ] Touch records criados com `scheduled_at` correto para cada toque da cadência
- [ ] Jobs enfileirados no BullMQ (verificar via Redis CLI: `LLEN bull:whatsapp-dispatch:wait`)

## Notas Técnicas

### Cadence Config
```ts
export const CADENCES = {
  HOT: [
    { day: 0, channel: 'whatsapp', hour: 9,  templateType: 'personal_intro' },
    { day: 0, channel: 'email',    hour: 14, templateType: 'stock_offer' },
    { day: 2, channel: 'sms',      hour: 10, templateType: 'short_followup' },
    { day: 6, channel: 'whatsapp', hour: 10, templateType: 'last_touch' },
  ],
  WARM: [
    { day: 0,  channel: 'email',    hour: 9,  templateType: 'reintroduction' },
    { day: 3,  channel: 'whatsapp', hour: 10, templateType: 'value_message' },
    { day: 9,  channel: 'email',    hour: 9,  templateType: 'social_proof' },
    { day: 20, channel: 'sms',      hour: 10, templateType: 'last_touch' },
  ],
  COLD: [
    { day: 0,  channel: 'email',    hour: 9, templateType: 'reintroduction' },
    { day: 6,  channel: 'whatsapp', hour: 10, templateType: 'pattern_break' },
    { day: 19, channel: 'email',    hour: 9, templateType: 'special_offer' },
  ],
  FROZEN: [
    { day: 0, channel: 'email',    hour: 9, templateType: 'newsletter' },
    { day: 7, channel: 'whatsapp', hour: 10, templateType: 'single_reactivation' },
  ],
}
```
