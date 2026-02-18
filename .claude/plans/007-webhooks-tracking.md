# Plano 007: Webhooks & Tracking — WAHA/Resend/Twilio

## Objetivo
Implementar os endpoints de webhook para receber eventos de entrega e resposta dos 3 canais, atualizar status dos toques e acionar o Conversation Handler quando um lead responde.

## Dependências
- [x] Plano 005: Dispatch Workers

## Tarefas

1. **WAHA webhook handler**
   - Arquivo: `src/app/api/webhooks/waha/route.ts`
   - Verifica HMAC signature
   - Eventos: `message` (lead respondeu) → dispara conversation handler
   - Eventos: `message.ack` → atualiza status do toque (delivered/read)
   - Dedup: checar `payload.id` para evitar duplicatas (bug WAHA first contact)

2. **Resend webhook handler**
   - Arquivo: `src/app/api/webhooks/resend/route.ts`
   - Eventos: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`
   - Atualiza `touch_events` e `touches.status`
   - Bounce → marca lead `email_valid=false`

3. **Twilio webhook handler**
   - Arquivo: `src/app/api/webhooks/twilio/route.ts`
   - Verifica Twilio signature
   - Status callbacks: `delivered`, `failed`, `undelivered`
   - Opt-out automático: detectar STOP → `opted_out=true` + responder

4. **Tracking service**
   - Arquivo: `src/lib/services/tracking.ts`
   - `recordEvent(touchId, eventType, metadata)`
   - Atualiza `Touch.status` e cria `TouchEvent`

5. **Conversation trigger**
   - Arquivo: `src/lib/services/conversation-trigger.ts`
   - Quando WAHA recebe mensagem de lead → verifica se está em campanha ativa
   - Se sim: dispara conversation handler (via N8N webhook ou diretamente)

## Critérios de Verificação
- [ ] WAHA webhook recebe evento e atualiza toque (testar com webhook.site)
- [ ] Resend webhook atualiza status de abertura
- [ ] Twilio STOP processa opt-out e atualiza banco
- [ ] Dedup WAHA: dois webhooks idênticos processam apenas uma vez
- [ ] `touch_events` tem registro para cada evento recebido
