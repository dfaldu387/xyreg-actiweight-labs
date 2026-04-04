-- Phase 1: Product Family Groups and basic relationships

-- Product Family Groups table for logical groupings beyond hierarchies
CREATE TABLE public.product_family_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color_code TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product Accessory Relationships table for main-product ↔ accessory mapping
CREATE TABLE public.product_accessory_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  main_product_id UUID NOT NULL,
  accessory_product_id UUID NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'accessory',
  revenue_attribution_percentage NUMERIC(5,2) DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  typical_quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(main_product_id, accessory_product_id, relationship_type)
);

-- Enable RLS
ALTER TABLE public.product_family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_accessory_relationships ENABLE ROW LEVEL SECURITY;