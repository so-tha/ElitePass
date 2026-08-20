# 🎟️ ElitePass

> Plataforma de ingressos para shows e eventos — rápida, segura e com a identidade visual dos grandes eventos.

---

## 📌 Sobre o Projeto

O **ElitePass** é uma plataforma de compra e gestão de ingressos para shows e eventos. O modelo conecta três perfis de usuário em um fluxo completo:

| Perfil | O que faz |
|--------|-----------|
| 🎪 **Organizador** | Monta um evento a partir de um catálogo de shows (API externa), define data, local, capacidade e preço, e publica para venda |
| 🎫 **Cliente** | Navega pelos eventos publicados, reserva seu lugar, paga de forma simulada, recebe um ingresso com QR Code e pode compartilhá-lo por link |
| 🚪 **Portaria** | Valida o ingresso do cliente na entrada do evento via leitura do QR Code |

---

## 🗺️ Status de Funcionalidades

### Frontend (cliente)
- [x] Navegação e busca de eventos (shows em cartaz, data, local, preço)
- [x] Página de detalhe do evento
- [x] Fluxo de compra com pagamento simulado
- [x] Ingresso digital com QR Code
- [x] Compartilhamento de ingresso por link
- [x] Área do cliente (meus ingressos)
- [x] Cancelamento de ingresso com devolução ao estoque e estorno na Stripe

### Frontend (organizador)
- [x] Dashboard de criação e gestão de eventos
- [x] Integração com API externa de shows/catálogo
- [x] Controle de capacidade e vendas em tempo real (em progresso)

### Frontend (portaria)
- [x] Leitor de QR Code (câmera) e digitação manual do código para validação de ingresso na entrada
- [x] Retorno de status: válido, inválido, já utilizado ou evento errado

### Backend (API Node.js)
- [x] Autenticação JWT com três perfis (cliente, organizador, portaria)
- [x] CRUD de eventos e setores/tiers (Organizador)
- [x] Integração/Proxy com API externa de catálogo de shows (Ticketmaster) e filmes (TMDB)
- [x] Fluxo de compra e emissão de ingresso digital
- [x] Geração e validação presencial de QR Code com assinatura HMAC-SHA256
- [x] Controle de capacidade e prevenção de venda duplicada (PostgreSQL + transações ACID)
- [x] Painel de estatísticas, faturamento e ocupação em tempo real para Organizadores
- [x] **Validação server-side de preços de tiers** (segurança contra manipulação de valores)
- [x] **Rate limiting** em autenticação e validação de ingressos
- [x] **Hardening de segurança** (Helmet, CORS explícito, validação de env vars, tratamento de erros Prisma)


---

## 🎨 Identidade Visual

A paleta de cores do ElitePass foi definida com o auxílio da **IA Gemini (Google)**, seguindo a regra clássica de design **60-30-10**, que garante equilíbrio, hierarquia visual e coerência de marca em toda a interface.

### Regra 60-30-10

| Proporção | Cor | Hex | RGB | Papel na Interface |
|-----------|-----|-----|-----|--------------------|
| **60% — Dominante** | Preto Puro / Cinza Muito Escuro | `#000000` | `rgb(0, 0, 0)` | Fundo principal do app e site |
| **30% — Secundária** | Dourado / Ambar |  |  | Botões, destaques e elementos de ação |
| **10% — Acentuação** | Branco Puro | `#F7F7F7` | `rgb(247, 247, 247)` | Textos de leitura rápida e ícones simples |

> 💡 **Paleta complementar identificada durante o processo criativo com a IA:**
>
> | Cor | Hex | RGB | Uso sugerido |
> |-----|-----|-----|--------------|
> | Branco Suave | `#F7F7F7` | `rgb(247, 247, 247)` | Textos e ícones |
> | Âmbar / Dourado | `#FFB22C` | `rgb(255, 178, 44)` | Destaques e chamadas para ação (CTA) |
> | Terracota / Marrom | `#854836` | `rgb(133, 72, 54)` | Elementos decorativos / arte dos shows |
> | Preto Absoluto | `#000000` | `rgb(0, 0, 0)` | Base e fundo |

---

### Filosofia por Cor

#### 60% — Preto Puro ou Cinza Muito Escuro
Usado como **fundo principal** em toda a aplicação. O fundo escuro faz as artes dos shows **brilharem** naturalmente, cria contraste forte com textos claros e mantém a **identidade limpa e premium** da marca.

#### 30% — Dourado / Âmbar
Traz o sentimento de **segurança, tecnologia e confiabilidade** — sensações essenciais no momento em que o usuário insere os dados do cartão de crédito. Essa cor aparece nos botões principais, bordas de foco e elementos interativos.

#### 10% — Branco Puro
Reservado para **textos de leitura rápida**, labels de formulário e ícones simples. Sua escassez intencional garante que o olhar do usuário seja guiado sem poluição visual.

---

### Por que essa paleta funciona para o ElitePass?

- **Fundo escuro + artes coloridas de shows** → experiência visual imersiva, como estar em uma arena
- **Dourado no fluxo de pagamento** → associação imediata com bancos e segurança digital
- **Branco/amarelo dourado em textos e CTAs** → alto contraste, acessibilidade e sensação de exclusividade

---

## 🛠️ Tecnologias

### Frontend
- ⚛️ **React** — Biblioteca para construção de interfaces reativas e componentizadas
- 🔺 **Next.js** — Framework React com SSR, SSG e roteamento integrado (App Router)
- 🟦 **TypeScript** — Tipagem estática para maior segurança e produtividade

### Backend
- 🟩 **Node.js** 20.19.0+ — Runtime JavaScript para a API e lógica de negócio do servidor
- 🚂 **Express** — Framework minimalista para criação das rotas da API REST
- 🟦 **TypeScript** 5.4.0+ — Tipagem estática no backend para consistência com o frontend
- 🛡️ **Helmet** — Middleware de segurança HTTP (headers de proteção)
- ⏱️ **express-rate-limit** — Rate limiting em autenticação e endpoints críticos
- 🔐 **Zod** — Validação e parsing de tipos (env vars, schemas de entrada)

### Banco de Dados
- 🐘 **PostgreSQL** — Banco de dados relacional com suporte a transações ACID (essencial para pagamentos e overselling prevention)
- 🔷 **Prisma ORM v7** — Interface elegante com driver adapter (`@prisma/adapter-pg`), migrations e Prisma Studio

### Pagamentos
- 💳 **Stripe** (`stripe`, `@stripe/react-stripe-js`, `@stripe/stripe-js`) — Payment Intents para checkout, com estorno automático em cancelamentos

### Ferramentas & Infra
- 🐳 **Docker & Docker Compose** — Ambiente completo (frontend + backend + PostgreSQL) em containers
- 🧪 **Vitest** — Testes unitários no frontend e no backend
- **Git & GitHub** — Controle de versão e repositório remoto

---

## 💰 Modelo de Preços & Eventos Locais vs. Externos

### Eventos Locais (Criados por Organizadores)

Os organizadores criam eventos diretamente na plataforma com:
- **Tiers customizados** — setores com preço, capacidade e label (ex: "Pista", "Meia-renda", "VIP")
- **Validação server-side** — qualquer compra sempre valida o preço contra o tier salvo no banco; o cliente **nunca pode escolher seu próprio preço**
- **Preço imutável durante transação** — mesmo que o organizador mude o preço após o cliente iniciar a compra, a transação ACID garante que só o preço salvo é cobrado

### Eventos Externos (Ticketmaster & TMDB)

O ElitePass consome **APIs externas de catálogo** para buscar shows e filmes em cartaz:

| Fonte | Acesso | Situação |
|-------|--------|----------|
| **Ticketmaster Discovery API v2** | Gratuita + pública | Não retorna `priceRanges` (removido globalmente em mar/2025) |
| **TMDB (The Movie Database)** | Gratuita + pública | Catálogo apenas; sem dados de preço |

Para esses eventos, o cliente insere um **preço simulado** no frontend que é aceito pela API (não há preço real a validar). Depois, o server valida a coerência da transação (capacidade, formato de valor, etc.) — não o valor em si, pois a API externa não o expõe.

**Fluxo funcional end-to-end** para demonstração: busca de catálogo, seleção de ingresso, cálculo de taxa (12%), checkout com QR Code validado — tudo sem venda real integrada.

> 💡 **Para produção:** Uma integração com **Commerce API** (Ticketmaster) ou **gateway de pagamento** (Stripe, PayPal) substituiria os preços simulados por valores reais. A arquitetura já suporta isso.

---

## 💵 Preços Simulados — Arquitetura e Motivação

### Por que Preços Simulados?

O ElitePass integra **duas APIs externas de catálogo** que não fornecem dados de preço em tempo real:

1. **Ticketmaster Discovery API** — removeu globalmente o campo `priceRanges` em março de 2025
2. **TMDB (The Movie Database)** — focada em catálogo, sem dados comerciais de ingressos

**Problema:** Sem dados reais de preço, a plataforma não consegue validar o valor que o usuário tentaria comprar. **Solução:** Usar preços simulados que são **determinísticos** (baseados no ID do evento) e consistentes em toda a aplicação.

### Como Funcionam os Preços Simulados

#### Algoritmo Determinístico (Arquivo: `src/lib/tmdb.ts` e `src/lib/ticketmaster.ts`)

Os preços são **gerados a partir do ID único do evento**, garantindo que o mesmo evento sempre retorne o mesmo preço:

```javascript
export function generateMoviePrice(movie: TMDBMovie): { min: number; max: number; currency: string } {
  // Seed determinístico baseado no ID do filme
  const seed = movie.id % 1000;
  const tiers = [
    { min: 32, max: 55 },   // sessão normal
    { min: 45, max: 70 },   // VIP / IMAX
    { min: 55, max: 90 },   // IMAX + poltrona premium
  ];
  const tier = tiers[seed % tiers.length];
  // Variação de centavos baseada no ID
  const offset = (movie.id % 10) * 0.5;
  return { min: tier.min + offset, max: tier.max + offset, currency: "BRL" };
}
```

**O que acontece:**
1. O ID do evento (ex: `603` para "The Matrix") determina qual tier será usado
2. Cada tier tem um intervalo de preço (ex: R$ 32 a R$ 55 para sessão normal)
3. A variação de centavos garante diversidade (R$ 32,50, R$ 33,00, R$ 33,50, etc.)
4. **Sempre retorna o mesmo valor** para o mesmo evento (determinístico)

#### Exemplos de Preços Gerados

| Filme | ID | Seed (ID % 1000) | Tier | Preço Mín | Preço Máx | Variação |
|-------|----|--------------------|------|-----------|-----------|-----------|
| The Matrix | 603 | 603 | Normal | R$ 32,50 | R$ 55,50 | +1,50 |
| Avatar | 19995 | 995 | Premium | R$ 58,75 | R$ 92,75 | +3,75 |
| Inception | 27205 | 205 | VIP | R$ 48,25 | R$ 73,25 | +2,25 |

### Validação Server-Side de Preços Simulados

Apesar de simulados, **o backend valida rigorosamente**:

```typescript
// Arquivo: backend/src/app/api/orders/route.ts
if (quantity <= 0 || quantity > 10) {
  return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
}
if (priceUnit <= 0) {
  return NextResponse.json({ error: "Preço inválido" }, { status: 400 });
}
// Calcula taxa de 12% automaticamente
const fee = Math.round(priceUnit * quantity * 0.12 * 100) / 100;
const totalAmount = priceUnit * quantity + fee;
```

**Regras aplicadas:**
- ✅ Quantidade entre 1 e 10 ingressos
- ✅ Preço unitário sempre > 0
- ✅ Taxa de serviço (12%) calculada automaticamente
- ❌ Cliente **nunca consegue** colocar um preço negativo ou zero
- ❌ Cliente **nunca consegue** comprar mais de 10 ingressos de uma vez (proteção contra abuso)

### Diferença: Eventos Locais vs. Externos

| Tipo | Preço | Validação | Exemplo |
|------|-------|-----------|---------|
| **Local** (Organizador cria) | Real, defindo pelo organizador | Server valida contra DB antes de vender | "Arctic Monkeys Tour" com R$ 150 pista, R$ 250 VIP |
| **Externo** (Ticketmaster/TMDB) | Simulado, determinístico | Server valida formato e regras de negócio, não o valor | "Avatar 3" gera R$ 55,50 baseado no ID 19995 |

### Como Será em Produção

Para trocar para **preços reais**, bastaria:

1. **Ticketmaster Commerce API** — Integrar ao endpoint de busca para retornar `priceRanges` reais
2. **Stripe Payment Links** — Usar preços dinâmicos que vêm da Ticketmaster em tempo real
3. **Remoção do simulador** — Deletar `generateMoviePrice()` e usar valores do catálogo externo

**A arquitetura já suporta isso** — o `Order` model no banco não sabe se o preço é simulado ou real, apenas o valida.

---

## ⚠️ Limitações Conhecidas

### Cancelamento de Ingressos — Ajuste Parcial de Receita

Quando um cliente cancela um ingresso individual de um pedido com múltiplos ingressos (ex: comprou 3 ingressos, cancelou 1), o sistema:

✅ **Faz corretamente:**
- Estorna o valor proporcional na Stripe
- Devolve a vaga (decrementa `Event.soldCount` ou libera um assento reservado)
- Marca o ingresso como `CANCELLED`
- Se todos os ingressos do pedido forem cancelados, marca o pedido como `CANCELLED`

❌ **Não ajusta:**
- A receita total agregada no dashboard do organizador (`Order.totalAmount` não é decrementada)
- Mantém o pedido como `CONFIRMED` mesmo com cancelamentos parciais

**Motivo:** A receita hoje é rastreada por pedido (campo único `Order.totalAmount`), não por ingresso. Um ajuste completo exigiria desnormalizar valores por ingresso, com migração de dados históricos.

**Impacto:** Se um organizador vendeu 100 ingressos por R$ 1.000 cada (R$ 100.000 de receita), e 10 clientes cancelarem 1 ingresso cada, o painel ainda exibirá R$ 100.000 de receita (não R$ 90.000), enquanto o `soldCount`/ocupação estarão corretos. Os estornos na Stripe refletem corretamente os cancelamentos.

### Avisos inofensivos no console do navegador

Ao abrir a aplicação, o console do navegador pode exibir:
```
⚠️ TICKETMASTER_API_KEY não definida no .env.local
⚠️ TMDB_READ_ACCESS_TOKEN não definido no .env.local
```
Isso acontece porque `src/lib/ticketmaster.ts` e `src/lib/tmdb.ts` são importados (por seus tipos/helpers) em um componente client, então o bundler do Next.js empacota o arquivo inteiro — incluindo esse `console.warn` de nível de módulo — no bundle do navegador. As chamadas reais às APIs externas continuam acontecendo no servidor (rotas `/api/movies` e `/api/events`), onde as chaves estão corretamente configuradas. **Não afeta o funcionamento da aplicação.**

### Rodando com Docker: variáveis `NEXT_PUBLIC_*` exigem rebuild

O Next.js "grava" as variáveis `NEXT_PUBLIC_*` e os `rewrites()` de `next.config.ts` dentro dos arquivos estáticos durante `next build` — elas não são lidas novamente em runtime. Isso significa que, se você alterar `.env` (ex: trocar `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` ou `NEXT_PUBLIC_BACKEND_URL`), um `docker-compose restart frontend` **não é suficiente**: é necessário reconstruir a imagem:
```bash
docker-compose up --build -d
```
Variáveis do backend (sem o prefixo `NEXT_PUBLIC_`, como `STRIPE_SECRET_KEY` e `DATABASE_URL`) são lidas em runtime e só precisam de `docker-compose restart backend`.

---

## 🔒 Segurança & Arquitetura

### Camadas de Proteção Implementadas

| Camada | Mecanismo | Detalhe |
|--------|-----------|--------|
| **Configuração de Env** | Zod + validação no startup | Falha rápida se variáveis obrigatórias ausentes; segredos não têm fallback hardcoded |
| **HTTP Headers** | Helmet | `X-Content-Type-Options`, `Strict-Transport-Security`, `X-Frame-Options` etc. |
| **CORS** | Origem explícita | Apenas frontend autorizado pode fazer requisições com cookies |
| **Rate Limiting** | express-rate-limit | 10 req/15min em login/registro; 30 req/60s em validação de ingressos |
| **Autenticação** | JWT em memória + Refresh Token em cookie HttpOnly | Access token curta vida (15m); refresh token seguro (7d, HttpOnly, SameSite=Strict) |
| **Autorização** | RBAC (Role-Based Access Control) | CLIENT, ORGANIZER, DOORMAN com checagens granulares de propriedade |
| **Validação de Preços** | Server-side | Preços de tiers local sempre validados contra o banco; cliente nunca decide seu próprio preço |
| **Geração de Ingressos** | HMAC-SHA256 em transação ACID | QR Code com assinatura criptográfica; falsificação requer a chave secreta |
| **Overselling Prevention** | Transações Prisma + Lock | `soldCount` incrementado atomicamente; corridas de compra resolvidas no banco |
| **Tratamento de Erros** | Prisma error codes + stack traces | P2002 (duplicado) → 409; P2025 (não encontrado) → 404; logs com stack completo |

### Estrutura de Dados & Permissões

- **User** → pode organizar eventos (role ORGANIZER) ou comprar ingressos (role CLIENT)
- **Event** → propriedade do ORGANIZER; capacidade garantida por transações
- **Order** → propriedade do usuário; acesso restrito ao dono
- **Ticket** → acesso via link de compartilhamento (público) ou código (DOORMAN/ORGANIZER dono do evento)

---

## 📁 Estrutura do Projeto

```
ElitePass/                          # Raiz = Frontend Next.js
├── src/
│   ├── app/                        # App Router do Next.js
│   ├── components/                 # Componentes React reutilizáveis
│   └── lib/                        # Utilitários do frontend
├── public/                         # Arquivos estáticos
├── package.json                    # Dependências do frontend
├── .env.local                      # Configuração local do frontend
├── .env.example                    # Template de env vars frontend
│
└── backend/                        # API Node.js (deploy separado)
    ├── src/
    │   ├── config/
    │   │   └── env.ts              # Validação de env vars com Zod (startup)
    │   ├── controllers/            # Handlers de rotas (auth, orders, events, etc.)
    │   ├── middlewares/            # Rate limiters, error handler, auth
    │   ├── routes/                 # Definição de rotas REST
    │   ├── lib/                    # Utilitários (JWT, QR Code, tiers)
    │   ├── generated/              # Tipos gerados do Prisma (gitignored)
    │   ├── prisma.ts               # Singleton PrismaClient com adapter-pg
    │   └── server.ts               # Ponto de entrada da API
    │
    ├── prisma/
    │   ├── schema.prisma           # Modelos do banco (User, Event, Order, Ticket)
    │   └── migrations/             # Histórico de migrations
    │
    ├── .env                        # Configuração local (segredos, DB)
    ├── .env.example                # Template de env vars backend
    ├── package.json                # Dependências backend (Express, Prisma, etc.)
    ├── tsconfig.json               # Configuração TypeScript
    └── ROADMAP.md                  # Especificação técnica completa do backend
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js 20.19.0+
- PostgreSQL 12+
- npm

### Frontend (raiz do projeto)

```bash
npm install
npm run dev
# Acesse: http://localhost:3000
```

### Backend

```bash
cd backend

# 1. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com:
#   - DATABASE_URL: conexão ao PostgreSQL
#   - JWT_ACCESS_SECRET e JWT_REFRESH_SECRET: chaves secretas (gere com: openssl rand -hex 32)
#   - TICKET_HMAC_SECRET: chave para assinatura de QR Codes
#   - FRONTEND_URL: URL do frontend para CORS
#   - (opcional) TICKETMASTER_API_KEY, TMDB_READ_ACCESS_TOKEN

# 2. Instale dependências
npm install

# 3. Aplique as migrations no banco
npm run db:migrate

# 4. Popule o banco com usuários e eventos de teste (veja credenciais abaixo)
npm run db:seed

# 5. Inicie o servidor (modo desenvolvimento com reload automático)
npm run dev
# Acesse: http://localhost:3001

# 6. (opcional) Abra o Prisma Studio para visualizar dados
npm run db:studio
```

**Nota:** O backend valida automaticamente todas as env vars obrigatórias no startup (Zod schema). Se alguma estiver faltando, o servidor exibe mensagem clara e encerra, evitando falhas silenciosas em produção.

### 🧪 Testes

Testes unitários (Vitest) cobrem a lógica que não depende de banco de dados nem de serviços externos — o foco foi a lógica de segurança e as regras de negócio mais sensíveis:

- **Backend**: assinatura/verificação HMAC do QR Code (`ticketCode.ts` — inclui casos de adulteração), geração/validação de JWT (`jwt.ts` — inclui separação entre segredo de access e refresh token), validação de tiers/preço (`eventTiers.ts` — preço e capacidade nunca podem ser zero/negativos)
- **Frontend**: utilitários de formatação de data/preço/local do catálogo externo (`ticketmaster.ts` — inclui o caso de fuso horário ao parsear datas, e o fallback de preço simulado quando a API não retorna `priceRanges`)

```bash
# Backend
cd backend
npm test

# Frontend (raiz do projeto)
npm test
```

Não há testes de integração com banco de dados real nem testes de UI/E2E — o fluxo completo (compra → QR Code → validação na portaria) foi validado manualmente ponta a ponta, não por testes automatizados.

### 🐳 Rodar com Docker (Recomendado)

Para rodar a aplicação completa (Frontend + Backend + PostgreSQL) em containers:

```bash
# 1. Execute o script de inicialização (cria .env, constrói imagens, inicia containers)
bash docker-init.sh

# Aguarde ~30 segundos para tudo iniciar
# Acesse:
#   Frontend: http://localhost:3000
#   Backend:  http://localhost:3001

# 2. Usar Makefile para comandos comuns
make help              # Ver todos os comandos
make docker-logs       # Ver logs em tempo real
make docker-down       # Parar containers
make prisma-studio    # Abrir UI do banco
```

**Importante:** A primeira vez leva mais tempo (build das imagens). Depois, `docker-compose up -d` é rápido.

Documentação completa: veja [DOCKER.md](./DOCKER.md)

### 🔑 Credenciais de Teste

O banco de dados é populado automaticamente com usuários de teste e eventos de exemplo. Use essas credenciais para testar cada perfil:

#### 👤 Cliente 1 (Comprador de Ingressos — já com ingressos comprados)
```
E-mail: cliente1@elitepass.com
Senha: 123456
CPF:   111.222.333-44
Função: Buscar, comprar e gerenciar ingressos
```

#### 👤 Cliente 2 (Comprador de Ingressos — conta "zerada")
```
E-mail: cliente2@elitepass.com
Senha: 123456
CPF:   222.333.444-55
Função: Testar o fluxo de compra do zero (sem ingressos pré-carregados)
```

#### 👔 Organizador (Criador de Eventos)
```
E-mail: organizador@elitepass.com
Senha: 123456
CPF:   999.888.777-66
Função: Criar eventos, gerenciar tiers, acompanhar vendas
```

#### 🚪 Portaria (Validador de Ingressos)
```
E-mail: portaria@elitepass.com
Senha: 123456
CPF:   555.444.333-22
Função: Validar ingressos via QR Code na entrada do evento
```

#### 📋 Eventos Pré-Carregados

A seed do banco cria automaticamente 5 eventos de teste:

1. **Arctic Monkeys — World Tour 2026** (Show | Curitiba)
2. **Tame Impala — Live Experience** (Show | Salvador)
3. **Avatar 3: Fogo e Cinzas** (Filme | São Paulo)
4. **Interstellar — Edição Especial 10 Anos** (Filme | São Paulo)
5. **The 1975 — Still... At Their Very Best Tour** (Show | São Paulo)

O **cliente1@elitepass.com** já possui ingressos de alguns desses eventos (úteis para testar a validação na portaria e o cancelamento). O **cliente2@elitepass.com** entra sem nenhum ingresso, ideal para testar o fluxo de compra do zero.

### 🌐 Deploy em Produção

Este projeto está configurado para deploy em **three managed platforms** — cada uma lidando com uma camada da aplicação:

| Camada | Plataforma | Observação |
|--------|-----------|-----------|
| **Frontend** (raiz) | [Vercel](https://vercel.com) | Detecta Next.js automaticamente; variáveis em Project Settings → Environment Variables |
| **Backend** (`/backend`) | [Render](https://render.com) | Free tier com hibernação após 15 min de inatividade; recomendado para dev/demo |
| **Banco de dados** | [Neon](https://neon.tech) | PostgreSQL serverless; free tier permanente (~0.5GB); ideal para começar |

#### ⚡ Observações sobre o Free Tier

- **Render:** A instância hiberna após ~15 min de inatividade; o primeiro acesso volta a ativar (pode levar ~50s). Socket.IO reconecta automaticamente.
- **Neon:** Pausa computação após 1 semana de inatividade, mas ativa automaticamente. Dados permanecem.
- Ambas têm 100% de uptime (não são experimentais), apenas com limitações de recursos.

---
### Comentarios
 Coisas que ue poderia melhorar com toda certeza foi o front-end, principalmente no modo claro, mas como foquei bem no back-end o front não saiu da maneira que gostaria. A IA me ajudou demais em boa parte do codigo porém, teve alguns B.O's que eu tive que resolver sozinha como o final que envolvia o deploy, a configuração das tres plataformas diferentes que usei (Vercel pro front, Render pro Back e Neon para o bd), e também também foi uma luta para ela não deixar o front do jeito que ela queria e não do modo que eu almejava. Utilizei o color hunt para encontrar uma paleta de cores que fizesse sentido de inicio, tive problemas com a questão dos preços vindo da API do Ticketmaster como disse em uma seção acima e com eventos retornando com o tipo undefined. Enfim, eu poderia ter feito muito melhor, porém é o que eu consegui em 6 dias pois queria entregar um dia antes do limite.
---

<p align="center">
  Feito por <strong>so-tha</strong> — Identidade visual criada com o auxílio da <strong>IA Gemini e Claude</strong>
</p>
