CREATE TABLE activity_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    actor_email VARCHAR(255),
    actor_role VARCHAR(20),
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id BIGINT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_events_created_at ON activity_events(created_at DESC);
