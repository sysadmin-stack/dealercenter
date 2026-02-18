# PROMPT DE INÍCIO — FAC Reactivation Engine
## Cole este prompt no Claude Code para começar o desenvolvimento

---

Você vai desenvolver o **FAC Reactivation Engine** — sistema de reativação multicanal de leads para a Florida Auto Center.

**Antes de qualquer coisa, leia obrigatoriamente:**
1. `.claude/progress.txt` — contexto crítico do projeto, gotchas conhecidos, ambiente já configurado
2. `.claude/plans/index.md` — status de todos os 15 planos
3. `docs/prd.md` — documentação técnica completa

**Depois de ler, execute o Plano 001 seguindo as instruções em `.claude/prompts/start.md`**

**Regras inegociáveis:**
- Execute apenas UM plano por vez
- Máximo 5 arquivos por task
- Atualize `progress.txt` ao final de cada plano
- Commit com `feat(001): descrição` ao final
- Pergunte antes de tomar decisões arquiteturais não previstas no PRD

**Stack confirmada:**
- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Prisma + Supabase PostgreSQL
- BullMQ + Redis
- WAHA (já configurado na VPS) — engine NOWEB
- Resend (não SendGrid)
- Twilio SMS
- Claude API (claude-sonnet-4-6)
- Chatwoot + N8N (já configurados)

**Ambiente da VPS:**
- Ubuntu 22.04
- N8N rodando ✅
- Chatwoot rodando ✅
- Supabase configurado ✅
- WAHA configurado ✅

Pronto. Comece lendo os arquivos e inicie o Plano 001.
