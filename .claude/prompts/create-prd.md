# Criar PRD

Vamos criar o PRD (Product Requirements Document) para o projeto.

## Contexto do Projeto

[COLE AQUI A DESCRIÇÃO DO SEU PROJETO]

Dica: Use voice-to-text (Mac Whisper no Mac, whisperdictat.com no Windows) para facilitar!

---

## Instruções para o Claude

1. Baseado na minha descrição acima, crie um PRD completo e detalhado
2. Use o template em `docs/prd-template.md` como base
3. Inclua todos os elementos importantes:
   - Visão geral do projeto
   - Stack tecnológica recomendada
   - Arquitetura do sistema
   - Fluxos de usuário detalhados
   - Modelos de dados e schemas
   - Estratégia de banco de dados
   - Requisitos de segurança
   - Requisitos de performance
   - Integrações necessárias

## IMPORTANTE: Processo Iterativo

**NÃO crie o PRD final de uma vez!**

Siga este processo:

1. Crie uma primeira versão do PRD
2. Me faça pelo menos 3-5 perguntas para clarificar:
   - "Tem mais alguma funcionalidade que você quer adicionar?"
   - "Como você imagina o fluxo de [funcionalidade X]?"
   - "Existem casos de borda que eu deveria considerar?"
   - "Há algum requisito técnico específico que eu não mencionei?"
   - "Que tipo de dados precisamos armazenar para [feature Y]?"
   - "Como lidar com [situação específica]?"

3. Depois das minhas respostas, atualize o PRD
4. Repita o processo até ter certeza de que o PRD está robusto e completo
5. Só então salve em `docs/prd.md`

## Critérios de Qualidade

Um bom PRD deve:
- ✅ Ter todas as funcionalidades principais bem definidas
- ✅ Incluir casos de borda e como tratá-los
- ✅ Definir claramente os modelos de dados
- ✅ Especificar stack tecnológica com justificativas
- ✅ Incluir requisitos de segurança
- ✅ Definir fluxos de usuário passo a passo
- ✅ Antecipar problemas comuns

## Output Final

Quando o PRD estiver completo e robusto:
- Salve em `docs/prd.md`
- Me mostre um resumo das seções principais
- Me pergunte se quero fazer mais algum ajuste
