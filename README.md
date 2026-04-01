# 🛒 Kortexa E-Commerce Backend Platform

An enterprise-grade, highly scalable RESTful API built with Spring Boot 3. Kortexa is designed to handle high-traffic e-commerce operations by leveraging a robust microservice-adjacent architecture. It features in-memory caching, asynchronous event streaming, cloud media storage, and AI-driven content generation.

---

## 🚀 Architectural Highlights

* **High-Speed Read Operations (Redis):** Integrated Spring Data Redis caching on product catalogs. Bypasses database queries for frequently accessed endpoints, dropping response times from ~150ms to <10ms.
* **Event-Driven Async Processing (Apache Kafka):** Utilizes Kafka (KRaft mode) to decouple background tasks. Order checkouts instantly produce a message payload to a Kafka broker, allowing background consumer services to handle SMTP email notifications asynchronously without blocking the client's HTTP response.
* **AI-Powered Content Generation (Gemini API):** Seamless integration with Google's Gemini AI. When administrators create a new product, the system automatically generates SEO-optimized, engaging product descriptions based on a few keywords.
* **Cloud Media Management (Cloudinary):** Direct integration with the Cloudinary API for secure, highly available, and scalable cloud-hosted product image management.
* **Payment Gateway (Razorpay):** Built-in Razorpay order creation and verification to support secure, modern checkout workflows.
* **Advanced Security (JWT & Spring Security):** Secure, stateless authentication using JSON Web Tokens. Implements strict Role-Based Access Control (RBAC) ensuring separation of concerns between `ADMIN` and `CUSTOMER` profiles.
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
* `GET /{id}` **(Public)**
    * Retrieves specific details for a single product.
* `POST /` **(Admin Only)**
    * Creates a new product.
    * 🌐 *Integration:* Uploads the multipart image file to **Cloudinary** and saves the secure URL.
    * 🤖 *Integration:* Pings the **Gemini API** to automatically generate a rich product description based on the product name/tags.
* `PUT /{id}` **(Admin Only)**
    * Updates pricing, inventory counts, or metadata. Automatically evicts the Redis cache for accurate data consistency.
* `DELETE /{id}` **(Admin Only)**
    * Deletes a product from the catalog.

### 🛒 Shopping Cart (`/api/cart`)
* `GET /` **(Customer)**
    * Retrieves the active session's shopping cart, automatically calculating total relational prices based on current database values.
* `POST /add` **(Customer)**
    * Adds a specific `productId` and `quantity` to the user's cart, handling duplicate item grouping.

### 📦 Orders & Checkout (`/api/orders`)
* `POST /checkout` **(Customer)**
    * **The Core Transactional Engine:**
        1. Validates cart items against real-time database stock.
        2. Deducts purchased quantities from the global inventory.
        3. Locks in purchase prices and creates immutable `Order` and `OrderItem` records.
        4. Wipes the user's shopping cart.
        5. 📨 **Event Trigger:** Produces an async payload (`email|orderId|amount`) to the **Apache Kafka** `order-emails` topic and immediately returns a `200 OK` to the client.
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
    * Processes payment for an existing `PENDING` order using internal Razorpay-style validation. Updates the order status to `PAID` and returns a transaction receipt.

---

## 🏗️ Background Services (Daemons)

### 📧 Notification Consumer (`EmailService.java`)
* Operates as an independent background worker listening to the Kafka broker.
* Triggers automatically via `@KafkaListener` upon successful checkouts.
* Constructs and dispatches HTML/Text order confirmation receipts via SMTP (JavaMailSender) without blocking the main web server threads.

---

## 🤝 Contribution Guidelines
This project is currently maintained as a personal portfolio piece. For major changes, please open an issue first to discuss what you would like to change.