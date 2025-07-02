import express from 'express';
import { pool } from '../db/init';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Middleware to check if user is system admin (user ID 1)
const requireSystemAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  if (req.user.id !== 1) {
    return res.status(403).json({ error: 'Access denied. System admin privileges required.' });
  }

  next();
};

// Get all system settings
router.get('/settings', authenticateToken, requireSystemAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM app_settings ORDER BY id ASC'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to fetch system settings' });
  }
});

// Create new system setting
router.post('/settings', authenticateToken, requireSystemAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { key, value, is_encrypted } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    // Check if setting key already exists
    const existingCheck = await pool.query(
      'SELECT id FROM app_settings WHERE key = $1',
      [key]
    );

    if (existingCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Setting key already exists' });
    }

    const result = await pool.query(
      `INSERT INTO app_settings (key, value, is_encrypted, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [key, value, is_encrypted || false, req.user!.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating system setting:', error);
    res.status(500).json({ error: 'Failed to create system setting' });
  }
});

// Update system setting
router.put('/settings/:id', authenticateToken, requireSystemAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { key, value, is_encrypted } = req.body;

    // Check if setting exists
    const existingCheck = await pool.query(
      'SELECT * FROM app_settings WHERE id = $1',
      [id]
    );

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    // Check if setting key already exists (excluding current record)
    if (key) {
      const nameCheck = await pool.query(
        'SELECT id FROM app_settings WHERE key = $1 AND id != $2',
        [key, id]
      );

      if (nameCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Setting key already exists' });
      }
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (key !== undefined) {
      updates.push(`key = $${paramCount}`);
      values.push(key);
      paramCount++;
    }

    if (value !== undefined) {
      updates.push(`value = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    if (is_encrypted !== undefined) {
      updates.push(`is_encrypted = $${paramCount}`);
      values.push(is_encrypted);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add updated_by and updated_at
    updates.push(`updated_by = $${paramCount}`);
    values.push(req.user!.id);
    paramCount++;
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add ID for WHERE clause
    values.push(id);

    const query = `
      UPDATE app_settings 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({ error: 'Failed to update system setting' });
  }
});

export default router; 