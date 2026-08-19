# 🎟️ ElitePass

> Plataforma de ingressos premium para shows e eventos — rápida, segura e com a identidade visual dos grandes eventos.

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
- [x] Dashboard de criação e gestão de eventos (em progresso)
- [x] Integração com API externa de shows/catálogo
- [ ] Controle de capacidade e vendas em tempo real (em progresso)

### Frontend (portaria)
- [x] Leitor de QR Code (câmera) e digitação manual do código para validação de ingresso na entrada
- [x] Retorno de status: válido, inválido, já utilizado ou evento errado

### Backend (API Node.js) — 📋 [Veja o ROADMAP Backend](./backend/ROADMAP.md)
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

### Ferramentas & Infra
- **Git & GitHub** — Controle de versão e repositório remoto
- Pagamentos: *(a definir)*

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

# 4. Inicie o servidor (modo desenvolvimento com reload automático)
npm run dev
# Acesse: http://localhost:3001

# 5. (opcional) Abra o Prisma Studio para visualizar dados
npm run db:studio
```

**Nota:** O backend valida automaticamente todas as env vars obrigatórias no startup (Zod schema). Se alguma estiver faltando, o servidor exibe mensagem clara e encerra, evitando falhas silenciosas em produção.

### Deploy

| Camada | Plataforma recomendada |
|--------|------------------------|
| **Frontend** (raiz) | Vercel — detecção automática do Next.js |
| **Backend** (`/backend`) | Railway ou Render |
| **Banco de dados** | Supabase (PostgreSQL gerenciado) |

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

<p align="center">
  Feito por <strong>so-tha</strong> — Identidade visual criada com o auxílio da <strong>IA Gemini</strong>
</p>
