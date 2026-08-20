.PHONY: help docker-init docker-up docker-down docker-logs docker-shell-backend docker-shell-frontend docker-shell-db docker-restart docker-clean docker-build prisma-migrate prisma-studio

# Default target
help:
	@echo "ElitePass Docker Commands"
	@echo ""
	@echo "Setup:"
	@echo "  make docker-init       - Setup inicial (cria .env e inicia containers)"
	@echo ""
	@echo "Containers:"
	@echo "  make docker-up         - Inicia containers (docker-compose up)"
	@echo "  make docker-down       - Para containers (docker-compose down)"
	@echo "  make docker-restart    - Reinicia containers"
	@echo "  make docker-build      - Reconstrói imagens"
	@echo ""
	@echo "Logs e Debug:"
	@echo "  make docker-logs       - Ver todos os logs"
	@echo "  make docker-shell-backend  - Shell do container backend"
	@echo "  make docker-shell-frontend - Shell do container frontend"
	@echo "  make docker-shell-db   - Shell do PostgreSQL"
	@echo ""
	@echo "Database:"
	@echo "  make prisma-migrate   - Executa migrações Prisma"
	@echo "  make prisma-studio    - Abre Prisma Studio (UI para banco)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make docker-clean     - Remove containers, volumes e dados"

# ─── Setup ────────────────────────────────────────────────────
docker-init:
	@bash docker-init.sh

# ─── Containers ───────────────────────────────────────────────
docker-up:
	docker-compose up -d
	@echo "✓ Containers iniciados"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:3001"

docker-down:
	docker-compose down
	@echo "✓ Containers parados"

docker-restart:
	docker-compose restart
	@echo "✓ Containers reiniciados"

docker-build:
	docker-compose build --no-cache
	@echo "✓ Imagens reconstruídas"

docker-logs:
	docker-compose logs -f

docker-logs-backend:
	docker-compose logs -f backend

docker-logs-frontend:
	docker-compose logs -f frontend

docker-logs-db:
	docker-compose logs -f postgres

# ─── Shell Access ─────────────────────────────────────────────
docker-shell-backend:
	docker-compose exec backend sh

docker-shell-frontend:
	docker-compose exec frontend sh

docker-shell-db:
	docker-compose exec postgres psql -U postgres -d elitepass

# ─── Database ────────────────────────────────────────────────
prisma-migrate:
	docker-compose exec backend npx prisma migrate deploy
	@echo "✓ Migrações executadas"

prisma-studio:
	docker-compose exec backend npx prisma studio

prisma-reset:
	docker-compose exec backend npx prisma migrate reset
	@echo "✓ Banco de dados resetado"

# ─── Cleanup ───────────────────────────────────────────────────
docker-clean:
	docker-compose down -v
	@echo "✓ Containers e volumes removidos"

docker-clean-all: docker-clean
	docker system prune -f
	@echo "✓ Imagens e network orphans removidos"
