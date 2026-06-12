# Veluno E-Commerce Platform

**Veluno** is a full-stack multi-vendor marketplace built with **Spring Boot** and **React**. The repository is named *Kortexa*; the customer-facing brand is **Veluno**.

Customers browse and buy from multiple sellers. Vendors manage inventory and fulfill orders. Admins oversee users, orders, coupons, and platform activity.

---

## Table of contents

1. [Quick start](#quick-start)
2. [Feature guide by role](#feature-guide-by-role)
3. [Architecture](#architecture)
4. [Tech stack](#tech-stack)
5. [Project structure](#project-structure)
6. [Local setup](#local-setup)
7. [API reference](#api-reference)
8. [Database migrations](#database-migrations)
9. [Search & discovery](#search--discovery)
10. [AI capabilities](#ai-capabilities)
11. [Order lifecycle](#order-lifecycle)
12. [Security](#security)
13. [Changelog](#changelog)

---

## Quick start

```bash
# 1. Start Postgres, Redis, Kafka
cd kortexa-backend
docker compose up -d

# 2. Configure secrets (see Local setup)
cp src/main/resources/application.yaml.example src/main/resources/application.yaml

# 3. Backend
mvn spring-boot:run

# 4. Frontend (new terminal)
cd ../kortexa-frontend
npm install
npm run dev
```

| Service   | URL |
|-----------|-----|
| Storefront | http://localhost:5173 |
| API base   | http://localhost:8080/api |
| Swagger    | http://localhost:8080/swagger-ui/index.html (admin only by default) |

---

## Feature guide by role

### Customers

| Feature | Route / API | Details |
|---------|-------------|---------|
| **Home** | `/` | Trending products, personalized recommendations (purchase history + FBT + trending), featured section, live search |
| **Shop** | `/shop` | Full catalog with category, price range, and sort filters |
| **Product detail** | `/product/:id` | Reviews, AI review summary, product Q&A chat, frequently bought together, recently viewed |
| **Wishlist** | `/wishlist` | Save products from cards and product pages |
| **Cart & checkout** | `/cart` | Shipping address selection, coupon codes, Razorpay (INR), **AI gift assistant** (budget-based bundle suggestions) |
| **Address book** | `/profile` | Multiple saved addresses; default address auto-selected at checkout |
| **Orders** | `/orders` | Order history with delivery timeline; **request cancellation** (before ship) or **return** (after delivery) |
| **Search** | Home / Shop | Debounced typeahead, multi-keyword matching, PostgreSQL full-text search, optional Gemini AI search mode |

### Vendors

| Feature | Route / API | Details |
|---------|-------------|---------|
| **Inventory** | `/vendor` | Create and edit products with Cloudinary images |
| **AI descriptions** | Product form | Gemini generates marketing copy on create |
| **Featured flag** | Product form | Surface products on the homepage featured section |
| **Analytics** | `/vendor?tab=stats` | Revenue and per-product sales performance |
| **Fulfillment** | `/vendor?tab=fulfillment` | Mark owned line items **Shipped** → **Delivered** |
| **Cancel / return requests** | `/vendor?tab=requests` | Approve or reject customer cancellation and return requests for your products |
| **Wallet** | `/vendor?tab=wallet` | Balance, ledger, and **withdrawal requests** (10% platform commission) |

### Admins

| Feature | Route / API | Details |
|---------|-------------|---------|
| **Dashboard** | `/admin` | User/vendor oversight, **recent activity feed** |
| **All orders** | `/admin/orders` | Paginated platform-wide orders with customer, seller, shipping, and line-item detail |
| **Order requests** | `/admin/order-requests` | Resolve cancellation and return requests platform-wide |
| **Analytics** | `/admin/analytics` | GMV, daily orders, top categories, platform commission estimate |
| **Coupons** | `/admin/coupons` | Create, activate, and deactivate promo codes |
| **Vendor payouts** | `/admin/payouts` | Approve or reject vendor withdrawal requests |
| **RBAC** | — | Roles: `CUSTOMER`, `VENDOR`, `ADMIN` |

### Platform mechanics

- **Immutable ledger** — vendor wallet credits and platform commission recorded on paid orders
- **Flash-sale locks** — Redis locks reduce oversell during checkout
- **Order status emails** — Kafka-driven async emails on status changes (INR amounts)
- **Activity events** — auditable feed of signups, orders, reviews, and status changes

---

## Architecture

```
┌─────────────┐     JWT REST      ┌──────────────────┐
│  React SPA  │ ◄──────────────► │  Spring Boot API │
│  (Vite)     │                   │  (Java 17)       │
└─────────────┘                   └────────┬─────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              ▼                            ▼                            ▼
       ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
       │ PostgreSQL  │              │    Redis    │              │   Kafka     │
       │ + Flyway    │              │ cache, FBT, │              │ emails, FBT │
       │ V1–V12      │              │ locks       │              │ analytics   │
       └─────────────┘              └─────────────┘              └─────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              ▼                            ▼                            ▼
       ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
       │ Cloudinary  │              │  Razorpay   │              │   Gemini    │
       │ images      │              │  payments   │              │  (Spring AI)│
       └─────────────┘              └─────────────┘              └─────────────┘
```

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Backend** | Java 17, Spring Boot 4, Spring Security, JPA, Flyway, Spring AI (Gemini) |
| **Frontend** | React 19, Vite, Tailwind CSS, Zustand, React Router, Axios |
| **Data** | PostgreSQL 15, Redis, Kafka (KRaft) |
| **Integrations** | Cloudinary, Razorpay, SMTP (order emails) |
| **Ops** | Docker Compose (`kortexa-backend/docker-compose.yml`) |

---

## Project structure

```
Kortexa/
├── README.md
├── kortexa-backend/
│   ├── docker-compose.yml          # Postgres, Redis, Kafka
│   ├── SECURITY.md
│   └── src/main/
│       ├── java/.../               # controllers, services, models, DTOs
│       └── resources/
│           ├── application.yaml.example
│           └── db/migration/       # Flyway V1–V12
└── kortexa-frontend/
    └── src/
        ├── pages/                  # Home, Shop, Cart, Orders, Vendor, Admin, …
        ├── components/             # Search, ProductCard, AiCartAssistant, …
        └── store/                  # Zustand (auth, cart, wishlist)
```

---

## Local setup

### Prerequisites

- Java 17+ and Maven 3.8+
- Node.js 18+
- Docker Desktop

### 1. Infrastructure

```bash
cd kortexa-backend
docker compose up -d
```

Starts **PostgreSQL** (port 5432), **Redis** (6379), and **Kafka** (9092).

### 2. Backend configuration

Copy the example config and fill in secrets. **Never commit `application.yaml`.**

```bash
cp src/main/resources/application.yaml.example src/main/resources/application.yaml
```

| Setting | Purpose |
|---------|---------|
| `spring.datasource.password` | PostgreSQL password |
| `spring.ai.google.genai.api-key` | Gemini API key (AI features) |
| `cloudinary.*` | Product image uploads |
| `razorpay.*` | Payment gateway |
| `spring.mail.*` | Order status notification emails |

**Flyway** runs automatically on startup (`spring-boot-starter-flyway`). If your database was created before Flyway was added, set `flyway.baseline-version: 6` in `application.yaml` so existing schema is baselined and V7+ migrations apply cleanly.

### 3. Run backend

```bash
mvn spring-boot:run
```

If port **8080** is already in use, stop the previous Spring Boot process before restarting.

### 4. Run frontend

```bash
cd kortexa-frontend
npm install
npm run dev
```

The app expects the API at `http://localhost:8080/api`.

---

## API reference

### Public — catalog & discovery

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products/store` | Browse with `search`, `category`, `minPrice`, `maxPrice`, `sortBy`, `sortDir`, pagination |
| GET | `/api/products/store/suggest?q=` | Typeahead suggestions |
| GET | `/api/products/store/featured` | Homepage featured products |
| GET | `/api/products/store/categories` | Distinct categories |
| GET | `/api/products/{id}` | Product detail (records view for trending) |
| GET | `/api/discovery/trending` | Trending products (Redis view scores) |
| GET | `/api/discovery/recommended` | Personalized recommendations (requires auth) |
| GET | `/api/reviews/product/{id}` | Public reviews (flagged content hidden) |
| GET | `/api/reviews/product/{id}/average` | Average rating (non-flagged only) |
| GET | `/api/reviews/product/{id}/summary` | AI review summary |
| POST | `/api/ai/search` | Natural-language query → keywords + category |
| POST | `/api/ai/product/{id}/chat` | Product Q&A |

### Customer (JWT, role `CUSTOMER`)

| Method | Path | Description |
|--------|------|-------------|
| * | `/api/cart/**` | Cart CRUD, summary, coupon apply/remove, shipping address |
| * | `/api/addresses/**` | Address book CRUD |
| * | `/api/wishlist/**` | Wishlist |
| POST | `/api/orders/checkout` | Checkout (legacy) |
| POST | `/api/orders/checkout/razorpay` | Checkout after Razorpay payment verification |
| GET | `/api/orders/history` | Order history |
| POST | `/api/orders/{id}/requests/cancel` | Request cancellation (order must be `PAID`) |
| POST | `/api/orders/{id}/requests/return` | Request return (order must be `DELIVERED`) |
| GET | `/api/orders/requests` | Customer's cancel/return requests |
| POST | `/api/ai/cart-suggest` | AI gift bundle under a budget |
| POST | `/api/reviews/product/{id}` | Submit review (AI moderation on save) |
| * | `/api/payments/**` | Razorpay order creation |

### Vendor (JWT, role `VENDOR`)

| Method | Path | Description |
|--------|------|-------------|
| * | `/api/products/**` | CRUD own products (`featured` in body) |
| GET | `/api/orders/vendor/stats` | Sales analytics |
| GET | `/api/orders/vendor/fulfillment` | Orders to fulfill |
| GET | `/api/orders/vendor/requests` | Pending cancel/return requests for vendor's products |
| PATCH | `/api/orders/{id}/status` | `PAID` → `SHIPPED` → `DELIVERED` |
| PATCH | `/api/orders/requests/{id}/resolve` | Approve or reject a request |
| GET | `/api/vendor/settlement` | Wallet balance + recent ledger |
| GET | `/api/vendor/payout-requests` | Vendor's withdrawal history |
| POST | `/api/vendor/payout-requests` | Request withdrawal from wallet balance |

### Admin (JWT, role `ADMIN`)

| Method | Path | Description |
|--------|------|-------------|
| * | `/api/admin/**` | User management, coupons, activity feed |
| GET | `/api/admin/orders` | Paginated all orders (`page`, `size`) |
| GET | `/api/admin/order-requests` | Paginated cancel/return requests (`status` filter optional) |
| PATCH | `/api/admin/order-requests/{id}/resolve` | Approve or reject any request |
| GET | `/api/admin/analytics/overview` | GMV, orders, top categories, 7-day chart |
| GET | `/api/admin/coupons` | List all coupons |
| POST | `/api/admin/coupons` | Create coupon |
| PATCH | `/api/admin/coupons/{id}` | Update coupon (active, description, max uses) |
| GET | `/api/admin/payout-requests` | Paginated vendor withdrawal queue |
| PATCH | `/api/admin/payout-requests/{id}/resolve` | Approve (deduct wallet) or reject |
| GET | `/api/admin/activity` | Recent platform activity events |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (`CUSTOMER` or `VENDOR`) |
| POST | `/api/auth/login` | Login → JWT |

---

## Database migrations

Flyway scripts live in `kortexa-backend/src/main/resources/db/migration/`.

| Version | Purpose |
|---------|---------|
| **V1** | Core schema (users, products, roles) |
| **V2** | Orders and order items |
| **V3** | Product description column fix |
| **V4** | Wallets and immutable ledger |
| **V5** | Wishlist |
| **V6** | `products.featured` flag |
| **V7** | Customer address book |
| **V8** | Coupons and cart discount fields |
| **V9** | Activity events (admin feed) |
| **V10** | Order requests (cancel / return workflow) |
| **V11** | Review moderation (`flagged`, `moderation_note`) |
| **V12** | PostgreSQL GIN full-text search index on products |
| **V13** | Vendor payout withdrawal requests |

---

## Search & discovery

### How search works

1. **Live search** — After 2+ characters, the UI calls `/store/suggest` and `/store` without pressing Enter.
2. **Full-text search (V12)** — Queries of 3+ characters use PostgreSQL `tsvector` / `plainto_tsquery` with relevance ranking; falls back to token matching if FTS returns nothing.
3. **Token matching** — Backend splits on spaces/commas and matches **any** keyword against name, description, or category (e.g. `kids driving toys` matches “Audi **Toy** Car”).
4. **AI search** — With AI mode enabled, Gemini expands the query into keywords and a category; results use the same search pipeline.

### Recommendations

| Signal | Source | Used for |
|--------|--------|----------|
| Product views | Redis `trending:products` | Trending row on Home |
| Recently viewed | Redis per-user ZSet | FBT seed |
| Purchase history | PostgreSQL orders | Same-category and FBT suggestions |
| Co-purchase | Redis `fbt:{productId}` (Kafka-fed) | “Frequently bought together” |

Authenticated users see **recommended** products on Home blending all of the above.

---

## AI capabilities

All AI features use **Google Gemini** via Spring AI (`gemini-2.5-flash` by default).

| Feature | Trigger | Behavior |
|---------|---------|----------|
| **Product descriptions** | Vendor creates product | Generates persuasive copy from name + category |
| **AI search** | Customer submits AI search | Returns keywords, optional category, friendly message |
| **Review summary** | Product page (2+ reviews) | 2-sentence sentiment summary of recent comments |
| **Product Q&A** | “Ask about this product” | Answers from description, category, and review snippets |
| **Review moderation** | Customer submits review | Flags hate speech, spam, profanity; flagged reviews are hidden and rejected |
| **Cart assistant** | Cart page | Suggests 2–4 in-stock products under a budget for an occasion; one-click add bundle |

---

## Order lifecycle

```
PENDING ──(payment)──► PAID ──(vendor)──► SHIPPED ──(vendor)──► DELIVERED
                          │                                        │
                          │ cancel request (approved)              │ return request (approved)
                          ▼                                        ▼
                     CANCELLED                                 RETURNED
```

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting payment |
| `PAID` | Paid; vendor can ship. Customer can **request cancellation** |
| `SHIPPED` | Vendor marked shipped |
| `DELIVERED` | Customer received. Customer can **request return** |
| `CANCELLED` | Cancellation approved; stock restocked |
| `RETURNED` | Return approved; stock restocked |

**Cancel/return flow:** Customer submits a reason → vendor (or admin) approves or rejects → on approval the order status updates and inventory is restored.

---

## Security

See [kortexa-backend/SECURITY.md](kortexa-backend/SECURITY.md) for the full checklist.

| Control | Detail |
|---------|--------|
| **Auth** | Stateless JWT; rate-limited login/register |
| **RBAC** | Route-level role checks in `SecurityConfig` |
| **Payments** | Razorpay HMAC signature verification; no bypass when secret is missing |
| **Accounts** | Suspended users blocked at login and checkout |
| **Uploads** | Image type and size validation before Cloudinary |
| **API docs** | Swagger admin-only by default (`expose-openapi` to change) |
| **Headers** | HSTS, frame deny, CORS configurable via `app.security.cors-allowed-origins` |

---

## Changelog

### Phase 6 — Catalog depth (latest)

- **MRP vs sale price** — list and detail views show strikethrough MRP and discount badge when MRP exceeds sale price
- **Image galleries** — `product_images` table; PDP thumbnail strip from `GET /api/products/{id}/detail`
- **Variants** — size/color/label options with per-variant stock and price adjustments; variant-aware add-to-cart
- **Verified-purchase reviews** — badge on reviews when customer has a delivered order for that product
- **Seller ratings** — aggregate vendor rating on product detail page
- **In-app notifications** — bell in navbar; order paid/shipped/delivered, cancel/return resolution, payout approval/rejection (V14 migration)

### Phase 5 — AI & discovery

- AI **review moderation** on submit; flagged reviews hidden from catalog
- **AI cart assistant** — budget-based gift bundle suggestions on Cart page
- **Smarter recommendations** — blends purchase history, FBT, trending, and recently viewed
- **PostgreSQL full-text search** (V12 GIN index) for catalog queries

### Phase 4 — Vendor & platform ops

- **Admin analytics** — GMV, revenue today, 7-day order chart, top categories
- **Coupon management UI** — create and toggle coupons at `/admin/coupons`
- **Vendor payouts** — withdrawal requests with admin approval and wallet deduction

### Returns & cancellations

- Customer cancel requests (`PAID`) and return requests (`DELIVERED`)
- Vendor and admin resolve queues with approve/reject + optional note
- Stock restocked on approval; new statuses `CANCELLED` / `RETURNED`

### Phase 4 — Admin & vendor ops

- Paginated **admin orders** view with customer, seller, shipping, and line items
- Admin **order requests** page for platform-wide cancel/return resolution

### Phase 3 — Checkout & engagement

- **Address book** with default address at checkout (V7)
- **Coupon codes** on cart with admin management (V8)
- **Activity feed** on admin dashboard (V9)
- **Order status emails** via Kafka (INR formatting)
- Flyway starter fix so migrations run before Hibernate validate

### Phase 2 — Discovery & vendor tools

- Trending / recommended products, AI search & product chat
- Vendor wallet, fulfillment tab, order timeline
- Featured products, dedicated `/shop` page

### Phase 1 & foundation

- Catalog filters/sort, wishlist, Veluno UI rebrand
- Security hardening: auth rate limits, Razorpay verification, upload validation
- Live search, multi-keyword matching, AI search improvements

---

## Contributing

Personal portfolio project. Open an issue before large changes.

## License

See repository defaults; adjust if you publish publicly.
