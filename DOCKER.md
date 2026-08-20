# 🐳 ElitePass com Docker

Guia completo para rodar a aplicação ElitePass em containers Docker.

## 📋 Pré-requisitos

- [Docker](https://www.docker.com/products/docker-desktop) instalado (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) instalado (v2.0+)

## 🚀 Inicio Rápido

### 1. Preparar variáveis de ambiente

```bash
# Copie o arquivo de configuração padrão do Docker
cp .env.docker .env
```

### 2. (Opcional) Gerar chaves de segurança

Para produção, altere as chaves de segurança no arquivo `.env`:

```bash
# Gere novas chaves usando openssl
openssl rand -hex 32  # JWT_ACCESS_SECRET
openssl rand -hex 32  # JWT_REFRESH_SECRET
openssl rand -hex 32  # TICKET_HMAC_SECRET
```

Edite o arquivo `.env` com as chaves geradas.

### 3. Iniciar os containers

```bash
# Build e inicia todos os containers
docker-compose up --build

# Ou em background (detached mode)
docker-compose up --build -d
```

A aplicação estará disponível em:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **PostgreSQL**: localhost:5432

### 4. (Primeira vez) Executar migrações do Prisma

Se for a primeira vez rodando, o banco de dados está vazio. Execute as migrações:

```bash
# Com containers rodando (em outro terminal)
docker-compose exec backend npx prisma migrate deploy

# Ou para desenvolvimento
docker-compose exec backend npx prisma migrate dev
```

## 🔧 Comandos Úteis

### Parar os containers

```bash
docker-compose down
```

### Parar e remover volumes (limpar banco de dados)

```bash
docker-compose down -v
```

### Ver logs de um serviço específico

```bash
# Todos os logs
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend

# Apenas PostgreSQL
docker-compose logs -f postgres
```

### Executar comandos dentro de um container

```bash
# Shell do backend
docker-compose exec backend sh

# Prisma studio (UI para o banco de dados)
docker-compose exec backend npx prisma studio

# Shell do PostgreSQL
docker-compose exec postgres psql -U postgres -d elitepass
```

### Rebuilar uma imagem específica

```bash
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

## 🌍 Configuração para Acesso Externo

Se você quer acessar a aplicação de outra máquina na rede:

1. Edite o arquivo `.env`:

```env
NEXT_PUBLIC_BACKEND_URL=http://SEU_IP_OU_DOMINIO:3001
```

2. Altere a porta no `docker-compose.yml` se necessário:

```yaml
ports:
  - "0.0.0.0:3000:3000"  # Frontend (acessível em qualquer interface)
  - "0.0.0.0:3001:3001"  # Backend (acessível em qualquer interface)
```

## 📦 Estrutura dos Containers

```
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   Frontend   │  │   Backend    │   │
│  │ (Next.js)    │  │  (Express)   │   │
│  │  :3000       │  │   :3001      │   │
│  └──────┬───────┘  └──────┬───────┘   │
│         │                 │            │
│         └─────────┬───────┘            │
│                   │                    │
│              ┌────▼────┐               │
│              │ Backend │               │
│              └────┬────┘               │
│                   │                    │
│              ┌────▼──────────┐         │
│              │  PostgreSQL   │         │
│              │ (postgres:16) │         │
│              │  :5432        │         │
│              └───────────────┘         │
│                                         │
└─────────────────────────────────────────┘
```

## 🔒 Variáveis de Ambiente

Todas as variáveis estão documentadas em `.env.docker`. Principais:

### Database
- `DB_USER`: Usuário PostgreSQL (padrão: postgres)
- `DB_PASSWORD`: Senha PostgreSQL (padrão: postgres)
- `DB_NAME`: Nome do banco (padrão: elitepass)
- `DB_PORT`: Porta do PostgreSQL (padrão: 5432)

### Backend
- `NODE_ENV`: production ou development
- `JWT_ACCESS_SECRET`: Chave para tokens JWT
- `JWT_REFRESH_SECRET`: Chave para refresh tokens
- `TICKET_HMAC_SECRET`: Chave para HMAC de tickets

### Frontend
- `NEXT_PUBLIC_BACKEND_URL`: URL do backend (padrão: http://backend:3001)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Chave pública do Stripe

### Integrações Externas
- `TICKETMASTER_API_KEY`: API do Ticketmaster
- `TMDB_READ_ACCESS_TOKEN`: Token do TMDB
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe

## 🐛 Troubleshooting

### Porta já está em uso

```bash
# Identifique o processo usando a porta
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Mate o processo ou altere a porta no .env
```

### Banco de dados não conecta

```bash
# Verifique se o PostgreSQL está saudável
docker-compose ps

# Veja os logs
docker-compose logs postgres

# Reinicie o serviço
docker-compose restart postgres
```

### Frontend não consegue conectar ao backend

1. Verifique se `NEXT_PUBLIC_BACKEND_URL` está correto no `.env`
2. Certifique-se que o backend está rodando: `docker-compose ps`
3. Veja os logs do frontend: `docker-compose logs frontend`

### Migrações falhando

```bash
# Verifique o status das migrações
docker-compose exec backend npx prisma migrate status

# Redeploy das migrações
docker-compose exec backend npx prisma migrate deploy

# Reset completo (cuidado - deleta dados!)
docker-compose exec backend npx prisma migrate reset
```

## 📝 Produção

Para produção:

1. **Altere as chaves de segurança** no `.env` (use `openssl rand -hex 32`)
2. **Use um banco de dados gerenciado** (AWS RDS, Heroku Postgres, etc.)
3. **Configure backup automático** dos volumes Docker
4. **Use reverse proxy** (nginx, traefik) para SSL/TLS
5. **Configure limites de recursos** no docker-compose.yml
6. **Use registry privado** para as imagens Docker

Exemplo de configuração com limites:

```yaml
services:
  backend:
    # ... outras configurações
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 📚 Referências

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)

---

**Dúvidas?** Verifique os logs com `docker-compose logs -f` ou consulte a documentação oficial.
