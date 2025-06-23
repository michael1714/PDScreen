import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
        companyId: string;
        accountType: string;
        firstName?: string;
        lastName?: string;
        exp: number;
        iat: number;
    };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret') as any;
        
        // Additional security checks
        if (!decoded.userId || !decoded.companyId || !decoded.email) {
            return res.status(403).json({ error: 'Invalid token structure' });
        }

        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTime) {
            return res.status(403).json({ error: 'Token has expired' });
        }

        // Check if token was issued too far in the past (optional security measure)
        if (decoded.iat && (currentTime - decoded.iat) > 24 * 60 * 60) { // 24 hours
            return res.status(403).json({ error: 'Token is too old' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Optional: Add rate limiting middleware
export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
    // This is a basic implementation - consider using a proper rate limiting library
    // like express-rate-limit for production
    next();
}; 