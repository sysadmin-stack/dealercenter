# Plano 013: Analytics Engine — A/B Analysis, Best Time, Auto-Adjust

## Objetivo
Implementar o motor de analytics que vai além da visualização: analisa automaticamente qual variante A/B performa melhor, detecta os melhores horários de engajamento por segmento/canal, e ajusta parâmetros das cadências futuras com base nos dados reais acumulados.

## Dependências
- [x] Plano 007: Webhooks & Tracking (eventos no banco)
- [x] Plano 009: Dashboard UI (para exibir resultados)

## Escopo

### O Que Está Incluído
- Motor A/B: análise estatística de variante A vs B por canal e segmento
- Best Time Detector: identifica janelas de maior engajamento (abertura/resposta) por canal
- Auto-Adjust: atualiza parâmetros de cadência com base nos resultados
- Relatório semanal automático gerado por Claude (insights em linguagem natural)
- API: GET /api/analytics/ab-results, GET /api/analytics/best-times, GET /api/analytics/summary
- Job agendado: roda análise diariamente às 2h (fora do horário de disparos)

### O Que NÃO Está Incluído
- Machine learning complexo (usar estatística simples: taxas de conversão, chi-squared)
- Mudança automática de templates sem aprovação do admin (sugestão, não execução)

## Tarefas

1. **A/B Analysis Service**
   - Arquivo: `src/lib/services/ab-analyzer.ts`
   - Para cada campanha ativa: agrupa touches por `ab_variant` (A/B)
   - Calcula: open rate, reply rate, handoff rate por variante
   - Determina vencedor com significância mínima de 100 envios por variante
   - Persiste resultado: `{campaign_id, channel, segment, winner, confidence, sample_size}`

   ```ts
   // Lógica de decisão
   function determineWinner(variantA: VariantMetrics, variantB: VariantMetrics): ABResult {
     if (variantA.sampleSize < 100 || variantB.sampleSize < 100) {
       return { winner: null, reason: 'insufficient_data' }
     }
     const aRate = variantA.replies / variantA.sent
     const bRate = variantB.replies / variantB.sent
     const lift = Math.abs(aRate - bRate) / Math.min(aRate, bRate)
     if (lift < 0.1) return { winner: null, reason: 'no_significant_difference' }
     return { winner: aRate > bRate ? 'A' : 'B', lift, confidence: 0.95 }
   }
   ```

2. **Best Time Detector**
   - Arquivo: `src/lib/services/best-time-detector.ts`
   - Agrupa `touch_events` (opened, replied) por hora do dia e dia da semana
   - Calcula taxa de engajamento por slot (ex: Terça 10h → 32% open rate)
   - Output: `{channel, segment, bestHour: 10, bestDayOfWeek: 2, engagementRate: 0.32}`
   - Salva no banco para o dashboard exibir e para o scheduler usar

3. **Auto-Adjust Service**
   - Arquivo: `src/lib/services/cadence-adjuster.ts`
   - Lê resultados do Best Time Detector
   - Gera sugestão de ajuste de cadência: `{segment, channel, currentHour: 9, suggestedHour: 10}`
   - **NÃO aplica automaticamente** — salva como sugestão pendente para admin aprovar no dashboard
   - Admin aprova → atualiza `CADENCES` config no banco

4. **AI Insights Report**
   - Arquivo: `src/lib/services/insights-reporter.ts`
   - Job semanal (toda segunda às 7h) que chama Claude API
   - Envia métricas da semana para Claude gerar relatório em PT
   - Prompt:
   ```
   Analise estes dados de campanha de reativação de leads automotivos e gere um relatório executivo em português com: 
   1. Performance geral (3 parágrafos)
   2. Top 3 insights acionáveis
   3. Recomendações para a próxima semana
   
   Dados: {JSON com métricas}
   
   Seja direto, use números concretos, evite jargões.
   ```
   - Envia relatório via WhatsApp para Antonio + salva no banco

5. **Analytics API Routes**
   - Arquivo: `src/app/api/analytics/ab-results/route.ts`
   - Arquivo: `src/app/api/analytics/best-times/route.ts`
   - Arquivo: `src/app/api/analytics/daily-summary/route.ts` (usado pelo N8N workflow)
   - Arquivo: `src/app/api/analytics/suggestions/route.ts` (GET sugestões, POST aprovar)

6. **Scheduled job**
   - Arquivo: `src/workers/analytics-worker.ts`
   - BullMQ repeatable job: `{ repeat: { cron: '0 2 * * *' } }` (2h todo dia)
   - Executa: A/B analysis → Best Time → salva sugestões

## Critérios de Verificação
- [ ] Após 100+ toques por variante: A/B analysis retorna vencedor
- [ ] Best times calculados corretamente (testar com dados simulados)
- [ ] Sugestão de ajuste aparece no dashboard
- [ ] Relatório semanal gerado e enviado via WhatsApp
- [ ] Job agendado roda às 2h sem interferir nos dispatches

## Notas Técnicas

### Tabelas adicionais necessárias (adicionar à migration)
```sql
CREATE TABLE ab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  channel TEXT,
  segment TEXT,
  winner TEXT,  -- 'A', 'B', ou NULL
  lift FLOAT,
  sample_size_a INTEGER,
  sample_size_b INTEGER,
  rate_a FLOAT,
  rate_b FLOAT,
  analyzed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE best_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT,
  segment TEXT,
  best_hour INTEGER,
  best_day_of_week INTEGER,
  engagement_rate FLOAT,
  sample_size INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cadence_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment TEXT,
  channel TEXT,
  touch_number INTEGER,
  current_hour INTEGER,
  suggested_hour INTEGER,
  reason TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Gotchas Conhecidos
- Dados insuficientes no início: analytics engine deve ter fallback gracioso — não gerar sugestões com menos de 50 eventos por slot
- Chi-squared vs taxa simples: para o volume desta campanha, taxa simples com threshold de 10% de lift é suficiente
- Horário dos eventos: sempre salvar e analisar em America/New_York, não UTC
