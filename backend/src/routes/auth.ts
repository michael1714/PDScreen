import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/init';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, JWTPayload } from '../utils/jwt';
import { validateLogin, validateRegistration, handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Login route
router.post('/login', validateLogin, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Query user from database
    const userQuery = `
      SELECT u.*, c.name as company_name, c.account_type as company_account_type
      FROM users u
      JOIN companies c ON u.company_id = c.id
      WHERE u.email = $1 AND u.is_active = true
    `;
    
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    const user = userResult.rows[0];

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Create user response object (exclude password)
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      accountType: user.account_type,
      companyId: user.company_id,
      jobTitle: user.job_title,
      department: user.department,
      companyName: user.company_name
    };

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      userId: user.id.toString(),
      email: user.email,
      companyId: user.company_id.toString(),
      accountType: user.account_type
    });

    const refreshToken = generateRefreshToken({
      userId: user.id.toString(),
      tokenVersion: user.token_version
    });

    // Hash and store refresh token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    res.json({
      success: true,
      user: userResponse,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Registration route
router.post('/register', validateRegistration, handleValidationErrors, async (req: Request, res: Response) => {
  try {
    const { 
      accountType, 
      firstName, 
      lastName, 
      email, 
      password, 
      jobTitle, 
      department,
      companyName,
      industry,
      companySize,
      website,
      address,
      phone
    } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Start transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      let companyId;

      if (accountType === 'company') {
        // Create company record
        const companyResult = await client.query(`
          INSERT INTO companies (name, industry, company_size, website, address, phone, account_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [companyName, industry, companySize, website, address, phone, accountType]);
        
        companyId = companyResult.rows[0].id;
      } else {
        // For personal accounts, create a personal company record
        const personalCompanyResult = await client.query(`
          INSERT INTO companies (name, industry, company_size, account_type)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [`${firstName} ${lastName} - Personal`, 'Personal', '1', 'personal']);
        
        companyId = personalCompanyResult.rows[0].id;
      }

      // Create user record
      const userResult = await client.query(`
        INSERT INTO users (company_id, email, password_hash, first_name, last_name, job_title, department, account_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, first_name, last_name, account_type, job_title, department
      `, [companyId, email, passwordHash, firstName, lastName, jobTitle, department, accountType]);

      await client.query('COMMIT');

      const user = userResult.rows[0];

      // Create user response object
      const userResponse = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        accountType: user.account_type,
        companyId: companyId,
        jobTitle: user.job_title,
        department: user.department
      };

      // Generate JWT tokens
      const accessToken = generateAccessToken({
        userId: user.id.toString(),
        email: user.email,
        companyId: companyId.toString(),
        accountType: user.account_type
      });

      const refreshToken = generateRefreshToken({
        userId: user.id.toString(),
        tokenVersion: 1
      });

      // Hash and store refresh token
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshTokenHash, expiresAt]
      );

      res.json({
        success: true,
        user: userResponse,
        accessToken,
        refreshToken
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Refresh token route
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Refresh token is required' 
      });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    
    // Get user and check token version
    const userResult = await pool.query(
      'SELECT u.*, c.name as company_name FROM users u JOIN companies c ON u.company_id = c.id WHERE u.id = $1 AND u.is_active = true',
      [payload.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid refresh token' 
      });
    }

    const user = userResult.rows[0];

    // Check if token version matches (for logout/security)
    if (user.token_version !== payload.tokenVersion) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid refresh token' 
      });
    }

    // Check if refresh token exists and is not revoked
    const tokenResult = await pool.query(
      'SELECT * FROM refresh_tokens WHERE user_id = $1 AND is_revoked = false AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid refresh token' 
      });
    }

    // Verify the stored token hash
    const isTokenValid = await bcrypt.compare(refreshToken, tokenResult.rows[0].token_hash);
    if (!isTokenValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid refresh token' 
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id.toString(),
      email: user.email,
      companyId: user.company_id.toString(),
      accountType: user.account_type
    });

    res.json({
      success: true,
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Invalid refresh token' 
    });
  }
});

// Logout route
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the refresh token
      const payload = verifyRefreshToken(refreshToken);
      
      // Mark all refresh tokens for this user as revoked
      await pool.query(
        'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
        [payload.userId]
      );

      // Increment token version to invalidate all existing tokens
      await pool.query(
        'UPDATE users SET token_version = token_version + 1 WHERE id = $1',
        [payload.userId]
      );
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router; 