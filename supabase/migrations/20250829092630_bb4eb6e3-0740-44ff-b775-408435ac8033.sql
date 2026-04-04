-- Add dedicated project_start_date field to products table
ALTER TABLE public.products 
ADD COLUMN project_start_date date;