-- Add avatar_url column to team_members table
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add role, bio, linkedin_url columns if they don't exist
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS linkedin_url text;