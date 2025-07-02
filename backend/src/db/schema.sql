-- Updated database schema based on current database analysis

CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(50) NOT NULL,
    website VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    account_type VARCHAR(20) NOT NULL DEFAULT 'company',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    job_title VARCHAR(100),
    department VARCHAR(100),
    account_type VARCHAR(20) NOT NULL DEFAULT 'personal',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS position_descriptions (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    department VARCHAR(100),
    ai_automation_score_sum NUMERIC,
    ai_automation_missing_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responsibilities (
    id SERIAL PRIMARY KEY,
    pd_id INTEGER NOT NULL REFERENCES position_descriptions(id) ON DELETE CASCADE,
    responsibility_name TEXT NOT NULL,
    responsibility_percentage NUMERIC NOT NULL,
    company_id INTEGER REFERENCES companies(id),
    LLM_Desc TEXT,
    is_llm_version BOOLEAN DEFAULT false,
    ai_automation_percentage INTEGER,
    ai_automation_reason TEXT,
    ai_automation_score NUMERIC
);

-- Company Information Blocks table
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

-- Application Settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_account_type ON companies(account_type);
CREATE INDEX IF NOT EXISTS idx_position_descriptions_company_id ON position_descriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_position_descriptions_upload_date ON position_descriptions(upload_date);
CREATE INDEX IF NOT EXISTS idx_position_descriptions_department ON position_descriptions(department);
CREATE INDEX IF NOT EXISTS idx_position_descriptions_status ON position_descriptions(status);
CREATE INDEX IF NOT EXISTS idx_position_descriptions_ai_score ON position_descriptions(ai_automation_score_sum);
CREATE INDEX IF NOT EXISTS idx_responsibilities_company_id ON responsibilities(company_id);
CREATE INDEX IF NOT EXISTS idx_responsibilities_pd_id ON responsibilities(pd_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_company_info_blocks_company_id ON company_info_blocks(company_id);
CREATE INDEX IF NOT EXISTS idx_company_info_blocks_is_active ON company_info_blocks(is_active);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_position_descriptions_updated_at ON position_descriptions;
CREATE TRIGGER update_position_descriptions_updated_at 
    BEFORE UPDATE ON position_descriptions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data
INSERT INTO content (key, value) 
VALUES ('greeting', 'Hello World!')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;

-- Add default settings
INSERT INTO app_settings (key, value, is_encrypted) 
VALUES 
    ('tinymce_api_key', '', true),
    ('max_file_size_mb', '10', false),
    ('allowed_file_types', 'pdf,doc,docx', false),
    ('company_name', 'PDScreen', false)
ON CONFLICT (key) DO NOTHING; 