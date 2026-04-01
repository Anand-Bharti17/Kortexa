-- Create the orders table
CREATE TABLE orders (
                        id BIGSERIAL PRIMARY KEY,
                        user_id BIGINT NOT NULL,
                        total_amount NUMERIC(38, 2) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        order_date TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT fk_customer FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Create the order_items table
CREATE TABLE order_items (
                             id BIGSERIAL PRIMARY KEY,
                             order_id BIGINT NOT NULL,
                             product_id BIGINT NOT NULL,
                             quantity INTEGER NOT NULL,
                             price_at_purchase NUMERIC(38, 2) NOT NULL,
                             CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
                             CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products (id)
);