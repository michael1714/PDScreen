CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
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
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS responsibilities (
    id SERIAL PRIMARY KEY,
    pd_id INTEGER NOT NULL REFERENCES position_descriptions(id) ON DELETE CASCADE,
    responsibility_name TEXT NOT NULL,
    responsibility_percentage NUMERIC NOT NULL,
    llm_wording TEXT
);

-- Insert initial data
INSERT INTO content (key, value) 
VALUES ('greeting', 'Hello World!')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value; 