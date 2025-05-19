import { Request, Response } from 'express';
import { query } from '../config/db';
import { Agency, CreateAgencyDto, UpdateAgencyDto } from '../models/Agency';

// @desc    Create a new agency
// @route   POST /api/agencies
// @access  Private (Super Admin only)
export const createAgency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, address, description }: CreateAgencyDto = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ message: 'Agency name is required' });
      return;
    }

    // Check if agency with the same name already exists
    const existingAgencies = await query('SELECT * FROM Agencies WHERE name = ?', [name]);
    
    if (existingAgencies.length > 0) {
      res.status(400).json({ message: 'An agency with this name already exists' });
      return;
    }

    // Insert the new agency
    const result = await query(
      'INSERT INTO Agencies (name, email, phone, address, description) VALUES (?, ?, ?, ?, ?)',
      [name, email || null, phone || null, address || null, description || null]
    );

    if (result.insertId) {
      // Fetch the newly created agency
      const agencies = await query('SELECT * FROM Agencies WHERE agency_id = ?', [result.insertId]);
      
      res.status(201).json({
        message: 'Agency created successfully',
        agency: agencies[0]
      });
    } else {
      res.status(400).json({ message: 'Failed to create agency' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all agencies
// @route   GET /api/agencies
// @access  Private
export const getAgencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const agencies = await query('SELECT * FROM Agencies ORDER BY name ASC');
    res.json(agencies);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get agency by ID
// @route   GET /api/agencies/:id
// @access  Private
export const getAgencyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const agencies = await query('SELECT * FROM Agencies WHERE agency_id = ?', [id]);
    
    if (agencies.length === 0) {
      res.status(404).json({ message: 'Agency not found' });
      return;
    }
    
    res.json(agencies[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update agency
// @route   PUT /api/agencies/:id
// @access  Private (Super Admin only)
export const updateAgency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, description }: UpdateAgencyDto = req.body;
    
    // Check if agency exists
    const agencies = await query('SELECT * FROM Agencies WHERE agency_id = ?', [id]);
    
    if (agencies.length === 0) {
      res.status(404).json({ message: 'Agency not found' });
      return;
    }
    
    // Check if name is being changed and if it already exists
    if (name && name !== agencies[0].name) {
      const nameCheck = await query('SELECT * FROM Agencies WHERE name = ? AND agency_id != ?', [name, id]);
      
      if (nameCheck.length > 0) {
        res.status(400).json({ message: 'An agency with this name already exists' });
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
      updateValues.push(email || null);
    }
    
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }
    
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address || null);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description || null);
    }
    
    // Only update if there are fields to update
    if (updateFields.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }
    
    // Add the agency ID to values array
    updateValues.push(id);
    
    // Execute the update query
    await query(
      `UPDATE Agencies SET ${updateFields.join(', ')} WHERE agency_id = ?`,
      updateValues
    );
    
    // Fetch the updated agency
    const updatedAgencies = await query('SELECT * FROM Agencies WHERE agency_id = ?', [id]);
    
    res.json({
      message: 'Agency updated successfully',
      agency: updatedAgencies[0]
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

export const deleteAgency = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if agency exists
    const agencies = await query('SELECT * FROM Agencies WHERE agency_id = ?', [id]);
    
    if (agencies.length === 0) {
      res.status(404).json({ message: 'Agency not found' });
      return;
    }
    
    // Check if agency has associated admins
    const admins = await query('SELECT * FROM admins WHERE agency_id = ?', [id]);
    
    // Warn if agency has associated admins but proceed with deletion
    const hasAdmins = admins.length > 0;
    
    // Delete the agency (Admins will be handled by ON DELETE CASCADE)
    await query('DELETE FROM agencies WHERE agency_id = ?', [id]);
    
    res.json({ 
      message: hasAdmins 
        ? 'Agency and its associated admins deleted successfully' 
        : 'Agency deleted successfully'
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

