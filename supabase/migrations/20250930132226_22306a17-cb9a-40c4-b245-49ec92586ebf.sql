-- Enhanced System Architecture Tables

-- Add fields to system_architecture_diagrams for enhanced functionality
ALTER TABLE public.system_architecture_diagrams
ADD COLUMN IF NOT EXISTS system_boundary jsonb DEFAULT '{"scope": "", "inclusions": [], "exclusions": []}'::jsonb,
ADD COLUMN IF NOT EXISTS architecture_purpose text,
ADD COLUMN IF NOT EXISTS design_rationale text,
ADD COLUMN IF NOT EXISTS category text DEFAULT 'block_diagram';

-- Create subsystems table
CREATE TABLE IF NOT EXISTS public.system_subsystems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  diagram_id uuid REFERENCES public.system_architecture_diagrams(id) ON DELETE CASCADE,
  subsystem_id text NOT NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('hardware', 'software', 'mechanical', 'user_interface', 'external_service', 'other')),
  responsible_person_id uuid,
  interface_definition text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'designed', 'implemented', 'verified')),
  criticality text DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'safety_critical')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, subsystem_id)
);

-- Create interfaces table
CREATE TABLE IF NOT EXISTS public.system_interfaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  diagram_id uuid REFERENCES public.system_architecture_diagrams(id) ON DELETE CASCADE,
  interface_id text NOT NULL,
  source_subsystem_id uuid REFERENCES public.system_subsystems(id) ON DELETE CASCADE,
  destination_subsystem_id uuid REFERENCES public.system_subsystems(id) ON DELETE CASCADE,
  interface_type text NOT NULL CHECK (interface_type IN ('electrical', 'data', 'mechanical', 'user', 'network', 'other')),
  protocol_specification text,
  data_flow_description text,
  criticality text DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'safety_critical')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, interface_id)
);

-- Create architecture decisions table
CREATE TABLE IF NOT EXISTS public.architecture_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  diagram_id uuid REFERENCES public.system_architecture_diagrams(id) ON DELETE CASCADE,
  decision_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  alternatives_considered text,
  rationale text NOT NULL,
  implications text,
  decision_date date,
  decided_by uuid,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'deprecated')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, decision_id)
);

-- Create architecture patterns table (templates/best practices)
CREATE TABLE IF NOT EXISTS public.architecture_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  description text NOT NULL,
  use_cases text,
  regulatory_context text,
  template_data jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_subsystems_product ON public.system_subsystems(product_id);
CREATE INDEX IF NOT EXISTS idx_system_subsystems_diagram ON public.system_subsystems(diagram_id);
CREATE INDEX IF NOT EXISTS idx_system_subsystems_type ON public.system_subsystems(type);

CREATE INDEX IF NOT EXISTS idx_system_interfaces_product ON public.system_interfaces(product_id);
CREATE INDEX IF NOT EXISTS idx_system_interfaces_diagram ON public.system_interfaces(diagram_id);
CREATE INDEX IF NOT EXISTS idx_system_interfaces_source ON public.system_interfaces(source_subsystem_id);
CREATE INDEX IF NOT EXISTS idx_system_interfaces_destination ON public.system_interfaces(destination_subsystem_id);

CREATE INDEX IF NOT EXISTS idx_architecture_decisions_product ON public.architecture_decisions(product_id);
CREATE INDEX IF NOT EXISTS idx_architecture_decisions_diagram ON public.architecture_decisions(diagram_id);

-- Enable RLS
ALTER TABLE public.system_subsystems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_subsystems
CREATE POLICY "Users can view subsystems for their companies"
  ON public.system_subsystems FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create subsystems for their companies"
  ON public.system_subsystems FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

CREATE POLICY "Users can update subsystems for their companies"
  ON public.system_subsystems FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

CREATE POLICY "Users can delete subsystems for their companies"
  ON public.system_subsystems FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

-- RLS Policies for system_interfaces
CREATE POLICY "Users can view interfaces for their companies"
  ON public.system_interfaces FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create interfaces for their companies"
  ON public.system_interfaces FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

CREATE POLICY "Users can update interfaces for their companies"
  ON public.system_interfaces FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

CREATE POLICY "Users can delete interfaces for their companies"
  ON public.system_interfaces FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

-- RLS Policies for architecture_decisions
CREATE POLICY "Users can view decisions for their companies"
  ON public.architecture_decisions FOR SELECT
  USING (company_id IN (
    SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create decisions for their companies"
  ON public.architecture_decisions FOR INSERT
  WITH CHECK (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

CREATE POLICY "Users can update decisions for their companies"
  ON public.architecture_decisions FOR UPDATE
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

CREATE POLICY "Users can delete decisions for their companies"
  ON public.architecture_decisions FOR DELETE
  USING (company_id IN (
    SELECT company_id FROM user_company_access 
    WHERE user_id = auth.uid() AND access_level IN ('admin', 'editor')
  ));

-- RLS Policies for architecture_patterns
CREATE POLICY "Everyone can view architecture patterns"
  ON public.architecture_patterns FOR SELECT
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_system_subsystems_updated_at
  BEFORE UPDATE ON public.system_subsystems
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_system_interfaces_updated_at
  BEFORE UPDATE ON public.system_interfaces
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_architecture_decisions_updated_at
  BEFORE UPDATE ON public.architecture_decisions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_architecture_patterns_updated_at
  BEFORE UPDATE ON public.architecture_patterns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert default architecture patterns
INSERT INTO public.architecture_patterns (name, category, description, use_cases, regulatory_context, template_data) VALUES
('Client-Server', 'Communication', 'Separates data processing from user interface with network communication', 'Remote monitoring devices, cloud-connected medical devices', 'IEC 62304 for software architecture, consider cybersecurity requirements', '{"nodes": [{"type": "client", "label": "Client"}, {"type": "server", "label": "Server"}], "edges": [{"source": "client", "target": "server"}]}'),
('Sensor-Processor-Display', 'Data Flow', 'Classic pipeline for sensing, processing, and displaying data', 'Vital signs monitors, diagnostic imaging devices', 'IEC 60601-1 for safety, IEC 62304 for software lifecycle', '{"nodes": [{"type": "sensor", "label": "Sensor"}, {"type": "processor", "label": "Processor"}, {"type": "display", "label": "Display"}], "edges": [{"source": "sensor", "target": "processor"}, {"source": "processor", "target": "display"}]}'),
('Layered Architecture', 'Software Design', 'Organized into layers (presentation, business logic, data access)', 'Complex medical software systems, electronic health records', 'IEC 62304 Class B/C software, ISO 14971 risk management', '{"layers": ["Presentation Layer", "Business Logic Layer", "Data Access Layer", "Database"]}'),
('Microservices', 'Distributed Systems', 'Independent services communicating through APIs', 'Cloud-based healthcare platforms, scalable medical data systems', 'Consider data privacy (HIPAA/GDPR), IEC 62304 for each service', '{"services": ["User Service", "Data Service", "Analytics Service", "API Gateway"]}'),
('Redundant Safety Architecture', 'Safety-Critical', 'Redundant components for high-reliability systems', 'Life-support devices, implantable devices', 'IEC 60601-1 safety requirements, ISO 14971 risk controls', '{"components": ["Primary System", "Backup System", "Monitoring System", "Safety Switch"]}')
ON CONFLICT (name) DO NOTHING;