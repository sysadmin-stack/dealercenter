# Plano 012: Deploy & Produção

## Objetivo
Configurar o ambiente de produção completo na VPS com Docker Compose, Nginx como reverse proxy, SSL com Let's Encrypt e processo de deploy automatizado.

## Dependências
- [x] Plano 011: Compliance & Observabilidade (todos os planos anteriores)

## Tarefas

1. **Docker Compose produção**
   - Arquivo: `docker-compose.prod.yml`
   - Services: app, worker, redis, nginx
   - Volumes persistentes para Redis
   - Restart policy: `unless-stopped`

2. **Nginx config**
   - Arquivo: `nginx/nginx.conf`
   - Reverse proxy para Next.js (porta 3000)
   - SSL termination
   - Rate limiting por IP para rotas de webhook

3. **Dockerfile otimizado**
   - Arquivo: `Dockerfile` (multi-stage build)
   - Stage 1: deps
   - Stage 2: builder
   - Stage 3: runner (alpine, non-root user)

4. **Dockerfile worker**
   - Arquivo: `Dockerfile.worker`
   - Apenas o processo de workers BullMQ

5. **Deploy script + instruções**
   - Arquivo: `scripts/deploy.sh`
   - Arquivo: `docs/deploy.md`
   - Passo a passo completo para primeira instalação na VPS

## Critérios de Verificação
- [ ] `docker-compose -f docker-compose.prod.yml up -d` sobe tudo
- [ ] HTTPS funcionando no domínio
- [ ] App acessível na internet
- [ ] Worker rodando em container separado
- [ ] Restart automático após reboot da VPS
- [ ] `docker-compose logs -f app` mostra logs em JSON
