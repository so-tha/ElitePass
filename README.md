# 🎟️ ElitePass

> Plataforma de ingressos premium para shows e eventos — rápida, segura e com a identidade visual dos grandes eventos.

---

## 📌 Sobre o Projeto

O **ElitePass** é uma aplicação web/mobile voltada para a compra e gestão de ingressos de shows e eventos. O foco é proporcionar uma experiência premium ao usuário: visual impactante, fluxo de compra intuitivo e total confiança na hora de inserir os dados do cartão.

---

## 🎨 Identidade Visual

A paleta de cores do ElitePass foi definida com o auxílio da **IA Gemini (Google)**, seguindo a regra clássica de design **60-30-10**, que garante equilíbrio, hierarquia visual e coerência de marca em toda a interface.

### Regra 60-30-10

| Proporção | Cor | Hex | RGB | Papel na Interface |
|-----------|-----|-----|-----|--------------------|
| **60% — Dominante** | Preto Puro / Cinza Muito Escuro | `#000000` | `rgb(0, 0, 0)` | Fundo principal do app e site |
| **30% — Secundária** | Azul Royal / Ciano Elétrico | *(a definir)* | — | Botões, destaques e elementos de ação |
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

#### 🖤 60% — Preto Puro ou Cinza Muito Escuro
Usado como **fundo principal** em toda a aplicação. O fundo escuro faz as artes dos shows **brilharem** naturalmente, cria contraste forte com textos claros e mantém a **identidade limpa e premium** da marca.

#### 🔵 30% — Azul Royal ou Ciano Elétrico
Traz o sentimento de **segurança, tecnologia e confiabilidade** — sensações essenciais no momento em que o usuário insere os dados do cartão de crédito. Essa cor aparece nos botões principais, bordas de foco e elementos interativos.

#### 🤍 10% — Branco Puro
Reservado para **textos de leitura rápida**, labels de formulário e ícones simples. Sua escassez intencional garante que o olhar do usuário seja guiado sem poluição visual.

---

### Por que essa paleta funciona para o ElitePass?

- **Fundo escuro + artes coloridas de shows** → experiência visual imersiva, como estar em uma arena
- **Azul no fluxo de pagamento** → associação imediata com bancos e segurança digital
- **Branco/amarelo dourado em textos e CTAs** → alto contraste, acessibilidade e sensação de exclusividade

---

## 🛠️ Tecnologias

### Frontend
- ⚛️ **React** — Biblioteca para construção de interfaces reativas e componentizadas
- 🔺 **Next.js** — Framework React com SSR, SSG e roteamento integrado (App Router)
- 🟦 **TypeScript** — Tipagem estática para maior segurança e produtividade

### Backend
- 🟩 **Node.js** — Runtime JavaScript para a API e lógica de negócio do servidor
- 🚂 **Express** — Framework minimalista para criação das rotas da API REST
- 🟦 **TypeScript** — Tipagem no backend para consistência com o frontend

### Banco de Dados
- 🐘 **PostgreSQL** — Banco de dados relacional com suporte a transações ACID (essencial para pagamentos)
- 🔷 **Prisma ORM** — Interface elegante entre o Node.js e o PostgreSQL, com migrations e Prisma Studio

### Ferramentas & Infra
- **Git & GitHub** — Controle de versão e repositório remoto
- Pagamentos: *(a definir)*

---

## 📁 Estrutura do Projeto

```
ElitePass/                 # Raiz = Frontend Next.js (deploy direto no Vercel)
├── src/
│   └── app/               # App Router do Next.js
├── public/                # Arquivos estáticos
├── package.json           # Dependências do frontend
├── next.config.ts
├── tsconfig.json
│
└── backend/               # API Node.js (deploy separado — Railway, Render etc.)
    ├── src/
    │   └── server.ts      # Ponto de entrada da API
    └── prisma/
        └── schema.prisma  # Modelos do banco de dados
```

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js 18+
- PostgreSQL instalado e rodando
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

# Configure a variável de ambiente
cp .env.example .env
# Edite o .env com sua DATABASE_URL do PostgreSQL

npm install
npm run db:migrate    # Aplica as migrations no banco
npm run dev           # Inicia o servidor em modo desenvolvimento
# Acesse: http://localhost:3001
```

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
  Feito com 🎟️ e ☕ por <strong>so-tha</strong> — Identidade visual criada com o auxílio da <strong>IA Gemini</strong>
</p>
