-- Check current structure of phase_assigned_documents table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'phase_assigned_documents' 
ORDER BY ordinal_position;