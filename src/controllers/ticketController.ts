import { Request, Response } from 'express';
import { query } from '../config/db';
import { CreateTicketDto, CreateTicketAssignmentDto, TicketResponse, CreateTicketFeedbackDto } from '../models/Ticket';

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Private
export const createTicket = async (req: Request, res: Response): Promise<void> => {
  console.log('createTicket called');
  try {
    // Declare ticket_id variable to use across scopes
    let ticket_id: number | null = null;
    
    // Coerce IDs to numbers and trim strings
    const is_anonymous = req.body.is_anonymous === 'true';
    const user_id = is_anonymous ? null : Number(req.body.user_id);
    const subject = (req.body.subject || '').trim();
    const description = (req.body.description || '').trim();
    const category_id = Number(req.body.category_id);
    const location = (req.body.location || '').trim();
    let agency_id = Number(req.body.agency_id) || 0;  // Allow 0 for auto-assignment
    const photo_url = req.body.photo_url || null;

    // Log received values for debugging
    console.log('Received:', { is_anonymous, user_id, subject, description, category_id, location, agency_id, photo_url });

    // Validate required fields (except agency_id, which can be determined automatically)
    if (!subject || !description || !category_id || !location) {
      res.status(400).json({ message: 'Required fields: subject, description, category_id, location' });
      return;
    }

    // Check if category exists
    const categories = await query('SELECT * FROM categories WHERE category_id = ?', [category_id]);
    if (categories.length === 0) {
      res.status(400).json({ message: 'Category not found' });
      return;
    }

    // Check if user exists (only for non-anonymous submissions)
    if (!is_anonymous) {
      const users = await query('SELECT * FROM users WHERE user_id = ?', [user_id]);
      if (users.length === 0) {
        res.status(400).json({ message: 'User not found' });
        return;
      }
    }

    // If agency_id is not provided or is 0, try to determine it from category mappings
    if (!agency_id) {
      const mappings = await query(
        'SELECT * FROM agencycategorymap WHERE category_id = ? LIMIT 1',
        [category_id]
      );

      if (mappings.length > 0) {
        agency_id = mappings[0].agency_id;
        console.log(`Auto-assigned agency_id ${agency_id} based on category_id ${category_id}`);
      } else {
        // If no mapping is found, we need to check if the agency_id was explicitly required
        if (req.body.agency_id === undefined) {
          // Try to find any agency to assign to
          const agencies = await query('SELECT agency_id FROM agencies LIMIT 1');
          if (agencies.length > 0) {
            agency_id = agencies[0].agency_id;
            console.log(`Fallback to first available agency_id ${agency_id}`);
          } else {
            res.status(400).json({ message: 'No agency found for this category. Please contact an administrator.' });
            return;
          }
        } else {
          res.status(400).json({ message: 'No agency is mapped to handle this category. Please select a different category or contact an administrator.' });
          return;
        }
      }
    } else {
      // If agency_id was provided, verify it exists
      const agencies = await query('SELECT * FROM agencies WHERE agency_id = ?', [agency_id]);
      if (agencies.length === 0) {
        res.status(400).json({ message: 'Agency not found' });
        return;
      }
    }

    try {
      // Try to insert with is_anonymous column
      const result = await query(
        'INSERT INTO tickets (user_id, subject, description, category_id, location, photo_url, status, is_anonymous) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [user_id, subject, description, category_id, location, photo_url, 'Pending', is_anonymous]
      );

      if (result.insertId) {
        // Save ticket_id for later use
        ticket_id = result.insertId;
        
        // Fetch the newly created ticket
        const tickets = await query('SELECT * FROM tickets WHERE ticket_id = ?', [ticket_id]);
        
        res.status(201).json({
          message: 'Ticket created successfully',
          ticket: tickets[0]
        });
      } else {
        res.status(400).json({ message: 'Failed to create ticket' });
      }
    } catch (error: any) {
      // If the error is about missing is_anonymous column, try without it
      if (error.message.includes('is_anonymous')) {
        const result = await query(
          'INSERT INTO tickets (user_id, subject, description, category_id, location, photo_url, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user_id, subject, description, category_id, location, photo_url, 'Pending']
        );

        if (result.insertId) {
          // Save ticket_id for later use
          ticket_id = result.insertId;
          
          // Fetch the newly created ticket
          const tickets = await query('SELECT * FROM tickets WHERE ticket_id = ?', [ticket_id]);
          
          res.status(201).json({
            message: 'Ticket created successfully',
            ticket: tickets[0]
          });
        } else {
          res.status(400).json({ message: 'Failed to create ticket' });
        }
      } else {
        throw error;
      }
    }

    // Create ticket assignment to agency
    if (agency_id && ticket_id) {
      try {
        // Find an admin from this agency to assign the ticket to
        const agencyAdmins = await query(
          'SELECT * FROM admins WHERE agency_id = ? LIMIT 1',
          [agency_id]
        );
        
        if (agencyAdmins.length > 0) {
          // Assign to the first admin found in this agency
          const admin_id = agencyAdmins[0].admin_id;
          console.log(`Assigning ticket to admin_id ${admin_id} from agency_id ${agency_id}`);
          
          await query(
            'INSERT INTO ticketassignments (ticket_id, admin_id) VALUES (?, ?)',
            [ticket_id, admin_id]
          );
          
          // Also store the agency assignment in app state (no table for this yet)
          console.log(`Ticket ${ticket_id} assigned to agency ${agency_id}`);
        } else {
          console.log(`No admin found for agency_id ${agency_id}, ticket will remain unassigned`);
        }
      } catch (assignmentError) {
        console.error('Error assigning ticket to admin:', assignmentError);
        // Continue even if assignment fails - the ticket is still created
      }
    }
  } catch (error: any) {
    console.error('createTicket error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Assign a ticket to an admin
// @route   POST /api/tickets/:ticketId/assign
// @access  Private (Admin only)
export const assignTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const { admin_id }: CreateTicketAssignmentDto = req.body;

    if (!admin_id) {
      res.status(400).json({ message: 'Admin ID is required' });
      return;
    }

    // Check if ticket exists
    const tickets = await query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
    if (tickets.length === 0) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    // Check if admin exists
    const admins = await query('SELECT * FROM admins WHERE admin_id = ?', [admin_id]);
    if (admins.length === 0) {
      res.status(400).json({ message: 'Admin not found' });
      return;
    }

    // Create ticket assignment
    const result = await query(
      'INSERT INTO ticketassignments (ticket_id, admin_id) VALUES (?, ?)',
      [ticketId, admin_id]
    );

    if (result.insertId) {
      // Update ticket status to Assigned
      await query(
        'UPDATE tickets SET status = ? WHERE ticket_id = ?',
        ['Assigned', ticketId]
      );

      // Fetch the assignment details
      const assignments = await query(
        'SELECT * FROM ticketassignments WHERE assignment_id = ?',
        [result.insertId]
      );

      res.status(201).json({
        message: 'Ticket assigned successfully',
        assignment: assignments[0]
      });
    } else {
      res.status(400).json({ message: 'Failed to assign ticket' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get ticket by ID with assignments
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id);

    // Get ticket details
    const tickets = await query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
    
    if (tickets.length === 0) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    // Get ticket assignments
    const assignments = await query(
      'SELECT * FROM ticketassignments WHERE ticket_id = ?',
      [ticketId]
    );

    const ticketResponse: TicketResponse = {
      ...tickets[0],
      assignments: assignments
    };

    res.status(200).json(ticketResponse);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get user's tickets
// @route   GET /api/tickets/user
// @access  Private
export const getUserTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const user_id = req.user?.id;

    if (!user_id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Get user's tickets with category names
    const tickets = await query(`
      SELECT t.*, c.name as category_name 
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `, [user_id]);

    res.status(200).json({
      message: 'Tickets retrieved successfully',
      tickets
    });
  } catch (error: any) {
    console.error('getUserTickets error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get agency's tickets
// @route   GET /api/tickets/agency/:agencyId
// @access  Private
export const getAgencyTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { agencyId } = req.params;
    
    if (!agencyId) {
      res.status(400).json({ message: 'Agency ID is required' });
      return;
    }

    // Validate agency exists
    const agencies = await query('SELECT * FROM agencies WHERE agency_id = ?', [agencyId]);
    if (agencies.length === 0) {
      res.status(404).json({ message: 'Agency not found' });
      return;
    }

    // Get tickets assigned to admins of this agency
    const tickets = await query(`
      SELECT 
        t.ticket_id,
        t.subject,
        t.description,
        t.status,
        t.created_at,
        t.updated_at,
        t.location,
        t.is_anonymous,
        CASE WHEN t.is_anonymous = 1 THEN 'Anonymous' ELSE u.name END as user_name,
        c.name as category_name
      FROM tickets t
      LEFT JOIN users u ON t.user_id = u.user_id
      LEFT JOIN categories c ON t.category_id = c.category_id
      LEFT JOIN ticketassignments ta ON t.ticket_id = ta.ticket_id
      LEFT JOIN admins a ON ta.admin_id = a.admin_id
      WHERE a.agency_id = ?
      ORDER BY t.created_at DESC
    `, [agencyId]);

    res.status(200).json(tickets);
  } catch (error: any) {
    console.error('getAgencyTickets error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Add response to a ticket
// @route   POST /api/tickets/:ticketId/responses
// @access  Private (Admin only)
export const addTicketResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const { message }: { message: string } = req.body;
    const admin_id = req.user?.id;

    if (!admin_id) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!message) {
      res.status(400).json({ message: 'Response message is required' });
      return;
    }

    // Check if ticket exists
    const tickets = await query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
    if (tickets.length === 0) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    // Check if admin is assigned to this ticket
    const assignments = await query(
      'SELECT * FROM ticketassignments WHERE ticket_id = ? AND admin_id = ?',
      [ticketId, admin_id]
    );

    if (assignments.length === 0) {
      // Check if any admin from the same agency is assigned
      const adminAgency = await query('SELECT agency_id FROM admins WHERE admin_id = ?', [admin_id]);
      if (adminAgency.length === 0) {
        res.status(403).json({ message: 'You are not authorized to respond to this ticket' });
        return;
      }

      const agencyId = adminAgency[0].agency_id;
      
      const agencyAssignments = await query(`
        SELECT ta.* 
        FROM ticketassignments ta
        JOIN admins a ON ta.admin_id = a.admin_id
        WHERE ta.ticket_id = ? AND a.agency_id = ?
      `, [ticketId, agencyId]);
      
      if (agencyAssignments.length === 0) {
        res.status(403).json({ message: 'This ticket is not assigned to your agency' });
        return;
      }
      
      // If we get here, the admin is from the same agency as an assigned admin
    }

    // Add response
    const result = await query(
      'INSERT INTO ticketresponses (ticket_id, admin_id, message) VALUES (?, ?, ?)',
      [ticketId, admin_id, message]
    );

    if (result.insertId) {
      // Update ticket status to In Progress if it was Pending
      if (tickets[0].status === 'Pending') {
        await query(
          'UPDATE tickets SET status = ? WHERE ticket_id = ?',
          ['In Progress', ticketId]
        );
      }

      // Fetch the response details with admin information
      const responses = await query(`
        SELECT 
          tr.*,
          a.name as admin_name,
          a.email as admin_email
        FROM ticketresponses tr
        LEFT JOIN admins a ON tr.admin_id = a.admin_id
        WHERE tr.response_id = ?
      `, [result.insertId]);

      res.status(201).json({
        message: 'Response added successfully',
        response: responses[0]
      });
    } else {
      res.status(400).json({ message: 'Failed to add response' });
    }
  } catch (error: any) {
    console.error('addTicketResponse error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get responses for a ticket
// @route   GET /api/tickets/:ticketId/responses
// @access  Private
export const getTicketResponses = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.ticketId);

    // Get ticket responses with admin details
    const responses = await query(`
      SELECT 
        tr.*,
        a.name as admin_name,
        a.email as admin_email
      FROM ticketresponses tr
      LEFT JOIN admins a ON tr.admin_id = a.admin_id
      WHERE tr.ticket_id = ?
      ORDER BY tr.created_at ASC
    `, [ticketId]);

    res.status(200).json(responses);
  } catch (error: any) {
    console.error('getTicketResponses error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update ticket status
// @route   PUT /api/tickets/:id/status
// @access  Private (Admin only)
export const updateTicketStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;
    const admin_id = req.user?.id;

    if (!admin_id) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }

    if (!status) {
      res.status(400).json({ message: 'Status is required' });
      return;
    }

    // Validate status value
    const validStatuses = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ 
        message: `Invalid status value. Valid values are: ${validStatuses.join(', ')}` 
      });
      return;
    }

    // Check if ticket exists
    const tickets = await query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
    if (tickets.length === 0) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    // Check if admin is assigned to this ticket
    const assignments = await query(
      'SELECT * FROM ticketassignments WHERE ticket_id = ? AND admin_id = ?',
      [ticketId, admin_id]
    );

    if (assignments.length === 0) {
      // Check if any admin from the same agency is assigned
      const adminAgency = await query('SELECT agency_id FROM admins WHERE admin_id = ?', [admin_id]);
      if (adminAgency.length === 0) {
        res.status(403).json({ message: 'You are not authorized to update this ticket' });
        return;
      }

      const agencyId = adminAgency[0].agency_id;
      
      const agencyAssignments = await query(`
        SELECT ta.* 
        FROM ticketassignments ta
        JOIN admins a ON ta.admin_id = a.admin_id
        WHERE ta.ticket_id = ? AND a.agency_id = ?
      `, [ticketId, agencyId]);
      
      if (agencyAssignments.length === 0) {
        res.status(403).json({ message: 'This ticket is not assigned to your agency' });
        return;
      }
      
      // If we get here, the admin is from the same agency as an assigned admin
    }

    // Update ticket status
    await query('UPDATE tickets SET status = ? WHERE ticket_id = ?', [status, ticketId]);

    // Return updated ticket
    const updatedTicket = await query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);

    res.status(200).json({
      message: 'Ticket status updated successfully',
      ticket: updatedTicket[0]
    });
  } catch (error: any) {
    console.error('updateTicketStatus error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get ticket by ID with public access (for anonymous tracking)
// @route   GET /api/tickets/public/:id
// @access  Public
export const getPublicTicketById = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.id);

    // Get ticket details with category name
    const tickets = await query(`
      SELECT t.*, c.name as category_name 
      FROM tickets t 
      LEFT JOIN categories c ON t.category_id = c.category_id
      WHERE t.ticket_id = ?
    `, [ticketId]);
    
    if (tickets.length === 0) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    // Filter out sensitive information
    const ticket = tickets[0];
    delete ticket.user_id; // Remove the user_id for privacy
    
    res.status(200).json(ticket);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get ticket responses (public access for anonymous tracking)
// @route   GET /api/tickets/public/:ticketId/responses
// @access  Public
export const getPublicTicketResponses = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.ticketId);

    // Check if ticket exists
    const tickets = await query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
    if (tickets.length === 0) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    // Get responses with admin information
    const responses = await query(`
      SELECT r.*, a.name as admin_name
      FROM ticketresponses r
      LEFT JOIN admins a ON r.admin_id = a.admin_id
      WHERE r.ticket_id = ?
      ORDER BY r.created_at ASC
    `, [ticketId]);

    res.status(200).json(responses);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Add ticket feedback (from anonymous users)
// @route   POST /api/tickets/public/:ticketId/feedback
// @access  Public
export const addTicketFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const { message } = req.body;

    if (!message || message.trim() === '') {
      res.status(400).json({ message: 'Feedback message is required' });
      return;
    }

    // Check if ticket exists
    const tickets = await query('SELECT * FROM tickets WHERE ticket_id = ?', [ticketId]);
    if (tickets.length === 0) {
      res.status(404).json({ message: 'Ticket not found' });
      return;
    }

    // Store feedback in ticketfeedback table
    // Create the table if it doesn't exist yet
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS ticketfeedback (
          feedback_id INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id INT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id)
        )
      `);
    } catch (tableError: any) {
      console.error('Error ensuring ticketfeedback table exists:', tableError);
    }

    // Insert feedback
    const result = await query(
      'INSERT INTO ticketfeedback (ticket_id, message) VALUES (?, ?)',
      [ticketId, message.trim()]
    );

    if (result.insertId) {
      res.status(201).json({
        message: 'Feedback submitted successfully',
        feedback_id: result.insertId
      });
    } else {
      res.status(400).json({ message: 'Failed to submit feedback' });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}; 