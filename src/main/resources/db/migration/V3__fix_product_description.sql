-- 1. Wipe out the old data (CASCADE clears any linked order_items to prevent foreign key errors)
TRUNCATE TABLE products CASCADE;

-- 2. Drop the corrupted binary column
ALTER TABLE products DROP COLUMN description;

-- 3. Recreate the column as standard text
ALTER TABLE products ADD COLUMN description TEXT;