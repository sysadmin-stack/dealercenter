# Plano 010: N8N Workflows

## Objetivo
Configurar os workflows N8N na instância já existente para orquestrar: recebimento de mensagens WAHA, notificações de handoff e monitoramento de saúde dos workers.

## Dependências
- [x] Plano 008: Conversation Handler
- [x] Plano 007: Webhooks

## Tarefas (configuração no N8N, não código)

1. **Workflow: waha-message-received**
   - Trigger: Webhook Node (recebe do WAHA)
   - Filter: apenas mensagens de leads (não de grupos)
   - HTTP Request: POST /api/n8n/conversation com dados do lead
   - Error handling: notificar Antonio se falhar

2. **Workflow: handoff-notifier**
   - Trigger: Webhook Node (recebido da app quando handoff criado)
   - WhatsApp: enviar mensagem para sales rep via WAHA
   - Mensagem: "🔥 Lead quente: [Nome] — [Resumo]. Chatwoot: [link]"

3. **Workflow: health-monitor**
   - Trigger: Schedule (a cada 5 minutos)
   - HTTP Request: GET /api/health
   - Se falhar: notificar Antonio via WhatsApp

4. **Workflow: daily-report**
   - Trigger: Schedule (diário às 8h)
   - HTTP Request: GET /api/analytics/daily-summary
   - WhatsApp: enviar relatório para Antonio

5. **Documentação dos workflows**
   - Arquivo: `docs/n8n-workflows.md`
   - JSON export de cada workflow para reimportar se necessário

## Critérios de Verificação
- [ ] Workflow waha-message-received acionado quando lead responde
- [ ] Sales rep recebe notificação WhatsApp em < 30s após handoff
- [ ] Health monitor detecta falha e notifica
- [ ] Relatório diário enviado às 8h
