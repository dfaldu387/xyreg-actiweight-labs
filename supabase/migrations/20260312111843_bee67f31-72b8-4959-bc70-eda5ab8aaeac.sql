
-- Junction table for many-to-many parent-child component hierarchy
CREATE TABLE public.device_component_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.device_components(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.device_components(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_id, child_id),
  CHECK (parent_id != child_id)
);

ALTER TABLE public.device_component_hierarchy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage component hierarchy"
  ON public.device_component_hierarchy FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Create indexes for fast lookups
CREATE INDEX idx_device_component_hierarchy_parent ON public.device_component_hierarchy(parent_id);
CREATE INDEX idx_device_component_hierarchy_child ON public.device_component_hierarchy(child_id);

-- Migrate existing parent_id data into the junction table
INSERT INTO public.device_component_hierarchy (parent_id, child_id)
SELECT parent_id, id FROM public.device_components
WHERE parent_id IS NOT NULL;
