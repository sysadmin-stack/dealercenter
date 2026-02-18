# Criar Planos de Desenvolvimento

## Instruções

1. Leia o PRD completo em `docs/prd.md`
2. Divida o projeto em partes menores e gerenciáveis
3. Crie planos individuais na pasta `.claude/plans/`
4. Nomeie os arquivos com números para manter a ordem

## Diretrizes para Criar Planos

### Tamanho dos Planos
- **Pequenos e focados** > Grandes e complexos
- Cada plano deve ser completável em 1-2 dias de desenvolvimento
- Melhor ter 10 planos pequenos que 3 grandes

### Ordem dos Planos
1. **Fundação** - Setup do projeto, configs, estrutura básica
2. **Infraestrutura** - Database, autenticação, core utilities
3. **Features Principais** - Um plano por feature quando possível
4. **Features Secundárias** - Nice to have
5. **Polimento** - UI/UX, performance, documentação

### Nomenclatura
```
001-fundacao.md
002-autenticacao.md
003-banco-dados.md
004-[nome-da-feature].md
005-[nome-da-feature].md
...
```

### Tamanho Ideal de um Plano
**Regra de ouro**: 1 plano = 1 objetivo claro e executável

**Sinais de que um plano está grande demais**:
- Vai precisar de mais de 10 tasks
- Envolve 2+ domínios diferentes (ex: auth + billing)
- Levaria mais de 2 dias de desenvolvimento
- Não tem critérios de aceite claros

**Quando isso acontecer**: Divida em 2-4 planos menores

## Estrutura de Cada Plano

Use o template em `.claude/templates/plan-template.md` e inclua:

```markdown
# Plano [Número]: [Nome do Plano]

## Objetivo
[Descrição clara do que este plano vai implementar]

## Dependências
- Plano X deve estar completo
- [Outras dependências]

## Escopo

### Incluído
- [Item 1]
- [Item 2]

### Não Incluído (Será feito em planos futuros)
- [Item 1]
- [Item 2]

## Tarefas de Alto Nível
1. [Tarefa 1]
2. [Tarefa 2]
3. [Tarefa 3]

## Critérios de Verificação
- [ ] [Critério 1]
- [ ] [Critério 2]

## Notas Técnicas
[Considerações importantes para implementação]
```

## Criar Index de Planos

Crie também `.claude/plans/index.md` com a tabela de status:

```markdown
# Project Plans Index

## Status Legend
- ✅ Completo
- 🔄 Em Progresso
- ⏳ Pendente
- 🧊 Bloqueado

## Plans

| # | Plano | Status | Dependências |
|---|-------|--------|--------------|
| 001 | Fundação | ⏳ Pendente | - |
| 002 | Autenticação | ⏳ Pendente | 001 |
| 003 | Banco de Dados | ⏳ Pendente | 001 |
| 004 | Feature: Users | ⏳ Pendente | 002, 003 |
| 005 | Feature: Dashboard | ⏳ Pendente | 004 |
| ... | ... | ... | ... |

## Current Focus
Nenhum plano em execução ainda.

## Notes
- Always update progress.txt after finishing tasks
- Verify all tests pass before marking as ✅
```

## Exemplos de Bons Planos

### ✅ BOM
**Plano 04: Feature - Sistema de Posts**
- Escopo claro: CRUD de posts, com imagens
- Tamanho gerenciável: ~5-8 tasks
- Dependências claras: Precisa de auth (02) e DB (03)

### ❌ RUIM
**Plano 04: Implementar Todas as Features**
- Escopo muito amplo
- Vai precisar de 50+ tasks
- Difícil de completar e testar

## Output Final

Depois de criar todos os planos:
1. Me mostre a lista completa de planos criados
2. Me mostre o conteúdo do `index.md`
3. Me pergunte se quero ajustar algum plano antes de seguir para as tasks

## IMPORTANTE

**NÃO EXECUTE NADA AINDA** - apenas crie os planos.
As tasks serão criadas no próximo passo.
O desenvolvimento em si acontece depois.
