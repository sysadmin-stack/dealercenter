# Plano 006: AI Copywriter — Claude API + Cache + A/B

## Objetivo
Implementar o serviço de geração de mensagens personalizadas usando Claude API, com cache Redis para evitar chamadas duplicadas, geração de variações A/B e fallback templates.

## Dependências
- [x] Plano 002: Banco de Dados
- [x] Plano 005: Dispatch Workers (para integrar)

## Tarefas

1. **Copywriter service**
   - Arquivo: `src/lib/services/copywriter.ts`
   - Função: `generateMessage(lead, touchConfig): Promise<{subject, body, variant}>`
   - Integra Claude API com prompt do PRD
   - Cache: Redis com TTL 1h, key = hash(lead_id + touch_config)
   - Fallback: se Claude falhar, usa template hardcoded

2. **Prompt templates**
   - Arquivo: `src/lib/prompts/copywriter.ts`
   - System prompt para copywriter
   - System prompt para agente conversacional
   - Templates fallback por segmento + canal + idioma

3. **A/B variant logic**
   - Gera 2 variantes (A e B) por lead
   - Alterna com base em lead_id (par=A, ímpar=B)
   - Registra variant no banco para analytics

4. **Claude client**
   - Arquivo: `src/lib/clients/claude.ts`
   - Wrapper para `@anthropic-ai/sdk`
   - Handle rate limits e erros
   - Model: `claude-sonnet-4-6`

5. **Fallback templates**
   - Arquivo: `src/lib/templates/fallback.ts`
   - Templates EN/ES/PT por canal e segmento
   - Usados quando Claude API falha ou timeout

## Critérios de Verificação
- [ ] `generateMessage()` retorna mensagem válida para cada canal
- [ ] Cache funciona (segunda chamada com mesmos params não bate na API)
- [ ] Fallback ativa quando Claude está fora do ar (simular com API key inválida)
- [ ] Mensagens em PT/ES/EN geradas corretamente por idioma
- [ ] Tokens usados logados para controle de custo
