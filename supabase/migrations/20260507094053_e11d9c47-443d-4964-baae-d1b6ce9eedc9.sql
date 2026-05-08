ALTER TABLE public.gap_template_items
  ADD COLUMN IF NOT EXISTS applicability_rule jsonb,
  ADD COLUMN IF NOT EXISTS regulatory_dna_attributes jsonb,
  ADD COLUMN IF NOT EXISTS parent_item_id uuid REFERENCES public.gap_template_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gap_template_items_parent_item_id
  ON public.gap_template_items(parent_item_id);