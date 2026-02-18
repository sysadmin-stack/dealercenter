# Plano 011: Compliance & Observabilidade

## Objetivo
Implementar DNC list completa, opt-outs em todos os canais, logs estruturados, alertas via WhatsApp e audit trail imutável.

## Dependências
- [x] Plano 007: Webhooks

## Tarefas

1. **DNC service completo**
   - Arquivo: `src/lib/services/dnc-service.ts`
   - `checkDNC(phone, email): boolean`
   - `addToDNC(phone, email, reason)`
   - Pre-flight check antes de cada disparo

2. **Opt-out processor**
   - Arquivo: `src/lib/services/optout-processor.ts`
   - SMS STOP → update banco + Twilio response
   - WA opt-out → update banco + resposta educada
   - Email unsubscribe → link em todos os emails

3. **Pino logger setup**
   - Arquivo: `src/lib/logger.ts`
   - JSON estruturado em produção
   - Pretty print em dev
   - Mascarar email/telefone nos logs

4. **Alert service**
   - Arquivo: `src/lib/services/alert-service.ts`
   - `sendAlert(message)` → WhatsApp para Antonio
   - Alertas: worker parado, taxa de erro alta, WAHA desconectado

5. **Audit log**
   - Arquivo: `src/lib/services/audit-service.ts`
   - `log(entityType, entityId, action, actor, metadata)`
   - Inserção direta no banco (nunca atualizar, apenas inserir)

## Critérios de Verificação
- [ ] DNC check bloqueia envio para leads na lista
- [ ] SMS STOP processado em < 5s, banco atualizado
- [ ] Logs JSON em produção (verificar `docker logs`)
- [ ] Alerta chega no WhatsApp quando worker para
- [ ] Audit log tem registro de todas as ações de campanha
