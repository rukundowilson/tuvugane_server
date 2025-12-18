import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import generateToken from '../utils/generateToken';
import { Admin, CreateAdminDto, UpdateAdminDto, AdminResponse } from '../models/Admin';
import jwt from 'jsonwebtoken';

// @desc    Create a new admin for an agency
// @route   POST /api/admins
// @access  Private (Super Admin only)
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, agency_id }: CreateAdminDto = req.body;

    // Validate required fields
    if (!name || !email || !password || !agency_id) {
      res.status(400).json({ message: 'All fields are required: name, email, password, agency_id' });
      return;
    }

    // Check if admin with the same email already exists
    const existingAdmins = await query('SELECT * FROM admins WHERE email = ?', [email]);
    
    if (existingAdmins.length > 0) {
      res.status(400).json({ message: 'An admin with this email already exists' });
      return;
    }

    // Check if the agency exists
    const agencies = await query('SELECT * FROM agencies WHERE agency_id = ?', [agency_id]);
    
    if (agencies.length === 0) {
      res.status(400).json({ message: 'The specified agency does not exist' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new admin
    const result = await query(
      'INSERT INTO admins (name, email, password_hash, agency_id) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, agency_id]
    );

    if (result.insertId) {
      // Fetch the newly created admin
      const admins = await query(
        'SELECT admin_id, name, email, agency_id, created_at FROM admins WHERE admin_id = ?',
        [result.insertId]
      );
      
      // Generate token for the new admin with role information
      const token = generateToken(admins[0].admin_id, 'agency_admin', admins[0].agency_id);
      
      const response: AdminResponse = {
        ...admins[0],
        token,
        role: 'agency_admin'
      };
      
      res.status(201).json({
        message: 'Admin created successfully',
        admin: response
      });
    } else {
      res.status(400).json({ message: 'Failed to create admin' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all admins
// @route   GET /api/admins
// @access  Private (Super Admin only)
export const getAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    // Join with Agencies table to get agency name
    const admins = await query(`
      SELECT a.admin_id, a.name, a.email, a.agency_id, a.created_at, ag.name as agency_name
      FROM admins a
      LEFT JOIN agencies ag ON a.agency_id = ag.agency_id
      ORDER BY a.name ASC
    `);
    
    res.json(admins);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get admins by agency
// @route   GET /api/admins/agency/:agencyId
// @access  Private (Super Admin and Agency Admins)
export const getAdminsByAgency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agencyId } = req.params;
    
    // Check if the agency exists
    const agencies = await query('SELECT * FROM agencies WHERE agency_id = ?', [agencyId]);
    
    if (agencies.length === 0) {
      res.status(404).json({ message: 'Agency not found' });
      return;
    }
    
    const admins = await query(`
      SELECT admin_id, name, email, agency_id, created_at
      FROM admins
      WHERE agency_id = ?
      ORDER BY name ASC
    `, [agencyId]);
    
    res.json(admins);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get admin by ID
// @route   GET /api/admins/:id
// @access  Private (Super Admin and Same Agency Admins)
export const getAdminById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Join with Agencies table to get agency name
    const admins = await query(`
      SELECT a.admin_id, a.name, a.email, a.agency_id, a.created_at, ag.name as agency_name
      FROM admins a
      LEFT JOIN agencies ag ON a.agency_id = ag.agency_id
      WHERE a.admin_id = ?
    `, [id]);
    
    if (admins.length === 0) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }
    
    res.json(admins[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update admin
// @route   PUT /api/admins/:id
// @access  Private (Super Admin and Same Admin)
export const updateAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, password, agency_id }: UpdateAdminDto = req.body;
    
    // Check if admin exists
    const admins = await query('SELECT * FROM admins WHERE admin_id = ?', [id]);
    
    if (admins.length === 0) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== admins[0].email) {
      const emailCheck = await query('SELECT * FROM admins WHERE email = ? AND admin_id != ?', [email, id]);
      
      if (emailCheck.length > 0) {
        res.status(400).json({ message: 'An admin with this email already exists' });
        return;
      }
    }

    // Check if agency_id is provided and exists
    if (agency_id) {
      const agencies = await query('SELECT * FROM agencies WHERE agency_id = ?', [agency_id]);
      
      if (agencies.length === 0) {
        res.status(400).json({ message: 'The specified agency does not exist' });
        return;
      }
    }
    
    // Build the update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    
    if (password !== undefined) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.push('password_hash = ?');
      updateValues.push(hashedPassword);
    }
    
    if (agency_id !== undefined) {
      updateFields.push('agency_id = ?');
      updateValues.push(agency_id);
    }
    
    // Only update if there are fields to update
    if (updateFields.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }
    
    // Add the admin ID to values array
    updateValues.push(id);
    
    // Execute the update query
    await query(
      `UPDATE admins SET ${updateFields.join(', ')} WHERE admin_id = ?`,
      updateValues
    );
    
    // Fetch the updated admin with agency name
    const updatedAdmins = await query(`
      SELECT a.admin_id, a.name, a.email, a.agency_id, a.created_at, ag.name as agency_name
      FROM admins a
      LEFT JOIN agencies ag ON a.agency_id = ag.agency_id
      WHERE a.admin_id = ?
    `, [id]);
    
    res.json({
      message: 'Admin updated successfully',
      admin: updatedAdmins[0]
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admins/:id
// @access  Private (Super Admin only)
export const deleteAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if admin exists
    const admins = await query('SELECT * FROM admins WHERE admin_id = ?', [id]);
    
    if (admins.length === 0) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }
    
    // Delete the admin
    await query('DELETE FROM admins WHERE admin_id = ?', [id]);
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Admin login
// @route   POST /api/admins/login
// @access  Public
export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Login attempt with:', { email: req.body.email });
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }
    
    // Find admin by email
    const admins = await query('SELECT * FROM admins WHERE email = ?', [email]);
    
    console.log('Admin found:', admins.length > 0 ? 'Yes' : 'No');
    
    if (admins.length === 0) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    
    const admin = admins[0];
    console.log('Admin db record:', { 
      admin_id: admin.admin_id, 
      email: admin.email,
      has_password: !!admin.password_hash,
      agency_id: admin.agency_id
    });
    
    // Check if password matches
    try {
      console.log('Comparing password with hash...');
      const isMatch = await bcrypt.compare(password, admin.password_hash);
      console.log('Password match result:', isMatch);
      
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }
    } catch (err) {
      console.error('Error comparing passwords:', err);
      res.status(500).json({ message: 'Error validating credentials' });
      return;
    }
    
    // Check if admin belongs to an agency
    if (!admin.agency_id) {
      res.status(403).json({ message: 'This account is not associated with an agency' });
      return;
    }
    
    // Get agency name
    const agencies = await query('SELECT name FROM agencies WHERE agency_id = ?', [admin.agency_id]);
    const agencyName = agencies.length > 0 ? agencies[0].name : null;
    
    if (!agencyName) {
      res.status(403).json({ message: 'Associated agency not found' });
      return;
    }
    
    // Generate token with admin_id and role
    const token = generateToken(admin.admin_id, 'agency_admin', admin.agency_id);
    
    console.log('Generated token payload:', {
      id: admin.admin_id,
      role: 'agency_admin',
      agency_id: admin.agency_id
    });
    
    const response: AdminResponse = {
      admin_id: admin.admin_id,
      name: admin.name,
      email: admin.email,
      agency_id: admin.agency_id,
      created_at: admin.created_at,
      token,
      role: 'agency_admin'
    };
    
    res.json({
      ...response,
      agency_name: agencyName
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get admin profile
// @route   GET /api/admins/profile
// @access  Private
export const getAdminProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - req.user is added by the auth middleware
    const adminId = req.user.id;
    
    // Join with Agencies table to get agency name
    const admins = await query(`
      SELECT a.admin_id, a.name, a.email, a.agency_id, a.created_at, ag.name as agency_name
      FROM admins a
      LEFT JOIN agencies ag ON a.agency_id = ag.agency_id
      WHERE a.admin_id = ?
    `, [adminId]);
    
    if (admins.length === 0) {
      res.status(404).json({ message: 'Admin not found' });
      return;
    }
    
    res.json(admins[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}; 