-- Add missing columns to category table
-- Version: 5
-- Date: 2026-01-27

-- Add code column (unique identifier for category)
ALTER TABLE category ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Update existing categories with generated codes
UPDATE category SET code = 'CAT_' || id WHERE code IS NULL;

-- Make code unique and not null
ALTER TABLE category ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_code ON category(code);

-- Add level column (hierarchy level: 1 for main, 2 for sub)
ALTER TABLE category ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Update levels based on type
UPDATE category SET level = CASE WHEN type = 'MAIN' THEN 1 ELSE 2 END;
