import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.user_id) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Add user info to request using the unified shape
    req.user = { id: decoded.user_id };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
