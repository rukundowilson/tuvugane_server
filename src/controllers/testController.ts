import { Request, Response } from 'express';

export const testConnection = (req: Request, res: Response): void => {
  res.status(200).json({ 
    success: true, 
    message: 'Connection successful', 
    timestamp: new Date().toISOString(),
    serverInfo: {
      node: process.version,
      environment: process.env.NODE_ENV
    }
  });
}; 