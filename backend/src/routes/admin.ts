import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/init';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get all users for the company
router.get('/users', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const companyId = req.user.companyId;
        const result = await pool.query(
            `SELECT id, first_name, last_name, email, job_title, department, is_active, created_at 
             FROM users 
             WHERE company_id = $1 
             ORDER BY created_at ASC`,
            [companyId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Add a new user to the company
router.post('/users', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const companyId = req.user.companyId;
        const { firstName, lastName, email, password, jobTitle, department } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'First name, last name, email, and password are required' });
        }

        // Check if email already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Fetch the account_type from the companies table
        const companyResult = await pool.query(
            'SELECT account_type FROM companies WHERE id = $1',
            [companyId]
        );
        if (companyResult.rows.length === 0) {
            return res.status(400).json({ error: 'Company not found' });
        }
        const companyAccountType = companyResult.rows[0].account_type;

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert the new user
        const result = await pool.query(
            `INSERT INTO users (company_id, first_name, last_name, email, password_hash, job_title, department, account_type, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) 
             RETURNING id, first_name, last_name, email, job_title, department, is_active, created_at`,
            [companyId, firstName, lastName, email, passwordHash, jobTitle || null, department || null, companyAccountType]
        );

        res.status(201).json({
            message: 'User created successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user status (active/inactive)
router.put('/users/:id/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const companyId = req.user.companyId;
        const { id } = req.params;
        const { isActive } = req.body;

        // Verify the user belongs to the company
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1 AND company_id = $2',
            [id, companyId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user status
        const result = await pool.query(
            'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3 RETURNING id, first_name, last_name, email, is_active',
            [isActive, id, companyId]
        );

        res.json({
            message: 'User status updated successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Delete a user
router.delete('/users/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const companyId = req.user.companyId;
        const { id } = req.params;

        // Verify the user belongs to the company
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE id = $1 AND company_id = $2',
            [id, companyId]
        );

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete the user
        await pool.query(
            'DELETE FROM users WHERE id = $1 AND company_id = $2',
            [id, companyId]
        );

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get all departments for the company
router.get('/departments', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const companyId = req.user.companyId;
        const result = await pool.query(
            'SELECT id, name, is_active, created_at, updated_at FROM department WHERE company_id = $1 ORDER BY id ASC',
            [companyId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Add a new department
router.post('/departments', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const companyId = req.user.companyId;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }

        const result = await pool.query(
            'INSERT INTO department (company_id, name, is_active) VALUES ($1, $2, true) RETURNING id, name, is_active, created_at, updated_at',
            [companyId, name]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ error: 'Failed to create department' });
    }
});

// Update a department
router.put('/departments/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const companyId = req.user.companyId;
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Department name is required' });
        }

        const result = await pool.query(
            'UPDATE department SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3 RETURNING id, name, is_active, created_at, updated_at',
            [name, id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ error: 'Failed to update department' });
    }
});

// Delete a department
router.delete('/departments/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const companyId = req.user.companyId;
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM department WHERE id = $1 AND company_id = $2 RETURNING id',
            [id, companyId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Department not found' });
        }

        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ error: 'Failed to delete department' });
    }
});

export default router; 