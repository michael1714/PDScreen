import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
});

async function initializeDatabase() {
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pool.query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Company Info Blocks
export const getCompanyInfoBlocks = async (companyId: number) => {
  const query = `
    SELECT * FROM company_info_blocks 
    WHERE company_id = $1 
    ORDER BY title ASC`;
  const result = await pool.query(query, [companyId]);
  return result.rows;
};

export const getCompanyInfoBlock = async (id: number, companyId: number) => {
  const query = `
    SELECT * FROM company_info_blocks 
    WHERE id = $1 AND company_id = $2`;
  const result = await pool.query(query, [id, companyId]);
  return result.rows[0];
};

export const createCompanyInfoBlock = async (
  companyId: number,
  userId: number,
  data: {
    title: string;
    description: string;
    is_active: boolean;
  }
) => {
  const query = `
    INSERT INTO company_info_blocks 
    (company_id, title, description, is_active, created_by, updated_by) 
    VALUES ($1, $2, $3, $4, $5, $5) 
    RETURNING *`;
  const values = [companyId, data.title, data.description, data.is_active, userId];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const updateCompanyInfoBlock = async (
  id: number,
  companyId: number,
  userId: number,
  data: {
    title?: string;
    description?: string;
    is_active?: boolean;
  }
) => {
  // Build dynamic update query based on provided fields
  const updates: string[] = [];
  const values: any[] = [id, companyId, userId];
  let paramCount = 3;

  if (data.title !== undefined) {
    updates.push(`title = $${++paramCount}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${++paramCount}`);
    values.push(data.description);
  }
  if (data.is_active !== undefined) {
    updates.push(`is_active = $${++paramCount}`);
    values.push(data.is_active);
  }

  updates.push('updated_by = $3');

  const query = `
    UPDATE company_info_blocks 
    SET ${updates.join(', ')} 
    WHERE id = $1 AND company_id = $2 
    RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const deleteCompanyInfoBlock = async (id: number, companyId: number) => {
  const query = `
    DELETE FROM company_info_blocks 
    WHERE id = $1 AND company_id = $2 
    RETURNING *`;
  const result = await pool.query(query, [id, companyId]);
  return result.rows[0];
};

// App Settings
export const getAppSetting = async (key: string): Promise<string | null> => {
  const query = `
    SELECT value, is_encrypted FROM app_settings 
    WHERE key = $1 OR id = $1::integer`;
  const result = await pool.query(query, [key]);
  if (!result.rows[0]) return null;
  
  // TODO: If is_encrypted is true, decrypt the value before returning
  return result.rows[0].value;
};

export const getAllAppSettings = async (): Promise<Array<{key: string, value: string, is_encrypted: boolean}>> => {
  const query = `
    SELECT key, value, is_encrypted FROM app_settings 
    ORDER BY key`;
  const result = await pool.query(query);
  
  // TODO: Decrypt any encrypted values before returning
  return result.rows;
};

export const updateAppSetting = async (
  key: string,
  value: string,
  userId: number,
  isEncrypted?: boolean
): Promise<void> => {
  // TODO: If isEncrypted is true, encrypt the value before storing
  const query = `
    UPDATE app_settings 
    SET value = $1, 
        updated_by = $2, 
        updated_at = CURRENT_TIMESTAMP,
        is_encrypted = COALESCE($3, is_encrypted)
    WHERE key = $4`;
  await pool.query(query, [value, userId, isEncrypted, key]);
};

export const createAppSetting = async (
  key: string,
  value: string,
  userId: number,
  isEncrypted: boolean = false
): Promise<void> => {
  // TODO: If isEncrypted is true, encrypt the value before storing
  const query = `
    INSERT INTO app_settings (key, value, is_encrypted, created_by, updated_by)
    VALUES ($1, $2, $3, $4, $4)
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        is_encrypted = EXCLUDED.is_encrypted,
        updated_by = EXCLUDED.updated_by,
        updated_at = CURRENT_TIMESTAMP`;
  await pool.query(query, [key, value, isEncrypted, userId]);
};

export const deleteAppSetting = async (key: string): Promise<void> => {
  const query = `DELETE FROM app_settings WHERE key = $1`;
  await pool.query(query, [key]);
};

export { pool, initializeDatabase }; 