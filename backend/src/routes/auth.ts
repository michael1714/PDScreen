import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/init';

const router = express.Router();

// Input sanitization function
const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
};

// Email validation
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password strength validation
const isStrongPassword = (password: string): boolean => {
    const minLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// Enhanced input validation middleware
const validateRegistrationInput = (req: Request, res: Response, next: NextFunction) => {
    const { email, password, firstName, lastName, accountType, companyName, industry, companySize } = req.body;
    
    // Sanitize inputs
    const sanitizedData = {
        email: email ? sanitizeInput(email) : '',
        password: password || '',
        firstName: firstName ? sanitizeInput(firstName) : '',
        lastName: lastName ? sanitizeInput(lastName) : '',
        accountType: accountType || '',
        companyName: companyName ? sanitizeInput(companyName) : '',
        industry: industry ? sanitizeInput(industry) : '',
        companySize: companySize ? sanitizeInput(companySize) : ''
    };

    // Validate required fields
    if (!sanitizedData.email || !sanitizedData.password || !sanitizedData.firstName || !sanitizedData.lastName || !sanitizedData.accountType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    if (!isValidEmail(sanitizedData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (!isStrongPassword(sanitizedData.password)) {
        return res.status(400).json({ 
            error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
        });
    }

    // Validate account type
    if (!['personal', 'company'].includes(sanitizedData.accountType)) {
        return res.status(400).json({ error: 'Invalid account type' });
    }

    // Validate company name for company accounts
    if (sanitizedData.accountType === 'company' && !sanitizedData.companyName) {
        return res.status(400).json({ error: 'Company name is required for company accounts' });
    }

    // Validate name length
    if (sanitizedData.firstName.length < 2 || sanitizedData.lastName.length < 2) {
        return res.status(400).json({ error: 'First and last names must be at least 2 characters long' });
    }

    if (sanitizedData.firstName.length > 50 || sanitizedData.lastName.length > 50) {
        return res.status(400).json({ error: 'First and last names must be less than 50 characters' });
    }

    // Store sanitized data for use in route handler
    req.body = sanitizedData;
    next();
};

// Login validation middleware
const validateLoginInput = (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeInput(email);
    
    if (!isValidEmail(sanitizedEmail)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    req.body.email = sanitizedEmail;
    next();
};

// Password reset validation middleware
const validatePasswordResetInput = (req: Request, res: Response, next: NextFunction) => {
    const { email, newPassword } = req.body;
    
    // Sanitize inputs
    const sanitizedData = {
        email: email ? sanitizeInput(email) : '',
        newPassword: newPassword || ''
    };

    // Validate required fields
    if (!sanitizedData.email || !sanitizedData.newPassword) {
        return res.status(400).json({ error: 'Email and new password are required' });
    }

    // Validate email format
    if (!isValidEmail(sanitizedData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (!isStrongPassword(sanitizedData.newPassword)) {
        return res.status(400).json({ 
            error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
        });
    }

    // Store sanitized data for use in route handler
    req.body = sanitizedData;
    next();
};

router.post('/register', validateRegistrationInput, async (req, res) => {
    const { email, password, firstName, lastName, accountType, companyName, industry, companySize } = req.body;

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Check if user already exists
            const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            if (existingUser.rows.length > 0) {
                return res.status(409).json({ error: 'User with this email already exists' });
            }

            let companyId = null;
            if (accountType === 'company') {
                const newCompany = await client.query(
                    'INSERT INTO companies (name, industry, company_size, account_type) VALUES ($1, $2, $3, $4) RETURNING id',
                    [companyName, industry, companySize, 'company']
                );
                companyId = newCompany.rows[0].id;
            } else { // Personal account
                const personalCompanyName = `${firstName} ${lastName} - Personal`;
                const newCompany = await client.query(
                    'INSERT INTO companies (name, industry, company_size, account_type) VALUES ($1, $2, $3, $4) RETURNING id',
                    [personalCompanyName, 'Personal', '1', 'personal']
                );
                companyId = newCompany.rows[0].id;
            }

            const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds for better security
            
            // Set job_title and department for personal accounts
            const jobTitle = accountType === 'personal' ? 'personal user' : (req.body.jobTitle || null);
            const department = accountType === 'personal' ? 'Personal' : (req.body.department || null);

            const newUser = await client.query(
                'INSERT INTO users (email, password_hash, first_name, last_name, account_type, company_id, job_title, department) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, email, first_name, last_name, account_type, company_id',
                [email, hashedPassword, firstName, lastName, accountType, companyId, jobTitle, department]
            );

            const user = newUser.rows[0];

            // Generate JWT token with shorter expiration
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    companyId: user.company_id,
                    accountType: user.account_type,
                    firstName: user.first_name,
                    lastName: user.last_name,
                },
                process.env.JWT_SECRET || 'your_default_secret',
                { expiresIn: '30m' } // Reduced from 1h to 30m for better security
            );
            
            await client.query('COMMIT');

            res.status(201).json({
                message: 'User registered successfully',
                accessToken: token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    accountType: user.account_type,
                    companyId: user.company_id,
                },
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

router.post('/login', validateLoginInput, async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token with shorter expiration
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                companyId: user.company_id,
                accountType: user.account_type,
                firstName: user.first_name,
                lastName: user.last_name,
            },
            process.env.JWT_SECRET || 'your_default_secret',
            { expiresIn: '30m' } // Reduced from 1h to 30m for better security
        );

        res.json({
            message: 'Login successful',
            accessToken: token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                accountType: user.account_type,
                companyId: user.company_id,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Password reset endpoint (no authentication required)
router.post('/reset-password', validatePasswordResetInput, async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        // Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'No account found with this email address' });
        }

        const user = userResult.rows[0];

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update the user's password
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [hashedPassword, email]
        );

        res.json({
            message: 'Password has been successfully reset',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
            },
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Server error during password reset' });
    }
});

export default router; 