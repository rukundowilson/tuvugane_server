-- Add is_anonymous column to Tickets table
ALTER TABLE Tickets
ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE;

-- Update existing tickets to be non-anonymous
UPDATE Tickets SET is_anonymous = FALSE WHERE is_anonymous IS NULL; 