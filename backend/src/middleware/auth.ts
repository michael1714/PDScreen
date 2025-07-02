import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    companyId: number;
    role: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // No token, unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret', (err: any, user: any) => {
    if (err) {
      return res.sendStatus(403); // Token is invalid or expired
    }
    // Support both flat and nested user payloads
    req.user = user.companyId ? user : user.user;
    next();
  });
}; 