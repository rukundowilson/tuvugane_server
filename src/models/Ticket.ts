export interface Ticket {
  ticket_id: number;
  user_id: number;
  subject: string;
  description: string;
  category_id: number;
  location: string;
  photo_url?: string;
  status: 'Pending' | 'Assigned' | 'In Progress' | 'Resolved' | 'Rejected';
  created_at: Date;
  updated_at: Date;
}

export interface CreateTicketDto {
  user_id: number;
  subject: string;
  description: string;
  category_id: number;
  location: string;
  photo_url?: string;
}

export interface TicketAssignment {
  assignment_id: number;
  ticket_id: number;
  admin_id: number;
  assigned_at: Date;
}

export interface CreateTicketAssignmentDto {
  ticket_id: number;
  admin_id: number;
}

export interface TicketResponse extends Ticket {
  assignments?: TicketAssignment[];
}

export interface TicketFeedback {
  response_id: number;
  ticket_id: number;
  admin_id: number;
  message: string;
  created_at: Date;
}

export interface CreateTicketFeedbackDto {
  ticket_id: number;
  admin_id: number;
  message: string;
} 