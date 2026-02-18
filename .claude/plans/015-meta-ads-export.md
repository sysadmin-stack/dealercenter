# Plano 015: Meta Ads Export — Custom Audience para Leads FROZEN

## Objetivo
Implementar a exportação dos 3.873 leads FROZEN em formato compatível com Meta Ads (Custom Audience), permitindo que Antonio faça retargeting no Facebook e Instagram com esses contatos. O canal de paid ads complementa os disparos orgânicos e mantém a Florida Auto Center no radar de leads que estão dormindo há mais de 2 anos.

## Contexto Estratégico
- **Leads FROZEN**: 3.873 com `days_old >= 730`
- **Por que Meta Ads?**: custo baixo para top-of-mind, alcança leads que não abrem email nem respondem WA
- **Custom Audience**: Meta cruza email/telefone com contas do Facebook/Instagram — match rate médio de 60-70%, ou seja ~2.700 pessoas alcançadas
- **Orçamento sugerido**: $5-10/dia × 30 dias = $150-300 para ~2.700 pessoas = CPM baixíssimo
- **Formato**: CSV com colunas específicas que o Meta exige (hashed ou plain)

## Dependências
- [x] Plano 003: Lead Engine (leads no banco)

## Escopo

### O Que Está Incluído
- Endpoint de exportação: `GET /api/leads/export/meta-audience`
- Formato CSV exato que o Meta Ads Manager aceita
- Hashing SHA-256 de email e telefone (Meta recomenda dados hasheados)
- Filtros: apenas FROZEN + opted_out=false + email_valid=true
- Botão no dashboard para baixar o arquivo
- Documentação passo a passo de como fazer upload no Meta

### O Que NÃO Está Incluído
- Integração direta com API do Meta (requer Meta Business API — fora do escopo)
- Criação automática de campanhas no Meta (processo manual)
- Lookalike Audience (passo seguinte, manual)

## Tarefas

1. **Export service**
   - Arquivo: `src/lib/services/meta-export-service.ts`
   - Query: leads FROZEN + não opted_out + email ou telefone disponível
   - Hash SHA-256 de email (lowercase trim) e telefone (E.164 sem +)
   - Formata CSV com colunas Meta: `email`, `phone`, `fn` (first name), `ln` (last name), `ct` (city), `st` (state), `zip`, `country`

   ```ts
   import { createHash } from 'crypto'
   
   function hashForMeta(value: string): string {
     return createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
   }
   
   // Formato Meta Custom Audience CSV
   // email,phone,fn,ln,ct,st,zip,country
   // hash,hash,hash,hash,hash,hash,hash,US
   ```

2. **API Route**
   - Arquivo: `src/app/api/leads/export/meta-audience/route.ts`
   - Auth: apenas admin
   - Response: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="meta-audience-frozen-YYYY-MM-DD.csv"`
   - Log no audit_log: `{action: 'export_meta_audience', count: X, exportedAt}`

3. **Dashboard: botão de exportação**
   - Arquivo: `src/app/dashboard/leads/page.tsx` (adicionar seção)
   - Card: *"Leads FROZEN: 3.873 · Estimativa de match Meta: ~2.700 pessoas"*
   - Botão: *"Exportar para Meta Ads"* → download CSV
   - Aviso: *"Arquivo gerado com hashing SHA-256. Seguro para upload direto no Meta Ads Manager."*

4. **Documentação de uso**
   - Arquivo: `docs/meta-ads-guide.md`
   - Passo a passo com screenshots (text description) de como fazer upload no Meta Ads Manager
   - Como criar a Custom Audience
   - Como criar campanha de retargeting
   - Segmentação recomendada: veículos, renda, localização Florida
   - Copy sugerido para os anúncios por segmento de interesse

## Critérios de Verificação
- [ ] Export gera CSV com colunas corretas
- [ ] Hashing SHA-256 funciona (verificar com ferramenta online)
- [ ] Apenas leads FROZEN não opted_out são exportados
- [ ] Download funciona no browser
- [ ] Audit log registra exportação
- [ ] Contagem correta (~3.873 ou número atualizado)

## Notas Técnicas

### Formato exato do CSV Meta
```csv
email,phone,fn,ln,ct,st,zip,country
a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3,b14a7b8059d9c055954c92674ce60032d0a4f00dd50731ae3e1de9f35fe06af3,8c7dd922ad47494fc02c388e12c00eaf,315f5bdb76d078c43b8ac0064e4a0164,b94f6f125c79e2a335100df664b87bdb,b14a7b8059d9c055954c92674ce60032d0a4f00dd50731ae3e1de9f35fe06af3,,840
```
- `country`: 840 = código numérico ISO para USA
- Colunas vazias são aceitas — não precisa ter todos os dados
- Email e telefone são os mais importantes para match rate

### Estratégia de anúncio recomendada (para documentação)
**Objetivo**: Traffic ou Leads  
**Orçamento**: $5-10/dia  
**Duração**: 30 dias (depois renovar com nova lista)  
**Criativo sugerido**:
- Vídeo curto do estoque atual (30s)
- Carousel com 5 veículos mais populares
- Copy: *"Ainda procurando seu carro? Novidades chegaram na Florida Auto Center."*
**Lookalike**: após 30 dias, criar Lookalike 1% dos que engajaram com os anúncios

### Por que não integrar diretamente com Meta API?
Meta Business API requer verificação de negócio, conta Business Manager configurada, e app review para Custom Audiences. O processo manual de upload CSV tem o mesmo resultado em 5 minutos sem burocracia. Pode ser automatizado depois se necessário.
