#!/bin/sh

set -e

echo "🚀 Iniciando ElitePass Backend"
echo "📦 Versão do Node: $(node --version)"

# Remove .env local para não interferir com variáveis do Docker
if [ -f .env ]; then
  echo "📝 Removendo .env local (usando variáveis do Docker)"
  rm -f .env
fi

# Wait for database to be ready
echo "🔄 Aguardando conexão com banco de dados..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" 2>/dev/null; then
    echo "✓ Banco de dados pronto"
    break
  fi

  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "✗ Banco de dados não respondeu após ${MAX_ATTEMPTS} tentativas"
    exit 1
  fi

  echo "  Tentativa $ATTEMPT/$MAX_ATTEMPTS..."
  sleep 1
done

echo "Executando migrações do Prisma..."
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
npx prisma migrate deploy

echo "✓ Migrações concluídas"

echo "Populando banco com dados de teste..."
npx tsx prisma/seed.ts

echo "✓ Seed concluído"
echo "🎯 Iniciando servidor na porta 3001..."
exec node dist/server.js
