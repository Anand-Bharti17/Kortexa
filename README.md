# Veluno E-Commerce Platform

**Veluno** is a full-stack marketplace (Spring Boot + React) for multi-vendor commerce: catalog browsing, AI-assisted search, wishlists, Razorpay checkout, vendor fulfillment, and platform ledgers. The repo name is *Kortexa*; the customer-facing brand is **Veluno**.

---

## Feature overview

### Storefront (customers)

| Area | Capabilities |
|------|----------------|
| **Home** | Trending & personalized recommendations, featured products, live search with dropdown suggestions, AI search mode |
| **Shop** (`/shop`) | Full catalog with category, price, and sort filters |
| **Search** | Debounced typeahead; multi-keyword matching (name, description, category); optional Gemini refinement |
| **Product detail** | Reviews, AI review summary, “Ask about this product” chat, frequently bought together, recently viewed |
| **Wishlist** | Save products from cards and PDP |
| **Cart & checkout** | Razorpay with server-side signature verification |
| **Orders** | History with delivery timeline (Paid → Shipped → Delivered) |

### Vendor portal

| Area | Capabilities |
|------|----------------|
| **Inventory** | Create/edit products with Cloudinary images and AI-generated descriptions |
| **Featured flag** | Mark products for the homepage featured section |
| **Analytics** | Revenue and per-product performance |
| **Fulfillment** | Mark orders shipped / delivered for owned line items |
| **Wallet** | Balance and recent ledger entries (10% platform commission) |

### Platform & admin

- **RBAC:** `CUSTOMER`, `VENDOR`, `ADMIN`
- **Admin dashboard** for user/vendor oversight
- **Immutable ledger** on paid orders (vendor wallet + commission)
- **Flash-sale locks** (Redis) to reduce oversell during checkout

### AI (Google Gemini)

- Product description generation on create
- Review sentiment summary
- Natural-language **AI search** (keywords + category)
- **Product Q&A** on the product page

### Security (see [kortexa-backend/SECURITY.md](kortexa-backend/SECURITY.md))

- JWT stateless auth; rate-limited login/register
- Razorpay signature verification (no bypass when secret missing)
- Suspended accounts blocked at login and payment
- Validated image uploads (type/size)
- Swagger admin-only by default; configurable CORS and security headers

---

## Architecture highlights

- **PostgreSQL + Flyway** — schema migrations (`V1`–`V6`, including wishlist and `featured` on products)
- **Redis** — product cache, recently viewed, trending scores, FBT ZSets, checkout locks
- **Kafka (KRaft)** — async order emails and co-purchase analytics
- **Cloudinary** — product images
- **Razorpay** — payments

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Backend | Java 17, Spring Boot 4, Spring Security, JPA, Flyway, Spring AI (Gemini) |
| Frontend | React 19, Vite, Tailwind CSS, Zustand, React Router, Axios |
| Data | PostgreSQL 15, Redis, Kafka |
| Ops | Docker Compose (`kortexa-backend/docker-compose.yml`) |

---

## Project structure

```
Kortexa/
├── README.md
├── kortexa-backend/          # Spring Boot API
│   ├── docker-compose.yml    # Postgres, Redis, Kafka
│   ├── src/main/resources/
│   │   ├── application.yaml.example
│   │   └── db/migration/     # Flyway V1–V6
│   └── SECURITY.md
└── kortexa-frontend/         # React storefront
    └── src/
        ├── pages/            # Home, Shop, Cart, Wishlist, Vendor, …
        └── components/       # SearchWithSuggestions, ProductCard, …
```

---

## Local setup

### Prerequisites

- Java 17+, Maven 3.8+
- Node.js 18+ (frontend)
- Docker Desktop

### 1. Infrastructure

```bash
cd kortexa-backend
docker compose up -d
```

### 2. Backend configuration

Copy the example config and fill in secrets (never commit `application.yaml`):

```bash
cp src/main/resources/application.yaml.example src/main/resources/application.yaml
```

Set at minimum: database password, Gemini API key, Cloudinary, Razorpay, and mail credentials as needed.

Flyway runs on startup. If the database was created earlier without Flyway, ensure migration **V6** (`featured` column) is applied — see `application.yaml.example` `flyway.baseline-version`.

### 3. Run backend

```bash
cd kortexa-backend
mvn spring-boot:run
```

API base: `http://localhost:8080/api`  
Swagger (admin or `expose-openapi=true`): `http://localhost:8080/swagger-ui/index.html`

### 4. Run frontend

```bash
cd kortexa-frontend
npm install
npm run dev
```

App: `http://localhost:5173` (expects API at `http://localhost:8080/api`).

---

## Key API endpoints

### Public / catalog

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products/store` | Browse with `search`, `category`, price, sort, pagination |
| GET | `/api/products/store/suggest?q=` | Typeahead suggestions (live search) |
| GET | `/api/products/store/featured` | Homepage featured products |
| GET | `/api/products/store/categories` | Distinct categories |
| GET | `/api/products/{id}` | Product detail (records view / trending) |
| GET | `/api/discovery/trending` | Trending products (Redis) |
| GET | `/api/discovery/recommended` | Personalized (authenticated) |
| POST | `/api/ai/search` | AI query → keywords + category |
| POST | `/api/ai/product/{id}/chat` | Product Q&A |

### Customer (JWT)

| Method | Path | Description |
|--------|------|-------------|
| * | `/api/cart/**` | Cart |
| * | `/api/wishlist/**` | Wishlist |
| * | `/api/orders/**` | Checkout, history |
| * | `/api/payments/**` | Razorpay |

### Vendor (JWT)

| Method | Path | Description |
|--------|------|-------------|
| * | `/api/products/**` | CRUD own products (`featured` in body) |
| GET | `/api/orders/vendor/stats` | Sales analytics |
| GET | `/api/orders/vendor/fulfillment` | Orders to ship |
| PATCH | `/api/orders/{id}/status` | `PAID`→`SHIPPED`→`DELIVERED` |
| GET | `/api/vendor/settlement` | Wallet + ledger |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login → JWT |

---

## Database migrations

| Version | Purpose |
|---------|---------|
| V1 | Core schema (users, products, …) |
| V2 | Orders |
| V3 | Product description fix |
| V4 | Wallets & ledger |
| V5 | Wishlist |
| V6 | `products.featured` flag |

---

## Search behavior

1. **Live search** — After 2+ characters, the UI calls `/store/suggest` and `/store` without pressing Enter.
2. **Token matching** — Backend splits queries on spaces/commas and matches **any** keyword against name, description, or category (e.g. `kids driving toys` matches “Audi **Toy** Car”).
3. **AI search** — Submit with AI mode enabled to let Gemini add keywords and a category; results use the same token engine.

---

## Changelog (recent)

- **Veluno** UI rebrand, design system, logo, favicon
- **Phase 1:** Catalog filters/sort, wishlist
- **Security:** Auth rate limits, Razorpay verification, upload validation, hardened OpenAPI
- **Phase 2:** Discovery (trending/recommended), AI search & product chat, vendor wallet & fulfillment, order timeline, featured products, `/shop` page
- **Search:** Live suggestions, multi-keyword search, AI search improvements

---

## Contributing

Personal portfolio project. Open an issue before large changes.

## License

See repository defaults; adjust if you publish publicly.
