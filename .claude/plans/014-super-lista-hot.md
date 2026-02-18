# Plano 014: Super Lista HOT — Campanha Prioritária para 1.144 Leads com Credit App

## Objetivo
Criar uma campanha cirúrgica separada para os 1.144 leads que já completaram o Credit App mas não compraram. Este grupo tem taxa de conversão histórica de 20,9% — o maior potencial de retorno imediato de toda a base. Merece cadência própria, mais agressiva e com contato humano mais rápido.

## Contexto dos Dados
- **Total identificado**: 1.144 leads com `credit_app = true` e `status != SOLD`
- **Distribuição**: 48 HOT + 365 WARM + 542 COLD + 737 FROZEN (com credit_app completo)
- **Conversão histórica**: 20,9% (vs 5,7% sem credit app)
- **Potencial**: ~239 vendas se a taxa histórica se mantiver
- **Diferencial**: esses leads já provaram intenção alta — o problema foi timing ou proposta

## Dependências
- [x] Plano 003: Lead Engine (query para identificar o grupo)
- [x] Plano 004: Campaign Manager (criar tipo de campanha especial)

## Escopo

### O Que Está Incluído
- Query e tag especial `super_hot` para os 1.144 leads
- Cadência dedicada mais agressiva (mais toques, mais rápida)
- Templates específicos que aludem ao interesse anterior SEM mencionar o motivo da perda
- Escalonamento mais rápido para contato humano (dia 3, não dia 7)
- Score diferenciado: +30 bonus sobre o score atual
- API: endpoint para buscar leads `super_hot`
- Seed automático: ao importar leads, identificar e marcar esse grupo

### O Que NÃO Está Incluído
- Nova infraestrutura — usa os mesmos workers e dispatch do Plano 005

## Tarefas

1. **Query e marcação do grupo**
   - Arquivo: `src/lib/services/super-hot-tagger.ts`
   - Identifica leads com `credit_app = true AND status != 'sold' AND opted_out = false`
   - Adiciona campo `tags: ['super_hot']` no modelo Lead (array de strings)
   - Roda automaticamente após cada importação de leads
   - Adicionar coluna ao schema: `tags TEXT[] DEFAULT '{}'`

2. **Cadência Super HOT**
   - Arquivo: `src/lib/config/cadences.ts` (adicionar entrada `SUPER_HOT`)
   ```ts
   SUPER_HOT: [
     { day: 0, channel: 'whatsapp', hour: 9,  templateType: 'super_hot_intro' },
     { day: 0, channel: 'email',    hour: 14, templateType: 'super_hot_offer' },
     { day: 1, channel: 'sms',      hour: 10, templateType: 'super_hot_sms' },
     { day: 3, channel: 'whatsapp', hour: 10, templateType: 'super_hot_human_touch' },
     // Dia 3 → escalona direto para contato humano se não respondeu
     { day: 3, channel: 'task',     hour: 10, templateType: 'assign_to_rep' },
   ]
   ```

3. **Templates específicos Super HOT**
   - Arquivo: `src/lib/prompts/copywriter.ts` (adicionar template_type)
   - Tom: exclusivo, urgente mas respeitoso, não menciona credit app diretamente
   - Exemplo WA: *"Oi [Nome]! Temos um veículo aqui que acho que vai te interessar muito — separei especialmente pra você. Posso te mostrar as fotos?"*
   - Exemplo Email: Subject: *"[Nome], reservamos algo especial para você"*
   - Exemplo SMS: *"[Nome], temos condições exclusivas disponíveis por 48h. Responda SIM para detalhes."*

4. **Escalonamento para sales rep no dia 3**
   - Arquivo: `src/lib/services/campaign-service.ts` (adicionar lógica de task)
   - Quando toque do tipo `assign_to_rep` é processado:
     - Se lead não respondeu ainda → cria task no Chatwoot para o sales rep ligar
     - Notifica sales rep: *"📞 [Nome] completou credit app mas não comprou. Ligue hoje. [dados do lead]"*
   - Não espera o dia 7 como nos outros segmentos

5. **Dashboard: filtro Super HOT**
   - Arquivo: `src/app/api/leads/route.ts` (adicionar filtro `tag=super_hot`)
   - Dashboard mostra card dedicado: *"Super HOT: 1.144 leads · Conversão esperada: ~239 vendas"*

6. **Relatório de progresso dedicado**
   - Separar métricas do grupo Super HOT das campanhas gerais
   - KPI específico: *"Super HOT: X/1.144 contatados · Y responderam · Z handoffs · W vendas"*

## Critérios de Verificação
- [ ] Query identifica exatamente 1.144 leads (ou número atualizado após importação)
- [ ] Leads marcados com tag `super_hot` no banco
- [ ] Campanha Super HOT criada com cadência de 3 dias
- [ ] Toque dia 3 escalona para sales rep corretamente
- [ ] Dashboard exibe card e filtro Super HOT
- [ ] Templates gerados têm tom adequado (sem mencionar rejeição anterior)

## Notas Técnicas

### SQL para identificar o grupo
```sql
SELECT COUNT(*) 
FROM leads 
WHERE credit_app = true 
  AND status != 'sold'
  AND opted_out = false
  AND name != 'NAME UNKNOWN';
-- Esperado: ~1.144
```

### Por que cadência de 3 dias e não 7?
Leads com credit app completo já passaram pela etapa mais difícil do processo de compra. O problema foi timing (não tinham o carro certo) ou proposta (financiamento, entrada). Uma abordagem de 3 dias com escalonamento rápido para humano aproveita o histórico de intenção sem ser invasivo.

### Tom certo para esse grupo
- ❌ Errado: "Você havia começado o processo conosco..."
- ❌ Errado: "Seu cadastro ainda está ativo..."
- ✅ Certo: "Temos novidades no estoque que combinam com você"
- ✅ Certo: "Condições especiais disponíveis por tempo limitado"
- O lead não precisa saber que sabemos do histórico dele — a mensagem deve parecer uma oportunidade nova, não um follow-up de falha.
