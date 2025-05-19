import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '../config/db';
import generateToken from '../utils/generateToken';
import { SuperAdminResponse } from '../models/SuperAdmin';

// @desc    Register a new super admin
// @route   POST /api/super-admin/register
// @access  Public
export const registerSuperAdmin = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone } = req.body;

  try {
    // Check if super admin exists
    const existingAdmins = await query('SELECT * FROM SuperAdmins WHERE email = ?', [email]);

    if (existingAdmins.length > 0) {
      res.status(400).json({ message: 'Super Admin already exists with this email' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create super admin - set as verified by default
    const result = await query(
      'INSERT INTO SuperAdmins (name, email, password, phone, is_verified) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 1]  // Set is_verified to 1
    );

    if (result.insertId) {
      // Return success response with token for immediate login
      const token = generateToken(result.insertId);
      res.status(201).json({
        message: 'Super Admin registered successfully.',
        super_admin_id: result.insertId,
        token
      });
    } else {
      res.status(400).json({ message: 'Invalid super admin data' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Verify super admin email
// @route   GET /api/super-admin/verify/:token
// @access  Public
export const verifySuperAdmin = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;

  try {
    // Find super admin with this verification token
    const admins = await query(
      'SELECT * FROM SuperAdmins WHERE verification_token = ? AND token_expiry > NOW()',
      [token]
    );

    if (admins.length === 0) {
      res.status(400).json({ message: 'Invalid or expired verification token' });
      return;
    }

    // Update super admin to verified
    await query(
      'UPDATE SuperAdmins SET is_verified = 1, verification_token = NULL, token_expiry = NULL WHERE super_admin_id = ?',
      [admins[0].super_admin_id]
    );

    res.status(200).json({ message: 'Email verified successfully. You can now login.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Auth super admin & get token
// @route   POST /api/super-admin/login
// @access  Public
export const loginSuperAdmin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Find super admin by email
    const admins = await query('SELECT * FROM SuperAdmins WHERE email = ?', [email]);

    if (admins.length === 0) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const admin = admins[0];

    // Check if password matches
    const isMatch = await bcrypt.compare(password, admin.password);

    if (isMatch) {
      const response: SuperAdminResponse = {
        super_admin_id: admin.super_admin_id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        token: generateToken(admin.super_admin_id)
      };
      
      res.json(response);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get super admin profile
// @route   GET /api/super-admin/profile
// @access  Private
export const getSuperAdminProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by the auth middleware
    const adminId = req.user.id;
    
    const admins = await query('SELECT super_admin_id, name, email, phone, created_at FROM SuperAdmins WHERE super_admin_id = ?', [adminId]);

    if (admins.length === 0) {
      res.status(404).json({ message: 'Super Admin not found' });
      return;
    }

    res.json(admins[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all super admins
// @route   GET /api/super-admin
// @access  Private (Super Admin only)
export const getAllSuperAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const superAdmins = await query(
      'SELECT super_admin_id, name, email, phone, created_at FROM SuperAdmins ORDER BY name ASC'
    );
    
    res.json(superAdmins);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Check verification status and resend token if needed
// @route   POST /api/super-admin/resend-verification
// @access  Public
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    // Find super admin by email
    const admins = await query('SELECT * FROM SuperAdmins WHERE email = ?', [email]);

    if (admins.length === 0) {
      res.status(404).json({ message: 'No account found with this email' });
      return;
    }

    const admin = admins[0];

    if (admin.is_verified) {
      res.status(400).json({ message: 'This account is already verified' });
      return;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Update verification token
    await query(
      'UPDATE SuperAdmins SET verification_token = ?, token_expiry = ? WHERE super_admin_id = ?',
      [verificationToken, tokenExpiry, admin.super_admin_id]
    );

    res.status(200).json({
      message: 'New verification token generated',
      verification_token: verificationToken
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}; 