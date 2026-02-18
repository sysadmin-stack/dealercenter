# Executar Próximo Plano

## Preparação

1. **Ler Contexto**
   - Leia `.claude/progress.txt` para entender gotchas e aprendizados
   - Leia `.claude/plans/index.md` para ver status de todos os planos
   - Identifique o próximo plano a ser executado:
     - Status: ⏳ Pendente
     - Dependências: Todas satisfeitas (✅ Completo)

2. **Escolher UM Plano**
   - Execute apenas UM plano por vez
   - Não pule planos
   - Respeite as dependências

## Estudar o Plano

1. Leia `.claude/plans/XX-nome.md` (o plano escolhido)
2. Leia `.claude/tasks/XX/00-overview.md` (overview das ondas)
3. Leia todas as tasks em `.claude/tasks/XX/*`
4. Entenda o objetivo geral antes de começar

## Executar Tasks em Ondas

### Conceito de Ondas
- **Onda Sequencial**: Tasks rodam uma por vez, na ordem
- **Onda Paralela**: Tasks rodam simultaneamente usando subagentes

### Como Executar

```bash
# Para cada onda no overview:

## Onda 1 - Sequencial
# Execute task 01, aguarde completar
# Execute task 02, aguarde completar

## Onda 2 - Paralelo
# Inicie subagente para task 03
# Inicie subagente para task 04
# Inicie subagente para task 05
# Aguarde TODOS completarem

## Onda 3 - Paralelo
# Inicie subagentes...
# Aguarde TODOS completarem

## Onda 4 - Sequencial
# Execute testes
# Execute ajustes finais
```

### Executando Tasks

Para cada task:

1. **Leia a task completa** em `.claude/tasks/XX/YY-nome.md`
2. **Execute os passos** descritos na task
3. **Valide** usando os critérios de conclusão
4. **Teste** a funcionalidade implementada

## Pós-Execução

### 1. Rodar Testes

```bash
# Rodar todos os testes
npm test

# Ou comando específico do projeto
[comando de teste do projeto]
```

**Se os testes falharem:**
- Identifique e corrija os erros
- Re-execute os testes
- NÃO prossiga até todos passarem

### 2. Checklist de Execução

Antes de marcar o plano como completo, verificar:

- [ ] Tasks do plano foram todas executadas
- [ ] Cada task editou menos de 5 arquivos (se mais, foi dividida)
- [ ] Não há erros de linting (`npm run lint`)
- [ ] Não há warnings no console
- [ ] Testes unitários passando
- [ ] Testes de integração passando (se houver)
- [ ] Funcionalidade testada manualmente
- [ ] Código revisado (sem TODOs ou FIXMEs críticos)

### 3. Atualizar Progress.txt

Se todos os testes passarem, atualize `.claude/progress.txt` usando o formato estruturado:

```markdown
## [YYYY-MM-DD] Plan XXX - [Nome do Plano]

### What happened
- [O que foi implementado neste plano]
- [Principais mudanças realizadas]

### Fixes
- [Correções aplicadas durante a execução]
- [Problemas resolvidos]

### Tests
- Unit tests: [ok/failed]
- Integration tests: [ok/failed]
- Full suite: [X tests, Y failures]
- Known failures: [lista pré-existentes se houver]

### Gotchas / Learnings
- [Arquivo]: [Problema] → [Solução]
  Exemplo: `lib/auth.ts`: Rate limiting (15 req/s) → Cache local de 5min
- [Padrão]: [Quando X] → [Fazer Y]
  Exemplo: When touching shared layout → grep em apps/* e packages/*

### Technical Decisions
- [Decisão]: [Justificativa]
  Exemplo: Cursor-based pagination → Melhor performance em grandes datasets
```

### 4. Atualizar Index

Atualize `.claude/plans/index.md`:

1. Marque o plano como ✅:
```markdown
| XXX | [Nome do Plano] | ✅ Completo | [Dependências] |
```

2. Atualize "Current Focus":
```markdown
## Current Focus
**Plano:** [Próximo plano] - [Nome]
**Started:** [YYYY-MM-DD]
```

### 5. Commit e Push

Use as convenções de commit estabelecidas:

```bash
# Para implementação de features
git add .
git commit -m "feat(XXX): [descrição clara do que foi implementado]"

# Para correções
git commit -m "fix(XXX): [descrição do problema corrigido]"

# Para mudanças de planejamento (raro)
git commit -m "plan(XXX): [descrição da mudança no plano]"

git push
```

**Exemplo de mensagens de commit**:
- `feat(001): Setup projeto Next.js com TypeScript e Tailwind`
- `feat(002): Implementar autenticação JWT com Supabase`
- `fix(003): Corrigir constraint de foreign key no schema de users`

## Checklist de Execução

Antes de marcar o plano como completo:

- [ ] Todas as tasks foram executadas
- [ ] Cada task respeitou limite de 5 arquivos
- [ ] Testes estão passando (unit + integration)
- [ ] Não há erros de linting
- [ ] Não há warnings no console
- [ ] Progress.txt foi atualizado (formato estruturado)
- [ ] Index.md foi atualizado (status ✅ + Current Focus)
- [ ] Código foi commitado com mensagem clara
- [ ] Push realizado com sucesso
- [ ] Funcionalidade foi testada manualmente

## Próximo Passo

Depois de completar um plano:
1. Me mostre um resumo do que foi feito
2. Me mostre os gotchas/aprendizados adicionados
3. Me mostre qual é o próximo plano a executar
4. Me pergunte se deve continuar automaticamente ou aguardar aprovação

## Loop Automático (Opcional)

Se quiser executar múltiplos planos automaticamente:
```bash
# Este comando roda em loop até todos os planos estarem completos
while grep -q "⏳ Pendente" .claude/plans/index.md; do
  claude --prompt .claude/prompts/start.md
  sleep 5
done
```

**⚠️ CUIDADO**: Use com supervisão. Revise o código após cada plano.

## Troubleshooting

### Testes Falhando
1. Leia o erro completo
2. Identifique qual arquivo está causando
3. Verifique se seguiu os passos da task
4. Consulte o progress.txt para gotchas similares
5. Corrija e re-execute os testes

### Dependências Faltando
1. Verifique no plano quais são as dependências
2. Confirme que os planos dependentes estão ✅ Completo
3. Verifique se credenciais/APIs necessárias estão configuradas

### Subagentes Travando
1. Verifique se há erros no console
2. Simplifique a task (quebre em tasks menores)
3. Execute sequencialmente ao invés de paralelo
