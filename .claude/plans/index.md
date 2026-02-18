# FAC Reactivation Engine — Plans Index

## Status Legend
- ✅ **Completo** - Finalizado, testado e commitado
- 🔄 **Em Progresso** - Sendo executado agora
- ⏳ **Pendente** - Aguardando execução
- 🧊 **Bloqueado** - Dependências não satisfeitas

## Plans

| # | Plano | Status | Dependências |
|---|-------|--------|--------------|
| 001 | Fundação — Setup, Docker, Estrutura | ✅ Completo | — |
| 002 | Banco de Dados — Schema Prisma + Migrations | ⏳ Pendente | 001 |
| 003 | Lead Engine — Import XLSX, Segmentação, API | ⏳ Pendente | 002 |
| 004 | Campaign Manager — CRUD Campanhas + Preview | ⏳ Pendente | 003 |
| 005 | Dispatch Workers — BullMQ + WA/Email/SMS | ⏳ Pendente | 004 |
| 006 | AI Copywriter — Claude API + Cache + A/B | ⏳ Pendente | 005 |
| 007 | Webhooks & Tracking — WAHA/Resend/Twilio | ⏳ Pendente | 005 |
| 008 | Conversation Handler — Agente IA + Handoff | ⏳ Pendente | 006, 007 |
| 009 | Dashboard UI — Next.js completo | ⏳ Pendente | 004 |
| 010 | N8N Workflows — Orquestração | ⏳ Pendente | 008 |
| 011 | Compliance & Observabilidade | ⏳ Pendente | 007 |
| 012 | Deploy & Produção — Docker + Nginx + VPS | ⏳ Pendente | 011 |

## Current Focus

**Plano:** 002 — Banco de Dados
**Started:** —
**Expected completion:** —

## Dependency Graph

```
001 → 002 → 003 → 004 → 005 → 006 → 008 → 010
                              ↓           ↑
                             007 ────────┘
                              ↓
                             011
                  004 → 009
                  011 → 012
```

## Notes

- Sempre ler `progress.txt` antes de iniciar um plano
- Verificar dependências antes de começar
- Máximo 5 arquivos por task
- Commitar ao final de cada plano: `feat(00X): descrição`
- Atualizar este index imediatamente após completar

## Next Up

**Próximo:** 002 — Banco de Dados — Schema Prisma + Migrations
**Bloqueado por:** Nenhum (001 completo)
**Pronto para iniciar:** Sim

---

## Planos Complementares (adicionados após revisão)

| # | Plano | Status | Dependências |
|---|-------|--------|--------------|
| 013 | Analytics Engine — A/B, Best Time, Auto-Adjust | ⏳ Pendente | 007, 009 |
| 014 | Super Lista HOT — 1.144 leads Credit App | ⏳ Pendente | 003, 004 |
| 015 | Meta Ads Export — Custom Audience FROZEN | ⏳ Pendente | 003 |

## Dependency Graph Atualizado

```
001 → 002 → 003 → 004 → 005 → 006 → 008 → 010
                              ↓           ↑
                             007 ────────┘
                              ↓
                         011 → 012
           004 → 009 → 013
           003 → 013
           003 → 014
           003 → 015
```
