-- Add start_date and end_date columns to activities table
ALTER TABLE public.activities 
ADD COLUMN start_date date,
ADD COLUMN end_date date;

-- Create an index for better performance on date range queries
CREATE INDEX idx_activities_date_range ON public.activities (start_date, end_date);

-- Update existing activities to migrate due_date to end_date where due_date exists
UPDATE public.activities 
SET end_date = due_date 
WHERE due_date IS NOT NULL AND end_date IS NULL;