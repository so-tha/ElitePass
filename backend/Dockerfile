# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Install postgresql-client for pg_isready
RUN apk add --no-cache postgresql-client

COPY package*.json ./
# Instala todas as dependências (incluindo devDependencies) para ter tsx disponível
# para executar o seed em runtime
RUN npm ci

COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
# O seed roda via tsx e importa `../src/prisma`, que por sua vez importa
# `./generated/client` e `./config/env` — toda essa cadeia precisa estar presente.
COPY --from=builder /app/src ./src
COPY tsconfig.json ./
# Prisma 7 lê a URL do datasource deste arquivo (o bloco datasource no
# schema.prisma não tem `url`), então ele é obrigatório em runtime.
COPY prisma.config.ts ./
COPY docker-entrypoint.sh ./

RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
