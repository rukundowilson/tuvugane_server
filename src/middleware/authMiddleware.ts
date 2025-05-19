import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  id: number;
  role?: string;
  agency_id?: number;
  iat: number;
  exp: number;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role?: string;
        agency_id?: number;
      };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token;

    // Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ message: 'Not authorized, no token' });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      
      console.log('Token decoded:', decoded);

      // Add user to request with extended information
      req.user = {
        id: decoded.id,
        role: decoded.role,
        agency_id: decoded.agency_id
      };

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if a user is a Super Admin
export const superAdminOnly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized, no user found' });
      return;
    }

    // If role is included in the token, use it for faster verification
    if (req.user.role === 'super-admin') {
      next();
      return;
    }

    // Otherwise check database (backward compatibility)
    const superAdmins = await query('SELECT * FROM SuperAdmins WHERE super_admin_id = ?', [req.user.id]);

    if (superAdmins.length === 0) {
      res.status(403).json({ message: 'Not authorized, super admin access required' });
      return;
    }

    // User is a super admin, proceed
    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Middleware to check if a user is an Agency Admin
export const agencyAdminOnly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized, no user found' });
      return;
    }

    // If role is included in the token, use it for faster verification
    if (req.user.role === 'agency_admin') {
      next();
      return;
    }

    // Otherwise check database (backward compatibility)
    const admins = await query('SELECT * FROM Admins WHERE admin_id = ?', [req.user.id]);

    if (admins.length === 0) {
      res.status(403).json({ message: 'Not authorized, agency admin access required' });
      return;
    }

    // User is an agency admin, proceed
    next();
  } catch (error) {
    console.error('Agency admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 