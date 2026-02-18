# Plano 009: Dashboard UI — Next.js Completo

## Objetivo
Implementar o dashboard web completo com todas as telas: visão geral de métricas, gestão de leads, criação e controle de campanhas, e visualização de handoffs.

## Dependências
- [x] Plano 004: Campaign Manager (APIs prontas)
- [x] Plano 003: Lead Engine (APIs prontas)

## Tarefas

1. **Layout base do dashboard**
   - Arquivo: `src/app/dashboard/layout.tsx`
   - Sidebar com navegação
   - Header com info do usuário
   - Arquivo: `src/components/dashboard/sidebar.tsx`

2. **Página: Overview (/)** 
   - Arquivo: `src/app/dashboard/page.tsx`
   - Cards: total leads, campanhas ativas, handoffs hoje, opt-outs
   - Gráfico: disparos por dia (últimos 30 dias)
   - Funil: enviado → lido → respondeu → handoff

3. **Página: Leads (/leads)**
   - Arquivo: `src/app/dashboard/leads/page.tsx`
   - Tabela com filtros (segmento, status, canal)
   - Upload de XLSX (drag & drop)
   - Progresso de importação em tempo real

4. **Página: Campanhas (/campaigns)**
   - Arquivo: `src/app/dashboard/campaigns/page.tsx`
   - Lista de campanhas com status
   - Arquivo: `src/app/dashboard/campaigns/new/page.tsx`
   - Form: selecionar segmentos + canais + preview de leads
   - Arquivo: `src/app/dashboard/campaigns/[id]/page.tsx`
   - Detalhes: métricas, lista de toques, controles (pausar/retomar/cancelar)

5. **Página: Analytics (/analytics)**
   - Arquivo: `src/app/dashboard/analytics/page.tsx`
   - Taxa de conversão por canal e segmento
   - Performance A/B de templates
   - Custo estimado (tokens + SMS + email)

## Critérios de Verificação
- [ ] Dashboard carrega em < 1s
- [ ] Upload de XLSX funciona com feedback de progresso
- [ ] Criação de campanha com preview de leads elegíveis
- [ ] Controles de campanha (pausar/retomar) funcionam em tempo real
- [ ] Gráficos renderizam com dados reais
- [ ] Responsivo para tablet (para usar na loja)
