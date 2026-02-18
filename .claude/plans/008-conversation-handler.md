# Plano 008: Conversation Handler — Agente IA + Handoff Chatwoot

## Objetivo
Implementar o agente conversacional que responde leads via WhatsApp usando Claude API, qualifica o interesse e faz handoff para o Chatwoot com histórico completo quando detecta intenção de compra.

## Dependências
- [x] Plano 006: AI Copywriter (Claude client)
- [x] Plano 007: Webhooks (para ser acionado)

## Tarefas

1. **Conversation service**
   - Arquivo: `src/lib/services/conversation-service.ts`
   - `handleIncomingMessage(leadId, message, channel)`
   - Busca/cria conversa no banco
   - Adiciona mensagem ao histórico
   - Chama Claude para gerar resposta
   - Envia resposta via WAHA
   - Detecta keywords de handoff

2. **Handoff service**
   - Arquivo: `src/lib/services/handoff-service.ts`
   - Cria contato no Chatwoot
   - Cria conversa com histórico completo
   - Atribui ao sales rep (round-robin entre ativos)
   - Notifica sales rep via WhatsApp pessoal

3. **Chatwoot client**
   - Arquivo: `src/lib/clients/chatwoot.ts`
   - `createContact()`, `createConversation()`, `assignAgent()`, `sendMessage()`

4. **Opt-out handler**
   - Arquivo: `src/lib/services/optout-service.ts`
   - Detecta intenção de opt-out em qualquer idioma
   - PT: "não quero", "para", "chega", "sair"
   - ES: "no quiero", "para", "salir"
   - EN: "stop", "unsubscribe", "don't contact", "remove me"

5. **N8N integration** (alternativo ao trigger direto)
   - Arquivo: `src/app/api/n8n/conversation/route.ts`
   - Endpoint que N8N chama quando WAHA recebe mensagem
   - Permite orquestração adicional via N8N

## Critérios de Verificação
- [ ] Lead responde WhatsApp → agente responde em < 10s
- [ ] Histórico de conversa mantido corretamente
- [ ] Keyword de compra → handoff criado no Chatwoot
- [ ] Sales rep recebe notificação WhatsApp com link do Chatwoot
- [ ] Opt-out em PT/ES/EN → banco atualizado, resposta educada enviada
- [ ] Conversa no Chatwoot tem histórico completo da conversa anterior
