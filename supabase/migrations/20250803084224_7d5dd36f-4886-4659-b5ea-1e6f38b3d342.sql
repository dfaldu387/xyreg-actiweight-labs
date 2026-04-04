-- Drop the existing eudamed_device_registry table and recreate with new structure
DROP TABLE IF EXISTS public.eudamed_device_registry CASCADE;

-- Create the new eudamed_device_registry table with UDI_DI as primary key
CREATE TABLE public.eudamed_device_registry (
  UDI_DI text PRIMARY KEY,
  Organization text,
  ID_SRN text,
  Organization_Status text,
  Address text,
  Postcode text,
  Country text,
  Phone text,
  Email text,
  Website text,
  PRRC_First_name text,
  PRRC_Last_name text,
  PRRC_Email text,
  PRRC_Phone text,
  PRRC_Responsible_for text,
  PRRC_Address text,
  PRRC_Postcode text,
  PRRC_Country text,
  CA_Name text,
  CA_Address text,
  CA_Postcode text,
  CA_Country text,
  CA_Email text,
  CA_Phone text,
  Applicable_legislation text,
  Basic_UDI_DI_code text,
  Risk_class text,
  Implantable text,
  Measuring text,
  Reusable text,
  Active text,
  Administering_Medicine text,
  Device_model text,
  Device_name text,
  Issuing_agency text,
  Status text,
  Nomenclature_codes text,
  Trade_names text,
  Reference_number text,
  Direct_marking text,
  Quantity_of_device text,
  Single_use text,
  Max_reuses text,
  Sterilization_need text,
  Sterile text,
  Contain_latex text,
  Reprocessed text,
  Placed_on_the_market text,
  Market_distribution text
);

-- Create indexes for better query performance
CREATE INDEX idx_eudamed_organization ON public.eudamed_device_registry(Organization);
CREATE INDEX idx_eudamed_risk_class ON public.eudamed_device_registry(Risk_class);
CREATE INDEX idx_eudamed_country ON public.eudamed_device_registry(Country);
CREATE INDEX idx_eudamed_device_name ON public.eudamed_device_registry(Device_name);
CREATE INDEX idx_eudamed_basic_udi_di ON public.eudamed_device_registry(Basic_UDI_DI_code);

-- Enable Row Level Security
ALTER TABLE public.eudamed_device_registry ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to all authenticated users
CREATE POLICY "Allow read access to eudamed registry" 
ON public.eudamed_device_registry 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policy to allow insert for authenticated users (for CSV uploads)
CREATE POLICY "Allow insert to eudamed registry" 
ON public.eudamed_device_registry 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);