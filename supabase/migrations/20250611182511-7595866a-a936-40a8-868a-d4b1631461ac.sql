
-- Create pending_company_users table for users created by admins who haven't signed up yet
CREATE TABLE public.pending_company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  access_level text NOT NULL CHECK (access_level IN ('admin', 'editor', 'viewer')),
  is_internal boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure unique email per company
  UNIQUE(company_id, email)
);

-- Enable RLS
ALTER TABLE public.pending_company_users ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view pending users for their companies"
ON public.pending_company_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.user_id = auth.uid()
    AND uca.company_id = pending_company_users.company_id
  )
);

CREATE POLICY "Admins can manage pending users"
ON public.pending_company_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_company_access uca
    WHERE uca.user_id = auth.uid()
    AND uca.company_id = pending_company_users.company_id
    AND uca.access_level = 'admin'
  )
);

-- Function to automatically handle signup completion
CREATE OR REPLACE FUNCTION public.handle_pending_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_record RECORD;
BEGIN
  -- Check if there's a pending user with this email
  FOR pending_record IN 
    SELECT * FROM pending_company_users 
    WHERE email = NEW.email
  LOOP
    -- Add user to company access
    INSERT INTO user_company_access (
      user_id, company_id, access_level, is_internal
    ) VALUES (
      NEW.id, 
      pending_record.company_id, 
      pending_record.access_level, 
      pending_record.is_internal
    )
    ON CONFLICT (user_id, company_id) DO UPDATE SET
      access_level = EXCLUDED.access_level,
      is_internal = EXCLUDED.is_internal,
      updated_at = now();
    
    -- Remove the pending record
    DELETE FROM pending_company_users WHERE id = pending_record.id;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to handle signup completion
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_pending_user_signup();
