ALTER TABLE reviews ADD COLUMN flagged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN moderation_note VARCHAR(500);

CREATE INDEX idx_reviews_flagged ON reviews(flagged);
