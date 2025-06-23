-- Migration script to add company filtering to position descriptions
-- Run this in pgAdmin to update existing databases

-- Step 1: Add company_id column to position_descriptions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'position_descriptions' 
        AND column_name = 'company_id'
    ) THEN
        ALTER TABLE position_descriptions ADD COLUMN company_id INTEGER;
    END IF;
END $$;

-- Step 2: Create a default company for existing PDs if no companies exist
INSERT INTO companies (name, industry, size, account_type) 
SELECT 'Default Company', 'General', '1-10 employees', 'company'
WHERE NOT EXISTS (SELECT 1 FROM companies LIMIT 1);

-- Step 3: Associate existing PDs with the first company
UPDATE position_descriptions 
SET company_id = (SELECT id FROM companies ORDER BY id LIMIT 1)
WHERE company_id IS NULL;

-- Step 4: Make company_id NOT NULL and add foreign key constraint
ALTER TABLE position_descriptions 
ALTER COLUMN company_id SET NOT NULL;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'position_descriptions_company_id_fkey'
    ) THEN
        ALTER TABLE position_descriptions 
        ADD CONSTRAINT position_descriptions_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 5: Verify the migration
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_pds,
    COUNT(DISTINCT company_id) as companies_with_pds
FROM position_descriptions;

-- Step 6: Show current company associations (for manual review)
SELECT 
    pd.id as pd_id,
    pd.title,
    pd.company_id,
    c.name as company_name,
    c.account_type
FROM position_descriptions pd
JOIN companies c ON pd.company_id = c.id
ORDER BY pd.id; 