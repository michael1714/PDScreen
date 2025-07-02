-- Migration script to add missing fields for dashboard functionality
-- Based on current database schema analysis

-- Add department field to position_descriptions table
ALTER TABLE position_descriptions 
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add ai_automation_score_sum field to position_descriptions table
ALTER TABLE position_descriptions 
ADD COLUMN IF NOT EXISTS ai_automation_score_sum NUMERIC DEFAULT NULL;

-- Add ai_automation_missing_count field to position_descriptions table
ALTER TABLE position_descriptions 
ADD COLUMN IF NOT EXISTS ai_automation_missing_count INTEGER DEFAULT 0;

-- Add ai_automation_score field to responsibilities table (if not exists)
ALTER TABLE responsibilities 
ADD COLUMN IF NOT EXISTS ai_automation_score NUMERIC DEFAULT NULL;

-- Add ai_automation_percentage field to responsibilities table (if not exists)
ALTER TABLE responsibilities 
ADD COLUMN IF NOT EXISTS ai_automation_percentage NUMERIC DEFAULT NULL;

-- Add ai_automation_reason field to responsibilities table (if not exists)
ALTER TABLE responsibilities 
ADD COLUMN IF NOT EXISTS ai_automation_reason TEXT DEFAULT NULL;

-- Add is_llm_version field to responsibilities table (if not exists)
ALTER TABLE responsibilities 
ADD COLUMN IF NOT EXISTS is_llm_version BOOLEAN DEFAULT FALSE;

-- Add LLM_Desc field to responsibilities table (if not exists)
ALTER TABLE responsibilities 
ADD COLUMN IF NOT EXISTS "LLM_Desc" TEXT DEFAULT NULL;

-- Add updated_at field to position_descriptions table (if not exists)
ALTER TABLE position_descriptions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index for better performance on company_id
CREATE INDEX IF NOT EXISTS idx_position_descriptions_company_id ON position_descriptions(company_id);

-- Create index for better performance on upload_date
CREATE INDEX IF NOT EXISTS idx_position_descriptions_upload_date ON position_descriptions(upload_date);

-- Create index for better performance on department
CREATE INDEX IF NOT EXISTS idx_position_descriptions_department ON position_descriptions(department);

-- Create index for better performance on status
CREATE INDEX IF NOT EXISTS idx_position_descriptions_status ON position_descriptions(status);

-- Create index for better performance on ai_automation_score_sum
CREATE INDEX IF NOT EXISTS idx_position_descriptions_ai_score ON position_descriptions(ai_automation_score_sum);

-- Create index for better performance on responsibilities pd_id
CREATE INDEX IF NOT EXISTS idx_responsibilities_pd_id ON responsibilities(pd_id);

-- Create index for better performance on users company_id
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_position_descriptions_updated_at 
    BEFORE UPDATE ON position_descriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create company_info_blocks table
CREATE TABLE IF NOT EXISTS company_info_blocks (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_company_info_blocks_company_id ON company_info_blocks(company_id);
CREATE INDEX IF NOT EXISTS idx_company_info_blocks_is_active ON company_info_blocks(is_active);

-- Create a trigger to automatically update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_company_info_blocks_updated_at
    BEFORE UPDATE ON company_info_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to the table and columns for documentation
COMMENT ON TABLE company_info_blocks IS 'Stores reusable blocks of company information for position descriptions';
COMMENT ON COLUMN company_info_blocks.id IS 'Primary key';
COMMENT ON COLUMN company_info_blocks.company_id IS 'Reference to the company this block belongs to';
COMMENT ON COLUMN company_info_blocks.title IS 'Title of the information block';
COMMENT ON COLUMN company_info_blocks.description IS 'Rich text content of the information block';
COMMENT ON COLUMN company_info_blocks.is_active IS 'Whether this block is currently active and available for use';
COMMENT ON COLUMN company_info_blocks.created_at IS 'Timestamp when the block was created';
COMMENT ON COLUMN company_info_blocks.updated_at IS 'Timestamp when the block was last updated';
COMMENT ON COLUMN company_info_blocks.created_by IS 'User who created this block';
COMMENT ON COLUMN company_info_blocks.updated_by IS 'User who last updated this block';

-- Grant appropriate permissions (adjust according to your needs)
GRANT SELECT, INSERT, UPDATE ON company_info_blocks TO pdscreen_app;
GRANT USAGE ON SEQUENCE company_info_blocks_id_seq TO pdscreen_app;

-- Add new company information fields
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS company_information TEXT,
ADD COLUMN IF NOT EXISTS company_values TEXT,
ADD COLUMN IF NOT EXISTS company_mission TEXT; 