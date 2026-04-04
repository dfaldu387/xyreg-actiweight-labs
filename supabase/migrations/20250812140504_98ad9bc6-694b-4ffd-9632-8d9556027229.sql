
-- Create or replace a public view that exposes eudamed.medical_devices
-- This avoids duplicating data and lets the frontend read EUDAMED info safely.
-- We also grant read privileges to the anon/authenticated roles.

-- Safety: drop the view if it exists so we can recreate it cleanly
DROP VIEW IF EXISTS public.eudamed_medical_devices;

-- Create the view with the full set of columns we rely on today
CREATE VIEW public.eudamed_medical_devices AS
SELECT
  md.udi_di,
  md.organization,
  md.id_srn,
  md.organization_status,
  md.address,
  md.postcode,
  md.country,
  md.phone,
  md.email,
  md.website,
  md.prrc_first_name,
  md.prrc_last_name,
  md.prrc_email,
  md.prrc_phone,
  md.prrc_responsible_for,
  md.prrc_address,
  md.prrc_postcode,
  md.prrc_country,
  md.ca_name,
  md.ca_address,
  md.ca_postcode,
  md.ca_country,
  md.ca_email,
  md.ca_phone,
  md.applicable_legislation,
  md.basic_udi_di_code,
  md.risk_class,
  md.implantable,
  md.measuring,
  md.reusable,
  md.active,
  md.administering_medicine,
  md.device_model,
  md.device_name,
  md.issuing_agency,
  md.status,
  md.nomenclature_codes,
  md.trade_names,
  md.reference_number,
  md.direct_marking,
  md.quantity_of_device,
  md.single_use,
  md.max_reuses,
  md.sterilization_need,
  md.sterile,
  md.contain_latex,
  md.reprocessed,
  md.placed_on_the_market,
  md.market_distribution
FROM eudamed.medical_devices md;

-- Ensure the standard supabase roles can read from the view
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.eudamed_medical_devices TO anon, authenticated;
