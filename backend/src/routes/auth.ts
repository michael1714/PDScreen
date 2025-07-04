import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/init';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Registration route
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('accountType').isIn(['personal', 'company']).withMessage('Invalid account type'),
        body('companyName').if(body('accountType').equals('company')).notEmpty().withMessage('Company name is required for company accounts'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            email,
            password,
            firstName,
            lastName,
            accountType,
        } = req.body;

        // Start with company-provided details
        let { companyName, industry, companySize } = req.body;
        let jobTitle = req.body.jobTitle || null;
        let department = req.body.department || null;

        // Override for personal accounts
        if (accountType === 'personal') {
            companyName = `${firstName} ${lastName} - Personal`;
            industry = 'personal';
            companySize = '1';
            jobTitle = 'Personal user';
            department = 'Personal';
        }

        try {
            // Use a database client for the transaction
            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                // Check if user already exists
                const userExists = await client.query('SELECT * FROM users WHERE email = $1', [email]);
                if (userExists.rows.length > 0) {
                    return res.status(409).json({ error: 'An account with this email already exists.' });
                }

                // Create a company
                const companyResult = await client.query(
                    'INSERT INTO companies (name, industry, company_size, account_type) VALUES ($1, $2, $3, $4) RETURNING *',
                    [companyName, industry, companySize, accountType]
                );
                const newCompany = companyResult.rows[0];

                // Hash password
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(password, salt);

                // Create a user
                const userResult = await client.query(
                    'INSERT INTO users (company_id, email, password_hash, first_name, last_name, account_type, job_title, department) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                    [newCompany.id, email, passwordHash, firstName, lastName, accountType, jobTitle, department]
                );
                const newUser = userResult.rows[0];
                
                // Commit the transaction
                await client.query('COMMIT');

                // Create and sign JWT
                const payload = {
                    user: {
                        id: newUser.id,
                        companyId: newUser.company_id,
                        role: newUser.role, // Assuming a default role or add one to the users table
                    },
                };

                const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret', {
                    expiresIn: '1h',
                });

                res.status(201).json({ 
                    token: accessToken,
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        role: newUser.role
                    }
                });

            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Registration transaction error:', error);
                res.status(500).json({ error: 'Server error during registration' });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Database connection error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Login route
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please enter a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Check if user exists
            const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userResult.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = userResult.rows[0];

            // Check password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Create and sign JWT
            const payload = {
                user: {
                    id: user.id,
                    companyId: user.company_id,
                    role: user.role,
                },
            };

            const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret', {
                expiresIn: '1h', // Token expires in 1 hour
            });

            res.json({ 
                token: accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error during login' });
        }
    }
);

// Refresh token endpoint
router.post('/refresh', authenticateToken, (req: AuthenticatedRequest, res) => {
  // Issue a new JWT with a fresh expiry for the current user
  const payload = { user: req.user };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret', {
    expiresIn: '1h', // or your preferred expiry
  });
  res.json({ accessToken });
});

export default router; 