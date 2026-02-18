# Plano 005: Dispatch Workers — BullMQ + WA/Email/SMS

## Objetivo
Implementar os 3 workers de disparo (WhatsApp, Email, SMS) com BullMQ, incluindo rate limiting, retry com backoff, respeito de janelas de horário e integração real com WAHA/Resend/Twilio.

## Dependências
- [x] Plano 004: Campaign Manager (queues definidas)
- [x] Plano 006: AI Copywriter (para gerar mensagens) — **ATENÇÃO: implementar stub primeiro, integrar real depois**

## Escopo

### O Que Está Incluído
- WhatsApp worker (WAHA API)
- Email worker (Resend batch)
- SMS worker (Twilio)
- Rate limiting por canal
- Janelas de horário
- Retry com exponential backoff
- Atualização de status dos toques
- Worker process separado (não no Next.js server)

### O Que NÃO Está Incluído
- Geração de mensagens com IA (usa stub no início, depois integra Plano 006)
- Webhooks de resposta (Plano 007)

## Tarefas

1. **Worker process entry point**
   - Arquivo: `src/workers/index.ts`
   - Inicia todos os workers
   - Arquivo: `Dockerfile.worker` (processo separado)

2. **WhatsApp worker**
   - Arquivo: `src/workers/whatsapp-worker.ts`
   - WAHA: `POST /api/sendText` com `{session, chatId, text}`
   - Rate limit: token bucket 30/min
   - Verifica janela: 8h-20h ET
   - Dedup: verificar se touch já foi enviado

3. **Email worker**
   - Arquivo: `src/workers/email-worker.ts`
   - Resend batch: agrupar até 100 emails, `resend.batch.send([])`
   - Tracking: incluir tag campaign_id + lead_id
   - Rate limit: 10 req/s

4. **SMS worker**
   - Arquivo: `src/workers/sms-worker.ts`
   - Twilio: `client.messages.create({to, from, body, statusCallback})`
   - Phone format: garantir E.164 antes de enviar
   - Janela TCPA: 9h-20h ET
   - Rate limit: 1/seg por número

5. **WAHA client**
   - Arquivo: `src/lib/clients/waha.ts`
   - Wrapper tipado para WAHA API
   - Check sessão ativa antes de enviar
   - Handle errors: 401, 429, 500

## Critérios de Verificação
- [ ] Worker process inicia sem erros (`ts-node src/workers/index.ts`)
- [ ] Job de WhatsApp enviado para lead de teste via WAHA
- [ ] Job de Email enviado via Resend (verificar inbox)
- [ ] Job de SMS enviado via Twilio (verificar número de teste)
- [ ] Rate limits respeitados (log de throttling)
- [ ] Toque fora da janela de horário: reagendado para próximo período
- [ ] Retry funciona após falha simulada

## Notas Técnicas

### WAHA Send
```ts
const response = await fetch(`${WAHA_BASE_URL}/api/sendText`, {
  method: 'POST',
  headers: {
    'X-Api-Key': WAHA_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session: WAHA_SESSION_NAME,
    chatId: `${phoneNumber}@c.us`, // sem + e sem @c.us no número
    text: message
  })
})
```

### Resend Batch
```ts
const resend = new Resend(RESEND_API_KEY)
const results = await resend.batch.send(emails.map(e => ({
  from: RESEND_FROM,
  to: e.email,
  subject: e.subject,
  html: e.body,
  tags: [{ name: 'campaign', value: campaignId }, { name: 'lead', value: leadId }]
})))
```

### Gotchas Conhecidos
- WAHA chatId: `5511999999999@c.us` (sem +, adicionar @c.us)
- WAHA rate: 30/min é conservador; começar com 10/min na primeira semana
- Resend batch: não suporta `attachments` e `tags` na mesma call ainda (verificar docs atuais)
- Twilio: long code tem throughput ~1/seg; usar Messaging Service para pooling
- BullMQ: usar `removeOnComplete: true` para não acumular jobs no Redis
