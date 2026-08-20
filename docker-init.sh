#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# ElitePass Docker Initialization Script
# ═══════════════════════════════════════════════════════════════

set -e

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          ElitePass Docker Initialization                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"

# ─── Check prerequisites ───────────────────────────────────────
echo -e "${YELLOW}[1/5] Verificando pré-requisitos...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}✗ Docker não está instalado${NC}"
  echo "  Instale em: https://www.docker.com/products/docker-desktop"
  exit 1
fi
echo -e "${GREEN}✓ Docker encontrado$(docker --version | sed 's/Docker version //')${NC}"

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}✗ Docker Compose não está instalado${NC}"
  echo "  Instale em: https://docs.docker.com/compose/install/"
  exit 1
fi
echo -e "${GREEN}✓ Docker Compose encontrado$(docker-compose --version | sed 's/Docker Compose version //')${NC}"

# ─── Setup environment file ────────────────────────────────────
echo -e "\n${YELLOW}[2/5] Configurando variáveis de ambiente...${NC}"

if [ -f .env ]; then
  echo -e "${YELLOW}⚠ Arquivo .env já existe. Pulando...${NC}"
else
  if [ -f .env.docker ]; then
    cp .env.docker .env
    echo -e "${GREEN}✓ Arquivo .env criado a partir de .env.docker${NC}"
  else
    echo -e "${RED}✗ Arquivo .env.docker não encontrado${NC}"
    exit 1
  fi
fi

# ─── Build images ─────────────────────────────────────────────
echo -e "\n${YELLOW}[3/5] Construindo imagens Docker...${NC}"
docker-compose build
echo -e "${GREEN}✓ Imagens construídas com sucesso${NC}"

# ─── Start containers ─────────────────────────────────────────
echo -e "\n${YELLOW}[4/5] Iniciando containers...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Containers iniciados${NC}"

# ─── Wait for database and run migrations ──────────────────────
echo -e "\n${YELLOW}[5/5] Aguardando banco de dados e executando migrações...${NC}"

# Wait for PostgreSQL to be ready
echo "  Aguardando PostgreSQL estar pronto..."
MAX_ATTEMPTS=30
ATTEMPTS=0
while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if docker-compose exec -T postgres pg_isready -U postgres &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL está pronto${NC}"
    break
  fi
  ATTEMPTS=$((ATTEMPTS + 1))
  sleep 1
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
  echo -e "${RED}✗ PostgreSQL não respondeu no tempo esperado${NC}"
  exit 1
fi

# Run migrations
echo "  Executando migrações do Prisma..."
docker-compose exec -T backend npx prisma migrate deploy
echo -e "${GREEN}✓ Migrações executadas com sucesso${NC}"

# ─── Success message ───────────────────────────────────────────
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ Setup Concluído com Sucesso!               ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}Sua aplicação está rodando em:${NC}"
echo -e "  ${YELLOW}Frontend:${NC}  http://localhost:3000"
echo -e "  ${YELLOW}Backend:${NC}   http://localhost:3001"
echo -e "  ${YELLOW}Database:${NC}  localhost:5432\n"

echo -e "${BLUE}Comandos úteis:${NC}"
echo "  Ver logs:          ${YELLOW}docker-compose logs -f${NC}"
echo "  Parar containers:  ${YELLOW}docker-compose down${NC}"
echo "  Shell do backend:  ${YELLOW}docker-compose exec backend sh${NC}"
echo "  Prisma Studio:     ${YELLOW}docker-compose exec backend npx prisma studio${NC}\n"

echo -e "${BLUE}Para mais informações, consulte DOCKER.md${NC}\n"
