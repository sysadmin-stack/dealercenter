# Plano 003: Lead Engine — Import XLSX, Segmentação, API

## Objetivo
Implementar o sistema completo de importação de leads via XLSX, incluindo parser, deduplicação, validação, segmentação automática e scoring. Expor via API REST.

## Dependências
- [x] Plano 001: Fundação
- [x] Plano 002: Banco de Dados

## Escopo

### O Que Está Incluído
- Parser XLSX usando a técnica de leitura manual por ZIP (como já testado)
- Validação de email e telefone (formato E.164)
- Deduplicação por email+nome
- Segmentação automática (HOT/WARM/COLD/FROZEN)
- Scoring de leads
- Detecção de idioma básica (EN/ES/PT por nome)
- DNC check automático na importação
- API: GET /api/leads, POST /api/leads/import, GET /api/leads/:id
- Paginação e filtros na listagem

### O Que NÃO Está Incluído
- UI de importação (Plano 009)
- Campanhas (Plano 004)

## Tarefas

1. **XLSX Parser service**
   - Arquivo: `src/lib/parsers/xlsx-leads.ts`
   - Técnica: ler como ZIP, parsear sharedStrings + sheet XML
   - Extrair: Name, Email, Phone, Address, DOB, SalesRep, Source, Status, Type, LostReason, CreditApp, DaysOld, Created

2. **Lead validator**
   - Arquivo: `src/lib/validators/lead.ts`
   - Email: regex + formato básico
   - Phone: normalizar para E.164 (+1XXXXXXXXXX para números US)
   - Detecção de idioma: heurística por nome (nomes latinos → PT/ES)

3. **Lead segmenter**
   - Arquivo: `src/lib/services/lead-segmenter.ts`
   - Segmentação por daysOld
   - Score calculation
   - DNC check

4. **Import service**
   - Arquivo: `src/lib/services/lead-importer.ts`
   - Processa em batches de 500 para não sobrecarregar
   - Upsert com deduplicação
   - Retorna relatório: {total, imported, duplicates, skipped, errors}

5. **API Routes**
   - Arquivo: `src/app/api/leads/route.ts` (GET com paginação/filtros, POST import)
   - Arquivo: `src/app/api/leads/[id]/route.ts` (GET, PATCH)
   - Arquivo: `src/app/api/leads/import/route.ts` (POST multipart/form-data)
   - Arquivo: `src/app/api/leads/stats/route.ts` (GET — counts por segmento)

## Critérios de Verificação
- [ ] Upload de XLSX de 2.000 leads processa em < 15s
- [ ] Deduplicação funciona corretamente (testar com arquivo com duplicatas)
- [ ] GET /api/leads retorna lista paginada
- [ ] GET /api/leads/stats retorna {HOT: X, WARM: X, COLD: X, FROZEN: X}
- [ ] Leads com DNC são marcados como opted_out automaticamente
- [ ] Leads com status SOLD são marcados como status='sold' e não incluídos em campanhas

## Notas Técnicas

### Segmentação
```ts
function getSegment(daysOld: number): Segment {
  if (daysOld < 90) return 'HOT'
  if (daysOld < 365) return 'WARM'
  if (daysOld < 730) return 'COLD'
  return 'FROZEN'
}

function getScore(lead: ParsedLead): number {
  const base = { HOT: 100, WARM: 70, COLD: 40, FROZEN: 20 }
  let score = base[getSegment(lead.daysOld)]
  if (lead.creditApp) score += 20
  if (lead.originType === 'WALK-IN') score += 15
  if (lead.email && isValidEmail(lead.email)) score += 5
  return score
}
```

### Gotchas Conhecidos
- XLSX com estilo inválido (como os arquivos do cliente): usar leitura via ZIP diretamente, NÃO openpyxl
- Phone normalization: remover "H: " e "C: " do campo, pegar apenas o número limpo
- DaysOld no arquivo original: número Excel serial date — converter adequadamente
- Leads com `Name = 'NAME UNKNOWN'`: importar mas marcar como `status='unknown'`
