#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# DealerCenter — Deploy Script
# Usage: ./scripts/deploy.sh [command]
# Commands: setup, deploy, ssl, logs, status, restart, down
# ============================================================

COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="dealercenter"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check prerequisites
check_deps() {
    command -v docker >/dev/null 2>&1 || err "Docker not found. Install: https://docs.docker.com/engine/install/"
    command -v docker compose >/dev/null 2>&1 || err "Docker Compose not found."
    command -v git >/dev/null 2>&1 || err "Git not found."
}

# First-time setup
cmd_setup() {
    log "Setting up DealerCenter production environment..."
    check_deps

    # Check .env.production exists
    if [ ! -f .env.production ]; then
        warn ".env.production not found. Creating from template..."
        cp .env.local.example .env.production
        warn "IMPORTANT: Edit .env.production with real credentials before deploying!"
        exit 1
    fi

    # Create nginx certs directory
    mkdir -p nginx/certs

    log "Building Docker images..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build

    log "Starting database..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d postgres redis
    sleep 5

    log "Running database migrations..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" run --rm app npx prisma migrate deploy

    log "Starting all services..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d

    log "Setup complete! Run './scripts/deploy.sh ssl' to configure SSL."
    cmd_status
}

# Deploy (pull latest, rebuild, restart)
cmd_deploy() {
    log "Deploying DealerCenter..."
    check_deps

    [ -f .env.production ] || err ".env.production not found. Run './scripts/deploy.sh setup' first."

    log "Pulling latest code..."
    git pull origin main

    log "Building images..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" build

    log "Running migrations..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" run --rm app npx prisma migrate deploy

    log "Restarting services..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d

    log "Deploy complete!"
    cmd_status
}

# SSL setup with Let's Encrypt
cmd_ssl() {
    if [ -z "${DOMAIN:-}" ]; then
        err "Usage: DOMAIN=yourdomain.com EMAIL=you@email.com ./scripts/deploy.sh ssl"
    fi

    local email="${EMAIL:-admin@$DOMAIN}"

    log "Setting up SSL for $DOMAIN..."

    # Update nginx.conf with actual domain
    sed -i "s/DOMAIN/$DOMAIN/g" nginx/nginx.conf
    sed -i "s/server_name _;/server_name $DOMAIN;/g" nginx/nginx.conf

    # Get initial certificate
    log "Requesting SSL certificate..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" run --rm certbot \
        certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email "$email" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"

    # Reload nginx
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" exec nginx nginx -s reload

    log "SSL configured for $DOMAIN!"
}

# Show logs
cmd_logs() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f "$service"
    else
        docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f
    fi
}

# Show status
cmd_status() {
    log "Service status:"
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
}

# Restart services
cmd_restart() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        log "Restarting $service..."
        docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" restart "$service"
    else
        log "Restarting all services..."
        docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" restart
    fi
}

# Stop all services
cmd_down() {
    warn "Stopping all services..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
    log "All services stopped."
}

# Seed database
cmd_seed() {
    log "Seeding database..."
    docker compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" run --rm app npx prisma db seed
    log "Seed complete!"
}

# ============================================================
# Main
# ============================================================
case "${1:-help}" in
    setup)   cmd_setup ;;
    deploy)  cmd_deploy ;;
    ssl)     cmd_ssl ;;
    logs)    cmd_logs "${2:-}" ;;
    status)  cmd_status ;;
    restart) cmd_restart "${2:-}" ;;
    down)    cmd_down ;;
    seed)    cmd_seed ;;
    help|*)
        echo "DealerCenter Deploy Script"
        echo ""
        echo "Usage: ./scripts/deploy.sh <command>"
        echo ""
        echo "Commands:"
        echo "  setup           First-time setup (build, migrate, start)"
        echo "  deploy          Pull latest, rebuild, migrate, restart"
        echo "  ssl             Setup SSL (requires DOMAIN and EMAIL env vars)"
        echo "  logs [service]  Show logs (optionally for a specific service)"
        echo "  status          Show service status"
        echo "  restart [svc]   Restart services"
        echo "  down            Stop all services"
        echo "  seed            Run database seed"
        echo "  help            Show this help"
        ;;
esac
