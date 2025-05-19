import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import generateToken from '../utils/generateToken';
import { verifyToken } from '../utils/auth';

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone } = req.body;

  try {
    // Check if user exists
    const existingUsers = await query('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await query(
      'INSERT INTO users (name, email, password, phone, is_anonymous) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 0]
    );

    if (result.insertId) {
      const [user] = await query('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
      
      res.status(201).json({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: generateToken(user.user_id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const user = users[0];

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        token: generateToken(user.user_id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from the authenticated token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.user_id) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Query the database for user profile using MySQL syntax
    const users = await query(
      `SELECT 
        user_id,
        name,
        email,
        phone,
        created_at
      FROM users 
      WHERE user_id = ?`,
      [decoded.user_id]
    );

    if (users.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Return user profile without sensitive information
    const userProfile = users[0];
    res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// @desc    Get user profile and complaints
// @route   GET /api/users/dashboard
// @access  Private
export const getUserDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from request
    if (!req.user || !req.user.id) {
      console.error('Dashboard access attempted without user ID in request');
      res.status(401).json({ message: 'Not authorized, missing user ID' });
      return;
    }
    
    const userId = req.user.id;
    console.log('Fetching dashboard data for user ID:', userId);

    // Get user profile
    const users = await query(
      'SELECT user_id, name, email, phone, created_at FROM users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      console.error(`User with ID ${userId} not found in database`);
      res.status(404).json({ message: 'User not found' });
      return;
    }

    console.log(`Found user: ${users[0].name} (${users[0].email})`);

    // Get user's tickets with category names and assignment details
    const tickets = await query(`
      SELECT 
        t.ticket_id,
        t.subject,
        t.description,
        t.location,
        t.photo_url,
        t.status,
        t.created_at,
        t.updated_at,
        t.is_anonymous,
        c.name as category_name,
        c.category_id,
        a.name as assigned_agency_name,
        a.agency_id
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.category_id
      LEFT JOIN ticketassignments ta ON t.ticket_id = ta.ticket_id
      LEFT JOIN admins ad ON ta.admin_id = ad.admin_id
      LEFT JOIN agencies a ON ad.agency_id = a.agency_id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [userId]);

    console.log(`Found ${tickets.length} tickets for user`);

    // Get statistics
    const stats = await query(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_tickets,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tickets,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets
      FROM tickets
      WHERE user_id = ?
    `, [userId]);

    console.log('Dashboard data retrieved successfully');

    res.json({
      user: users[0],
      tickets,
      statistics: stats[0]
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get user tickets
// @route   GET /api/users/tickets
// @access  Private
export const getUserTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    // Get user's tickets with category names
    const tickets = await query(`
      SELECT 
        t.*,
        c.name as category_name,
        a.name as assigned_agency_name
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.category_id
      LEFT JOIN ticketassignments ta ON t.ticket_id = ta.ticket_id
      LEFT JOIN admins adm ON ta.admin_id = adm.admin_id
      LEFT JOIN agencies a ON adm.agency_id = a.agency_id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [user_id]);

    res.status(200).json({ tickets });
  } catch (error: any) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}; 