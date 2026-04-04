# 🛒 Kortexa E-Commerce Platform

A full-stack e-commerce solution with a Spring Boot 3 backend and React + Vite frontend. Kortexa is designed to handle high-traffic commerce operations by leveraging a robust microservice-adjacent architecture, in-memory caching, asynchronous event streaming, cloud media storage, and AI-driven content generation.

---

## 🚀 Architectural Highlights

* **High-Speed Read Operations (Redis):** Integrated Spring Data Redis caching on product catalogs, and utilizes Redis Sorted Sets (ZSets) for tracking user session data like "Recently Viewed" and powering a real-time "Frequently Bought Together" recommendation engine.
* **Event-Driven Async Processing (Apache Kafka):** Utilizes Kafka (KRaft mode) to decouple background tasks. Order checkouts instantly produce message payloads to topics (`order-emails`, `order-analytics`), allowing background consumer services to handle SMTP email notifications and analytics aggregations asynchronously without blocking the client's HTTP response.
* **AI-Powered Content Generation & Summarization (Gemini API):** Seamless integration with Google's Gemini AI. 1) When administrators create a new product, the system automatically generates SEO-optimized product descriptions. 2) The system dynamically generates an AI sentiment summary from customer product reviews.
* **Cloud Media Management (Cloudinary):** Direct integration with the Cloudinary API for secure, highly available, and scalable cloud-hosted product image management.
* **Payment Gateway (Razorpay):** Built-in Razorpay order creation and verification to support secure, modern checkout workflows.
* **Advanced Security (JWT & Spring Security):** Secure, stateless authentication using JSON Web Tokens. Implements strict Role-Based Access Control (RBAC) ensuring separation of concerns between `ADMIN` and `CUSTOMER` profiles.
* **Immutable Financial Ledger:** High-precision `BigDecimal` accounting engine to automatically process split payouts (Platform Commission vs. Vendor Wallet) securely upon verified checkouts.
* **Containerized Infrastructure (Docker):** A complete `docker-compose` ecosystem for immediate, reliable provisioning of the PostgreSQL database, Redis cache, and Kafka broker.

---

## 🛠️ Tech Stack & Integrations

**Core Backend:**
* Java 17
* Spring Boot 3.x (Web, Data JPA, Security, Validation)
* Lombok (Boilerplate reduction)
* SLF4J / Logback (Enterprise logging)

**Infrastructure & Data:**
* **Database:** PostgreSQL 15
* **Cache:** Redis
* **Message Broker:** Apache Kafka (KRaft)
* **Containerization:** Docker & Docker Compose

**Third-Party Services:**
* **AI Integration:** Google Gemini API
* **Media Storage:** Cloudinary API
* **Payment Gateway:** Razorpay
* **Email Service:** JavaMailSender (SMTP)
* **Documentation:** Swagger / OpenAPI 3.0

---

## 🌐 Frontend Platform

The frontend application lives in `kortexa-frontend` and is built with React + Vite.

* **UI Framework:** React 19
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Routing:** React Router DOM
* **State Management:** Zustand
* **HTTP Client:** Axios
* **Pages:** Home, Login, Register, Product Detail, Cart, Order History, Order Success, Admin Dashboard, Vendor Dashboard

### Frontend Setup
1. `cd kortexa-frontend`
2. `npm install`
3. `npm run dev`
4. `npm run build` to create a production bundle
5. `npm run preview` to preview the built app

---

## ⚙️ Local Setup & Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
* Java 17+
* Maven 3.8+
* Docker Desktop (or Docker Engine + Compose)

### 2. Start the Infrastructure Cluster
Navigate to the root directory of the project and spin up the backend dependencies (PostgreSQL, Redis, Kafka) using Docker:
\`\`\`bash
docker-compose up -d
\`\`\`
*(Verify all three containers are running smoothly using `docker ps`)*

### 3. Configure Environment Variables
Create or update your `src/main/resources/application.yml` with your specific credentials:

\`\`\`yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/kortexa
    username: postgres
    password: your_db_password
  mail:
    host: smtp.gmail.com
    port: 587
    username: your_email@gmail.com
    password: your_app_password
  kafka:
    bootstrap-servers: localhost:9092
  data:
    redis:
      host: localhost
      port: 6379

cloudinary:
  cloud_name: your_cloud_name
  api_key: your_api_key
  api_secret: your_api_secret

razorpay:
  key-id: your_razorpay_key_id
  key-secret: your_razorpay_key_secret

gemini:
  api-key: your_google_gemini_api_key
\`\`\`

### 4. Run the Application
Start the Spring Boot server:
\`\`\`bash
mvn spring-boot:run
\`\`\`

---

## 📖 Interactive API Documentation

Kortexa features auto-generated, interactive OpenAPI documentation via Swagger UI. Once the application is running, navigate here to explore and test endpoints directly from your browser:

🔗 **Swagger UI:** `http://localhost:8080/swagger-ui/index.html`

> **Security Note for Swagger:** To test protected endpoints, first hit `/api/auth/login` to receive a JWT. Click the green **Authorize** button at the top of the Swagger UI and paste your token.

---

## 🛣️ Comprehensive API Reference

### 🔐 Authentication (`/api/auth`)
* `POST /register`
    * Creates a new user account. Hashes passwords using BCrypt before storing them in PostgreSQL.
* `POST /login`
    * Authenticates credentials and returns a signed JWT Bearer token valid for 24 hours.

### 🛍️ Product Catalog (`/api/products`)
* `GET /` **(Public)**
    * Retrieves a list of all active products.
    * ⚡ *Performance:* Intercepted by Spring Cache (`@Cacheable`); served directly from **Redis RAM** in <10ms on subsequent requests.
* `GET /recently-viewed` **(Customer)**
    * Retrieves the active user's browsing history powered by Redis Sorted Sets (TTL 7 days).
* `GET /{id}` **(Public)**
    * Retrieves specific details for a single product and logs the view in Redis.
* `GET /{id}/frequently-bought-together` **(Public)**
    * Retrieves real-time product recommendations based on co-purchase analytics streamed via Kafka and aggregated in Redis.
* `POST /` **(Admin Only)**
    * Creates a new product.
    * 🌐 *Integration:* Uploads the multipart image file to **Cloudinary** and saves the secure URL.
    * 🤖 *Integration:* Pings the **Gemini API** to automatically generate a rich product description based on the product name/tags.
* `PUT /{id}` **(Admin Only)**
    * Updates pricing, inventory counts, or metadata. Automatically evicts the Redis cache for accurate data consistency.
* `DELETE /{id}` **(Admin Only)**
    * Deletes a product from the catalog.

### ⭐ Customer Reviews (`/api/reviews`)
* `POST /product/{productId}` **(Customer)**
    * Submits a user review and rating. Validates business logic preventing duplicate reviews (updates existing instead).
* `GET /product/{productId}` **(Public)**
    * Retrieves all reviews for a specified product.
* `GET /product/{productId}/summary` **(Public)**
    * Fetches a cached AI-generated sentiment summary built by aggregating recent review comments through Google Gemini.

### 🛒 Shopping Cart (`/api/cart`)
* `GET /` **(Customer)**
    * Retrieves the active session's shopping cart, automatically calculating total relational prices based on current database values.
* `POST /add` **(Customer)**
    * Adds a specific `productId` and `quantity` to the user's cart, handling duplicate item grouping.

### 📦 Orders & Checkout (`/api/orders`)
* `POST /checkout` **(Customer)**
    * **The Core Transactional Engine:**
        1. Evaluates concurrency and applies an **Atomic Redis Lock** per product to definitively prevent overselling during high-traffic Flash Sales.
        2. Validates cart items against real-time database stock.
        3. Deducts purchased quantities from the global inventory and unlocks the Redis monitor.
        4. Locks in purchase prices and creates immutable `Order` and `OrderItem` records.
        5. Wipes the user's shopping cart.
        6. 📨 **Event Trigger:** Produces async payloads to **Apache Kafka** `order-emails` and `order-analytics` topics and immediately returns a `200 OK` to the client.
* `POST /checkout/razorpay` **(Customer)**
    * Completes checkout by verifying Razorpay payment confirmation and creating a fully paid `Order` in a single transactional flow.
* `GET /history` **(Customer)**
    * Returns a chronological list of all past orders for the authenticated user.
* `GET /vendor/stats` **(Vendor)**
    * Returns aggregated vendor revenue, total items sold, and itemized product performance metrics.

### 💳 Payments (`/api/payments`)
* `GET /razorpay/order` **(Customer)**
    * Builds a Razorpay order payload from the authenticated user's cart total and returns the Razorpay `order_id` and `key_id`.
* `POST /charge` **(Customer)**
    * Processes payment for an existing `PENDING` order using internal Razorpay-style validation. Updates the order status to `PAID`, securely triggers the **Ledger** to issue the Vendor's revenue cut, and returns a transaction receipt.

### 💰 Vendor Payouts & Ledgers (`Internal Server Scope`)
* `LedgerService.processOrderPayout()` **(System Daemon)**
    * Handles strictly ACID transaction propagation using Java `BigDecimal` and `RoundingMode`.
    * Atomically intercepts `PAID` events, slices an exact 10% platform commission from the revenue, and immutably appends a `VENDOR_PAYOUT` entry to the `<Ledger>` securing funds into the `<Wallet>` tables.

---

## 🏗️ Background Services (Daemons)

### 📧 Notification Consumer (`EmailService.java`)
* Operates as an independent background worker listening to the `order-emails` Kafka topic.
* Triggers automatically via `@KafkaListener` upon successful checkouts.
* Constructs and dispatches HTML/Text order confirmation receipts via SMTP (JavaMailSender) without blocking the main web server threads.

### 📊 Real-Time Analytics Consumer (`AnalyticsService.java`)
* Operates as a background worker listening to the `order-analytics` Kafka topic.
* Parses product co-purchases from order payloads and updates association scores in Redis ZSets to dynamically power the recommendation engine.

---

## 🤝 Contribution Guidelines
This project is currently maintained as a personal portfolio piece. For major changes, please open an issue first to discuss what you would like to change.