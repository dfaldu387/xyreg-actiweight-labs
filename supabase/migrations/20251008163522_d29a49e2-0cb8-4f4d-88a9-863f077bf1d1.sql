-- Add document_assigned to notification types
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'document_assigned';

-- Add document_id and document_name columns to notifications table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'document_id') THEN
    ALTER TABLE notifications ADD COLUMN document_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'document_name') THEN
    ALTER TABLE notifications ADD COLUMN document_name TEXT;
  END IF;
END $$;