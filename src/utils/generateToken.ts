import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface TokenPayload {
  id: number;
  role?: string;
  agency_id?: number;
}

const generateToken = (id: number, role?: string, agency_id?: number): string => {
  const payload: TokenPayload = { id };
  
  if (role) {
    payload.role = role;
  }
  
  if (agency_id) {
    payload.agency_id = agency_id;
  }
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30d',
  });
};

export default generateToken; 