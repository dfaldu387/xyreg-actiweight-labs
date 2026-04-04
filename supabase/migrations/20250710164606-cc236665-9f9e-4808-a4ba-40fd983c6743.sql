-- Fix document deletion foreign key constraint issues
-- Add exclusion mechanism for phase_assigned_documents instead of direct deletion

-- First, add an exclusion mechanism to phase_assigned_documents
ALTER TABLE phase_assigned_documents 
ADD COLUMN IF NOT EXISTS is_excluded BOOLEAN DEFAULT FALSE;

-- Create an index for better performance on excluded documents
CREATE INDEX IF NOT EXISTS idx_phase_assigned_documents_excluded 
ON phase_assigned_documents(phase_id, is_excluded) 
WHERE is_excluded = TRUE;

-- Update the view or queries to filter out excluded documents by default
-- This will be handled in the application code

-- For the documents table foreign key constraint, we need to handle it properly
-- When we want to "remove" a document from a phase, we should exclude it, not delete it
-- When we want to permanently delete a document template, we need to:
-- 1. Set template_source_id to NULL in documents table first
-- 2. Then delete from phase_assigned_documents

-- Add a helper function to safely remove template references
CREATE OR REPLACE FUNCTION safely_delete_document_template(template_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- First, remove references from documents table
    UPDATE documents 
    SET template_source_id = NULL 
    WHERE template_source_id = template_id_param;
    
    -- Then delete the template
    DELETE FROM phase_assigned_documents 
    WHERE id = template_id_param;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail
    RAISE WARNING 'Error in safely_delete_document_template: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a helper function to exclude/include documents from phases
CREATE OR REPLACE FUNCTION toggle_document_phase_exclusion(
    phase_name_param TEXT, 
    document_name_param TEXT, 
    company_id_param UUID, 
    exclude_param BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN AS $$
DECLARE
    phase_uuid UUID;
BEGIN
    -- Get the phase ID
    SELECT id INTO phase_uuid 
    FROM phases 
    WHERE name = phase_name_param AND company_id = company_id_param;
    
    IF phase_uuid IS NULL THEN
        RAISE WARNING 'Phase % not found for company %', phase_name_param, company_id_param;
        RETURN FALSE;
    END IF;
    
    -- Update the exclusion status
    UPDATE phase_assigned_documents 
    SET is_excluded = exclude_param 
    WHERE phase_id = phase_uuid AND name = document_name_param;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in toggle_document_phase_exclusion: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;