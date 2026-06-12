CREATE TABLE payout_requests (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL REFERENCES users(id),
    amount NUMERIC(15, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_note TEXT,
    resolution_note TEXT,
    resolved_by_email VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX idx_payout_requests_vendor ON payout_requests(vendor_id);
CREATE INDEX idx_payout_requests_status ON payout_requests(status);
