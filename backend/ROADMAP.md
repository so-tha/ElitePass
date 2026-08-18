# 🗺️ ElitePass — Backend API Roadmap & Technical Specification

> Complete RESTful API specification, database architecture, security protocol, and development roadmap for the ElitePass backend built with **Node.js, Express, TypeScript, and Prisma ORM (PostgreSQL)**.

---

## 📊 Feature Matrix & Development Status

| Module | Feature | Status | Role Required | Endpoint / Details |
|---|---|---|---|---|
| 🔑 **Auth** | User Registration (`CLIENT`, `ORGANIZER`, `DOORMAN`) | ✅ Complete | Public | `POST /api/auth/register` |
| 🔑 **Auth** | User Login & JWT Access/Refresh Cookie issuance | ✅ Complete | Public | `POST /api/auth/login` |
| 🔑 **Auth** | Access Token Refreshing | ✅ Complete | Public | `POST /api/auth/refresh` |
| 🔑 **Auth** | User Logout | ✅ Complete | Public | `POST /api/auth/logout` |
| 🔑 **Auth** | Profile Details (`/me`) | ✅ Complete | Authenticated | `GET /api/auth/me` |
| 🎪 **Events** | List Published Events (with search & category filters) | ✅ Complete | Public | `GET /api/events` |
| 🎪 **Events** | Get Event Details | ✅ Complete | Public | `GET /api/events/:id` |
| 🎪 **Events** | Create Custom Event with Sectors/Tiers & Capacity | ✅ Complete | `ORGANIZER` | `POST /api/events` |
| 🎪 **Events** | List Organizer's Created Events | ✅ Complete | `ORGANIZER` | `GET /api/events/organizer/mine` |
| 🎪 **Events** | Update Event Details & Tier Pricing | ✅ Complete | `ORGANIZER` | `PUT /api/events/:id` |
| 🎪 **Events** | Cancel Event | ✅ Complete | `ORGANIZER` | `DELETE /api/events/:id` |
| 📊 **Metrics**| Real-Time Event Sales & Capacity Metrics | ✅ Complete | `ORGANIZER` | `GET /api/events/:id/stats` |
| 🛒 **Orders** | Create Order & Issue Tickets (ACID Transaction) | ✅ Complete | `CLIENT`, `ORGANIZER` | `POST /api/orders` |
| 🛒 **Orders** | Capacity Check & Overselling Prevention | ✅ Complete | System | Atomic increment in PostgreSQL transaction |
| 🛒 **Orders** | List User's Order History | ✅ Complete | Authenticated | `GET /api/orders/mine` |
| 🛒 **Orders** | View Specific Order Details | ✅ Complete | Order Owner | `GET /api/orders/:id` |
| 🎫 **Tickets**| View Public Shared Ticket | ✅ Complete | Public | `GET /api/tickets/share/:token` |
| 🎫 **Tickets**| Get Ticket Details by Readable Code | ✅ Complete | `DOORMAN`, `ORGANIZER` | `GET /api/tickets/code/:code` |
| 🚪 **Doorman**| Validate Ticket via QR Code Scanning & HMAC Signature | ✅ Complete | `DOORMAN`, `ORGANIZER` | `POST /api/tickets/validate/:code` |
| 🌐 **Catalog**| Ticketmaster Brazil Shows Proxy | ✅ Complete | Public | `GET /api/catalog/shows` |
| 🌐 **Catalog**| TMDB Movies Now Playing Proxy | ✅ Complete | Public | `GET /api/catalog/movies` |

---

## 🗄️ Database Schema Architecture (Prisma & PostgreSQL)

```mermaid
erDiagram
    USER ||--o{ EVENT : "organizes"
    USER ||--o{ ORDER : "places"
    EVENT ||--o{ ORDER : "hosts"
    ORDER ||--|{ TICKET : "contains"

    USER {
        string id PK
        string name
        string email UK
        string cpf UK
        string password
        Role role "CLIENT | ORGANIZER | DOORMAN"
        datetime createdAt
        datetime updatedAt
    }

    EVENT {
        string id PK
        string organizerId FK
        string title
        string description
        string category
        EventType type "SHOW | MOVIE"
        string imageUrl
        string venue
        string city
        datetime date
        int capacity
        int soldCount
        json tiers
        EventStatus status "DRAFT | PUBLISHED | CANCELLED | COMPLETED"
        datetime createdAt
        datetime updatedAt
    }

    ORDER {
        string id PK
        string userId FK
        string eventId FK
        EventType eventType "SHOW | MOVIE"
        string eventName
        string eventDate
        string eventVenue
        string tierId
        string tierLabel
        float priceUnit
        int quantity
        float fee
        float totalAmount
        OrderStatus status "PENDING | CONFIRMED | CANCELLED"
        datetime createdAt
    }

    TICKET {
        string id PK
        string orderId FK
        string code UK "EVT-TI-YYYYMMDD-NNNNNN"
        string qrData "EP:code:hmac_signature"
        string shareToken UK
        TicketStatus status "VALID | USED | CANCELLED"
        datetime usedAt
        datetime createdAt
    }
```

---

## 🔒 Security Protocols

### 1. Multi-Role RBAC (Role-Based Access Control)
- **`CLIENT`**: Can browse events, purchase tickets, view personal order history, and share ticket links.
- **`ORGANIZER`**: Can manage custom events, configure capacity/tier pricing, view real-time sales revenue & occupancy metrics, and validate entries.
- **`DOORMAN`**: Special staff role dedicated strictly to scanning and validating tickets at venue entrance.

### 2. QR Code Security & Fraud Prevention
Every ticket generates a unique QR data string formatted as:
```
EP:<TICKET_CODE>:<HMAC_SHA256_HASH>
```
- The HMAC hash is calculated using a server-side secret (`TICKET_HMAC_SECRET`).
- Adulterated or copied QR codes fail signature verification instantly before touching the database.

### 3. ACID Transactions & Overselling Prevention
- Ordering operations execute inside Prisma interactive database transactions (`prisma.$transaction`).
- When a ticket order is placed for a local event, the backend verifies remaining capacity (`soldCount + quantity <= capacity`) and increments `soldCount` atomically.
- Prevents overbooking under high concurrent purchase conditions.

---

## 🚀 Environment Configuration

Create a `.env` file inside `/backend`:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/elitepass?schema=public"

# Security Secrets
JWT_ACCESS_SECRET="elitepass_super_secret_access_key"
JWT_REFRESH_SECRET="elitepass_super_secret_refresh_key"
TICKET_HMAC_SECRET="elitepass_qr_verification_secret"

# External Integrations (Optional)
TICKETMASTER_API_KEY="your_ticketmaster_key"
TMDB_API_KEY="your_tmdb_key"
TMDB_READ_ACCESS_TOKEN="your_tmdb_bearer_token"
```

---

## 🏃 Running and Testing Backend

```bash
cd backend

# Install dependencies
npm install

# Run database migrations / client generation
npm run db:migrate

# Start development server
npm run dev

# Typecheck & build for production
npm run build
npm start
```
