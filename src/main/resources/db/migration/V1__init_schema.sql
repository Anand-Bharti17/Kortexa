-- V1__init_schema.sql

CREATE TABLE users (
                       id BIGSERIAL PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       role VARCHAR(50) NOT NULL,
                       status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
                       created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
                          id BIGSERIAL PRIMARY KEY,
                          vendor_id BIGINT NOT NULL REFERENCES users(id),
                          name VARCHAR(255) NOT NULL,
                          description TEXT,
                          price DECIMAL(19, 2) NOT NULL CHECK (price >= 0),
                          stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
                          category VARCHAR(255),
                          image_url VARCHAR(255),
                          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_users_email ON users(email);