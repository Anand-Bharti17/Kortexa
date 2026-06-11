CREATE INDEX IF NOT EXISTS idx_products_fts ON products
USING gin (
    to_tsvector(
        'english',
        coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '')
    )
);
