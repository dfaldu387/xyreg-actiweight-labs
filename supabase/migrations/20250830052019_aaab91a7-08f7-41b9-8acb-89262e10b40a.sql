-- Fix the mdr_annex_1 table to have proper UUID default for id column
ALTER TABLE public.mdr_annex_1 
ALTER COLUMN id SET DEFAULT gen_random_uuid();