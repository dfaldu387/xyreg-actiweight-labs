-- Create KOL Groups Management Tables
CREATE TABLE public.kol_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  expertise_area TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.kol_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for kol_groups
CREATE POLICY "Users can view KOL groups for their companies"
ON public.kol_groups
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage KOL groups for their companies"
ON public.kol_groups
FOR ALL
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
))
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

-- Create KOL group members table
CREATE TABLE public.kol_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.kol_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  expertise_notes TEXT,
  is_lead BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.kol_group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for kol_group_members
CREATE POLICY "Users can view KOL group members for accessible groups"
ON public.kol_group_members
FOR SELECT
USING (group_id IN (
  SELECT kg.id FROM kol_groups kg
  JOIN user_company_access uca ON uca.company_id = kg.company_id
  WHERE uca.user_id = auth.uid()
));

CREATE POLICY "Admins can manage KOL group members"
ON public.kol_group_members
FOR ALL
USING (group_id IN (
  SELECT kg.id FROM kol_groups kg
  JOIN user_company_access uca ON uca.company_id = kg.company_id
  WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin', 'editor')
))
WITH CHECK (group_id IN (
  SELECT kg.id FROM kol_groups kg
  JOIN user_company_access uca ON uca.company_id = kg.company_id
  WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin', 'editor')
));

-- Create hazard categories table for standardized categories
CREATE TABLE public.hazard_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert standard hazard categories
INSERT INTO public.hazard_categories (name, description, sort_order) VALUES
('Biological and Chemical', 'Biocompatibility, toxicity, contamination', 1),
('Energy', 'Electrical, thermal, mechanical energy hazards', 2),
('Environmental', 'Temperature, humidity, pressure conditions', 3),
('Human Factors', 'Use errors, usability issues', 4),
('Functional Failure', 'Device malfunction or failure modes', 5),
('Information Transfer', 'Data integrity, communication errors', 6),
('Moving Parts', 'Mechanical movement hazards', 7),
('Electromagnetic', 'EMC, interference, radiation', 8),
('Software', 'Software defects and failures', 9),
('Network/Connectivity', 'Network security, connectivity issues', 10),
('Cybersecurity', 'Data breaches, unauthorized access', 11),
('Materials', 'Material degradation, incompatibility', 12),
('Manufacturing', 'Production defects, quality issues', 13),
('Packaging/Labeling', 'Inadequate packaging or labeling', 14),
('Storage/Transport', 'Storage and transportation conditions', 15),
('Installation', 'Installation errors or requirements', 16),
('Maintenance', 'Maintenance procedures and errors', 17),
('Disposal', 'End-of-life disposal hazards', 18),
('Regulatory', 'Compliance and regulatory issues', 19);

-- Create KOL invitations/assignments table
CREATE TABLE public.kol_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID NOT NULL,
  kol_group_id UUID NOT NULL REFERENCES public.kol_groups(id) ON DELETE CASCADE,
  hazard_category_id UUID NOT NULL REFERENCES public.hazard_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  deadline DATE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kol_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for kol_assignments
CREATE POLICY "Users can view KOL assignments for their companies"
ON public.kol_assignments
FOR SELECT
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can manage KOL assignments for their companies"
ON public.kol_assignments
FOR ALL
USING (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
))
WITH CHECK (company_id IN (
  SELECT company_id FROM user_company_access 
  WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
));

-- Create KOL assessments table for individual risk assessments
CREATE TABLE public.kol_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.kol_assignments(id) ON DELETE CASCADE,
  hazard_id UUID NOT NULL,
  assessor_id UUID NOT NULL,
  
  -- Risk assessment scores
  initial_severity INTEGER CHECK (initial_severity >= 1 AND initial_severity <= 5),
  initial_probability INTEGER CHECK (initial_probability >= 1 AND initial_probability <= 5),
  initial_risk_rationale TEXT,
  
  residual_severity INTEGER CHECK (residual_severity >= 1 AND residual_severity <= 5),
  residual_probability INTEGER CHECK (residual_probability >= 1 AND residual_probability <= 5),
  residual_risk_rationale TEXT,
  
  -- Assessment details
  risk_control_recommendations TEXT,
  additional_controls_needed TEXT,
  comments TEXT,
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  
  -- Metadata
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(assignment_id, hazard_id, assessor_id)
);

-- Enable RLS
ALTER TABLE public.kol_assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for kol_assessments
CREATE POLICY "Users can view assessments for accessible assignments"
ON public.kol_assessments
FOR SELECT
USING (assignment_id IN (
  SELECT ka.id FROM kol_assignments ka
  JOIN user_company_access uca ON uca.company_id = ka.company_id
  WHERE uca.user_id = auth.uid()
));

CREATE POLICY "KOL members can manage their own assessments"
ON public.kol_assessments
FOR ALL
USING (
  assessor_id = auth.uid() 
  OR assignment_id IN (
    SELECT ka.id FROM kol_assignments ka
    JOIN user_company_access uca ON uca.company_id = ka.company_id
    WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin', 'editor')
  )
)
WITH CHECK (
  assessor_id = auth.uid() 
  OR assignment_id IN (
    SELECT ka.id FROM kol_assignments ka
    JOIN user_company_access uca ON uca.company_id = ka.company_id
    WHERE uca.user_id = auth.uid() AND uca.access_level IN ('admin', 'editor')
  )
);

-- Add category field to hazards table
ALTER TABLE public.hazards ADD COLUMN category_id UUID REFERENCES public.hazard_categories(id);
ALTER TABLE public.hazards ADD COLUMN category TEXT; -- For backward compatibility
ALTER TABLE public.hazards ADD COLUMN assessment_status TEXT DEFAULT 'unassessed';
ALTER TABLE public.hazards ADD COLUMN kol_assignment_id UUID REFERENCES public.kol_assignments(id);

-- Create index for better performance
CREATE INDEX idx_hazards_category_id ON public.hazards(category_id);
CREATE INDEX idx_hazards_product_category ON public.hazards(product_id, category_id);
CREATE INDEX idx_kol_assignments_product_category ON public.kol_assignments(product_id, hazard_category_id);

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kol_groups_updated_at
  BEFORE UPDATE ON public.kol_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kol_assignments_updated_at
  BEFORE UPDATE ON public.kol_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kol_assessments_updated_at
  BEFORE UPDATE ON public.kol_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();