
-- Create enums for BOM item categorization
CREATE TYPE public.bom_item_category AS ENUM ('purchased_part', 'manufactured_part', 'raw_material', 'sub_assembly', 'consumable');
CREATE TYPE public.bom_patient_contact AS ENUM ('direct', 'indirect', 'none');
CREATE TYPE public.bom_certificate_required AS ENUM ('coa', 'coc', 'both', 'none');

-- Add medtech-specific columns to bom_items
ALTER TABLE public.bom_items
  ADD COLUMN category public.bom_item_category DEFAULT 'purchased_part',
  ADD COLUMN material_name text,
  ADD COLUMN material_specification text,
  ADD COLUMN patient_contact public.bom_patient_contact DEFAULT 'none',
  ADD COLUMN biocompatibility_notes text,
  ADD COLUMN certificate_required public.bom_certificate_required DEFAULT 'none',
  ADD COLUMN internal_part_number text,
  ADD COLUMN reference_designator text,
  ADD COLUMN sterilization_compatible text,
  ADD COLUMN shelf_life_days integer;
