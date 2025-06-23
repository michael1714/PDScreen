-- Migration script to add company_id to position_descriptions table
-- Run this in pgAdmin to update existing databases

-- Add company_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'position_descriptions' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE position_descriptions ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- For existing position descriptions, we need to associate them with a company
-- This will set all existing PDs to be associated with the first company (or create a default one)
-- You may want to manually review and update these associations after running this script

-- Create a default company for existing PDs if no companies exist
INSERT INTO companies (name, industry, size, account_type) 
SELECT 'Default Company', 'General', '1-10 employees', 'company'
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);

-- Associate existing PDs with the first company (you may want to review this manually)
UPDATE position_descriptions 
SET company_id = (SELECT id FROM companies ORDER BY id LIMIT 1)
WHERE company_id IS NULL; 