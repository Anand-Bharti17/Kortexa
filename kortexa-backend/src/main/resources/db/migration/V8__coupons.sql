CREATE TABLE coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount DECIMAL(10, 2),
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE carts ADD COLUMN coupon_code VARCHAR(50);
ALTER TABLE carts ADD COLUMN discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE carts ADD COLUMN selected_address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL;

ALTER TABLE orders ADD COLUMN shipping_address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0;

INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, active)
VALUES ('WELCOME10', '10% off your first order', 'PERCENT', 10.00, 500.00, 1000, TRUE);
