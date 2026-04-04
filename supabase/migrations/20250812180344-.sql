-- Enforce uniqueness to prevent future duplicates
-- 1) Unique SRN per company (ignore NULL srn)
CREATE UNIQUE INDEX IF NOT EXISTS companies_srn_unique_idx
ON public.companies (srn)
WHERE srn IS NOT NULL;

-- 2) Unique UDI-DI per company for products (ignore NULL udi_di)
CREATE UNIQUE INDEX IF NOT EXISTS products_company_udi_unique_idx
ON public.products (company_id, udi_di)
WHERE udi_di IS NOT NULL;

-- 3) Unique Basic UDI-DI per company for products (ignore NULL basic_udi_di)
CREATE UNIQUE INDEX IF NOT EXISTS products_company_basic_udi_unique_idx
ON public.products (company_id, basic_udi_di)
WHERE basic_udi_di IS NOT NULL;