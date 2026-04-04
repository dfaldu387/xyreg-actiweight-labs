-- Add new fields to documents table for document compliance instance
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS sub_section TEXT,
ADD COLUMN IF NOT EXISTS document_reference TEXT,
ADD COLUMN IF NOT EXISTS version_date DATE,
ADD COLUMN IF NOT EXISTS is_current_effective_version BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS brief_summary TEXT,
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS need_template_update BOOLEAN DEFAULT false;