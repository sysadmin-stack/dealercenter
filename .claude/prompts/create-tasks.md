# Criar Tasks para Plano

## Instruções

Vamos criar tasks detalhadas para o **Plano [XX]**.

1. Leia `.claude/progress.txt` (se existir) para entender gotchas e aprendizados
2. Leia `.claude/plans/index.md` para ver status geral
3. Analise o plano número [XX] em `.claude/plans/XX-nome.md`

## Criar Pasta de Tasks

Crie a pasta `.claude/tasks/XX/` (onde XX é o número do plano)

## Criar Overview das Ondas

Primeiro, crie `.claude/tasks/XX/00-overview.md`:

```markdown
# Overview - Plano [XX]: [Nome do Plano]

## Objetivo do Plano
[Copiar do plano]

## Ondas de Execução

### Onda 1 - Setup (Sequencial)
Tasks que precisam rodar uma por vez:
- Task 01: [Nome e descrição curta]

### Onda 2 - Core Implementation (Paralelo)
Tasks que podem rodar simultaneamente:
- Task 02: [Nome e descrição curta]
- Task 03: [Nome e descrição curta]
- Task 04: [Nome e descrição curta]

### Onda 3 - Integration (Paralelo)
- Task 05: [Nome e descrição curta]
- Task 06: [Nome e descrição curta]

### Onda 4 - Testing & Polish (Sequencial)
- Task 07: Testes automatizados
- Task 08: Ajustes finais

## Diretrizes Importantes

Baseado em `.claude/progress.txt`:
- [Diretriz 1 baseada em aprendizados anteriores]
- [Diretriz 2]
- [Diretriz 3]

## Regras Gerais
- Todo código em português (comentários, variáveis, etc.)
- Sempre validar no backend mesmo que valide no frontend
- Nunca quebrar funcionalidades existentes
- Sempre adicionar testes para código novo
```

## Criar Tasks Individuais

Para cada task, crie `.claude/tasks/XX/YY-nome.md`:

```markdown
# Task [XX]-[YY]: [Nome da Task]

## Objetivo
[Descrição clara e específica do que esta task deve fazer]

## Arquivos a Modificar/Criar

### Criar
- `path/to/new/file1.ts`
- `path/to/new/file2.tsx`

### Modificar
- `path/to/existing/file.ts`

## Passos Detalhados

1. **[Passo 1]**
   - Arquivo: `path/to/file`
   - Ação: [O que fazer exatamente]
   - Código: [Snippet ou descrição]

2. **[Passo 2]**
   - Arquivo: `path/to/file`
   - Ação: [O que fazer exatamente]
   - Código: [Snippet ou descrição]

3. **[Passo 3]**
   - [Continuar com todos os passos necessários]

## Critérios de Conclusão

Esta task está completa quando:
- [ ] [Critério funcional 1]
- [ ] [Critério funcional 2]
- [ ] Código sem erros de linting
- [ ] Sem warnings no console
- [ ] Funcionalidade testada manualmente

## Dependências

### Tasks que Devem Estar Completas
- [ ] Task [XX]-[YY]: [Nome]

### Recursos Necessários
- [ ] [API key, credencial, etc.]

## Notas Importantes

### Do Progress.txt
- [Gotcha relevante]: [Como evitar]
- [Aprendizado relevante]: [Como aplicar]

### Técnicas
- [Consideração técnica 1]
- [Consideração técnica 2]

## Validação

Após completar a task, verificar:
```bash
# Rodar testes
npm test

# Verificar linting
npm run lint

# Testar manualmente
[Passos para testar]
```
```

## Diretrizes para Boas Tasks

### ✅ Tasks BOM Definidas
- Escopo claro e específico
- 1-3 horas de trabalho máximo
- Arquivos listados explicitamente
- Passos detalhados
- Critérios de conclusão claros

### ❌ Tasks MAL Definidas
- "Implementar autenticação" (muito amplo)
- "Arrumar bugs" (não específico)
- Sem listar arquivos envolvidos
- Passos vagos ou ausentes

### 🚨 Regras Anti-Explosão de Contexto

**Sinais de que uma task está GRANDE DEMAIS**:
- [ ] Precisa editar **mais de 5 arquivos**
- [ ] Envolve **2+ domínios** ao mesmo tempo (ex: auth + billing)
- [ ] Exige **múltiplas migrações** ou refactors amplos
- [ ] Não cabe em uma execução clara com começo/meio/fim

**Quando detectar esses sinais**: Divida a task em 2-4 tasks menores.

**Regra prática**: Se você não consegue descrever a task em 3-5 passos claros, ela precisa ser quebrada.

## Exemplos de Tasks

### Exemplo 1: Setup
```
# Task 01-01: Configurar Projeto Next.js

## Objetivo
Criar projeto Next.js 14 com TypeScript, Tailwind, e estrutura de pastas

## Passos
1. Criar projeto: `npx create-next-app@latest`
2. Configurar Tailwind
3. Criar estrutura de pastas
4. Adicionar dependências base
```

### Exemplo 2: Feature
```
# Task 04-02: Implementar Endpoint de Login

## Objetivo
Criar endpoint POST /api/auth/login que valida credenciais e retorna JWT

## Arquivos a Criar
- `app/api/auth/login/route.ts`
- `lib/jwt.ts`

## Passos
1. Criar route handler
2. Validar email/password
3. Verificar no banco
4. Gerar JWT
5. Retornar token
```

## Output Final

Depois de criar todas as tasks:
1. Me mostre o overview com as ondas
2. Me mostre a lista de todas as tasks criadas
3. Me confirme que está pronto para começar a execução

## IMPORTANTE

**NÃO EXECUTE NADA AINDA** - apenas crie as tasks.
A execução acontece no próximo passo usando o prompt `start.md`.
