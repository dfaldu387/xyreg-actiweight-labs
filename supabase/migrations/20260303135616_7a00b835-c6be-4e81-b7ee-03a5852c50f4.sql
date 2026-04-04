-- Add master device designation and relationship type to products table
-- Phase 1b of Master-Variant Inheritance Architecture

-- Create enum for parent relationship type
CREATE TYPE public.parent_relationship_type AS ENUM ('line_extension', 'variant');

-- Add is_master_device flag
ALTER TABLE public.products
ADD COLUMN is_master_device boolean NOT NULL DEFAULT false;

-- Add parent_relationship_type to disambiguate parent_product_id usage
ALTER TABLE public.products
ADD COLUMN parent_relationship_type public.parent_relationship_type;

-- Index for efficient master device lookups
CREATE INDEX idx_products_is_master_device ON public.products (company_id, is_master_device) WHERE is_master_device = true;

-- Index for variant lookups by parent
CREATE INDEX idx_products_parent_variant ON public.products (parent_product_id, parent_relationship_type) WHERE parent_relationship_type = 'variant';

-- Comment for clarity
COMMENT ON COLUMN public.products.is_master_device IS 'Designates this product as the master/parent device in a product family. Variants inherit data from the master.';
COMMENT ON COLUMN public.products.parent_relationship_type IS 'Distinguishes whether parent_product_id represents a line extension or a variant (delta-only inheritance) relationship.';