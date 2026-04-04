-- Add BOM revision reference to production orders
ALTER TABLE public.production_orders
  ADD COLUMN bom_revision_id UUID REFERENCES public.bom_revisions(id) ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX idx_production_orders_bom_revision ON public.production_orders(bom_revision_id)
  WHERE bom_revision_id IS NOT NULL;